"""Layanan akses OmniRoute AI Gateway (OpenAI-compatible).

Semua pemanggilan memakai endpoint `<OMNIROUTE_BASE_URL>/chat/completions`
dengan header `Authorization: Bearer <OMNIROUTE_API_KEY>`.

Resilien: mencoba model utama lalu model cadangan (`OMNIROUTE_FALLBACK_MODELS`),
tanpa retry internal SDK agar tidak menggantung lama saat provider down.
"""
import json

from django.conf import settings
from openai import OpenAI

from .context import build_business_context


class AIServiceError(Exception):
    pass


def _client(timeout: float | None = None) -> OpenAI:
    if not settings.OMNIROUTE_API_KEY:
        raise AIServiceError('OMNIROUTE_API_KEY belum dikonfigurasi di .env')
    return OpenAI(
        base_url=settings.OMNIROUTE_BASE_URL,
        api_key=settings.OMNIROUTE_API_KEY,
        timeout=timeout or settings.AI_TIMEOUT_SECONDS,
        max_retries=0,
    )


def _models() -> list[str]:
    primary = settings.OMNIROUTE_MODEL.strip()
    fallbacks = [m.strip() for m in settings.OMNIROUTE_FALLBACK_MODELS.split(',') if m.strip()]
    seen = []
    for model in [primary, *fallbacks]:
        if model and model not in seen:
            seen.append(model)
    return seen


def _attempt(messages: list[dict], *, timeout: float | None = None, **kwargs):
    errors: list[str] = []
    for model in _models():
        try:
            return _client(timeout).chat.completions.create(model=model, messages=messages, **kwargs)
        except AIServiceError:
            raise
        except Exception as exc:  # noqa: BLE001 - apapun dari gateway
            errors.append(f'{model}: {exc}')
    raise AIServiceError('Semua model OmniRoute gagal: ' + ' | '.join(errors))


def _extract_json(text: str) -> dict:
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if not match:
        raise AIServiceError('Respons AI tidak mengandung JSON.')
    return json.loads(match.group(0))


def chat(messages: list[dict], *, temperature: float = 0.3, max_tokens: int = 800,
         timeout: float | None = None) -> str:
    """Kirim percakapan (OpenAI format) dan kembalikan teks jawaban."""
    response = _attempt(messages, temperature=temperature, max_tokens=max_tokens, timeout=timeout)
    content = response.choices[0].message.content if response.choices else ''
    if not content:
        raise AIServiceError('OmniRoute mengembalikan jawaban kosong.')
    return content.strip()


def business_chat(question: str, *, days: int = 30) -> str:
    """Chatbot menjawab pertanyaan user berdasarkan data bisnis di database.

    Catatan: gateway AI yang dipakai sering mengabaikan system role, jadi seluruh
    instruksi persona + data diembed ke dalam user message.
    """
    context = build_business_context(days=days)
    context_json = json.dumps(context, ensure_ascii=False, default=str)

    user = (
        'Kamu adalah "Asisten Bisnis PR Company", analis penjualan yang ramah. '
        'User adalah pemilik/staf toko. Jawablah dalam Bahasa Indonesia yang ringkas, natural, dan membantu. '
        'Gunakan data JSON berikut sebagai satu-satunya sumber fakta. '
        'Jika data kosong/tidak memadai, katakan dengan jelas bahwa datanya belum tersedia. '
        'Format mata uang pakai Rupiah (Rp), misal "Rp 1.250.000". '
        'Jangan menyebut "berdasarkan data JSON", "berdasarkan data yang diberikan", atau detail teknis lain. '
        'Jangan bertanya balik. Boleh memberi saran singkat bila relevan (stok menipis, produk terlaris).\n\n'
        'Pertanyaan: {question}\n\n'
        'Data bisnis (JSON):\n```json\n{context}\n```'
    ).format(question=question, context=context_json)

    return chat([{'role': 'user', 'content': user}])


EXPENSE_CATEGORIES = ('OPERATIONAL', 'PURCHASE', 'UTILITY', 'SALARY', 'OTHER')

_CATEGORY_KEYWORDS = [
    ('SALARY', ('GAJI', 'UPAH', 'HONOR', 'TUNJANGAN', 'LEMBUR', 'KARYAWAN')),
    ('UTILITY', ('LISTRIK', 'AIR', 'WIFI', 'INTERNET', 'TAGIHAN', 'PULSA', 'TOKEN', 'PLN')),
    ('PURCHASE', ('BELI', 'PEMBELIAN', 'BELANJA', 'STOK', 'SUPPLIER', 'BARANG DAGANG', 'BAHAN')),
    ('OPERATIONAL', ('SEWA', 'BENSIN', 'BBM', 'ATK', 'ALAT TULIS', 'OPERASIONAL', 'KANTOR', 'TRANSPORT')),
]


def _normalize_category(raw: str) -> str:
    """Ekstrak kategori dari respons model (terima bentuk jawaban apa pun)."""
    upper = raw.upper()
    for category, keywords in _CATEGORY_KEYWORDS:
        for keyword in keywords:
            if keyword in upper:
                return category
    for category in EXPENSE_CATEGORIES:
        if category in upper:
            return category
    return 'OTHER'


def categorize_expense(description: str, amount: str | None = None, *, timeout: float | None = None) -> dict:
    """Klasifikasikan pengeluaran ke kategori Expense (best-effort)."""
    amount_line = f"\nJumlah: {amount}" if amount else ''
    user = (
        f'Klasifikasikan pengeluaran berikut ke TEPAT SATU kategori: OPERATIONAL, PURCHASE, UTILITY, SALARY, OTHER. '
        f'OPERATIONAL=operasional/harian kantor, PURCHASE=belanja barang dagang, '
        f'UTILITY=listrik/air/internet, SALARY=gaji/upah, OTHER=lain-lain. '
        f'Jawab HANYA dengan satu kata kategori. Jangan menambah kalimat lain.\n\n'
        f'Pengeluaran: {description}{amount_line}'
    )
    reply = chat([{'role': 'user', 'content': user}], temperature=0, max_tokens=20, timeout=timeout)
    return {
        'category': _normalize_category(reply),
        'reason': 'Diklasifikasikan otomatis oleh AI.',
    }


def product_description(name: str, price: str | None = None) -> str:
    """Hasilkan deskripsi pemasaran singkat untuk produk dengan nama tertentu."""
    price_line = f'\nHarga jual: {price}' if price else ''
    user = (
        'Kamu penulis deskripsi produk e-commerce. Tulis deskripsi produk berikut dalam SATU paragraf '
        '(2-3 kalimat) berbahasa Indonesia yang menarik, informatif, dan promosional. '
        'MULAI LANGSUNG dengan kalimat deskripsi, jangan tanya balik, jangan mengulang instruksi, '
        'jangan menyebut "Berikut deskripsi". Jangan menebak spesifikasi yang tidak disebutkan. '
        'Jangan pakai emoji, hashtag, atau markdown.\n\n'
        f'Nama produk: {name}{price_line}'
    )
    return chat([{'role': 'user', 'content': user}], temperature=0.6, max_tokens=300)


def summarize_report(sections: dict, *, title: str) -> str:
    """Susun narasi ringkasan laporan dari data seksi yang diberikan."""
    data = json.dumps(sections, ensure_ascii=False, default=str)
    user = (
        'Kamu menyusun ringkasan eksekutif laporan keuangan toko "PR Company" dalam Bahasa Indonesia. '
        'Format Rupiah misal "Rp 1.250.000". Struktur: pembuka (periode & konteks), poin utama '
        '(3-5 bullet berisi angka konkret), dan penutup/saran singkat. MULAI LANGSUNG dengan pembuka. '
        'Jangan tanya balik, jangan menyebut "berdasarkan data", jangan menanggapi instruksi ini. '
        'Panjang sekitar 150-200 kata.\n\n'
        f'Judul laporan: {title}\n\nData:\n```json\n{data}\n```'
    )
    return chat([{'role': 'user', 'content': user}], temperature=0.3, max_tokens=600)


def report_sections(laporan=None, *, days: int = 30) -> dict:
    """Kumpulkan seksi data untuk laporan ringkasan (opsional membawa 1 Laporan)."""
    from datetime import timedelta

    from django.db.models import Sum
    from django.utils import timezone

    from finance.models import Expense, Payment
    from inventory.models import Product
    from reports.models import Laporan
    from sales.models import Sale, SaleItem

    cutoff = timezone.now() - timedelta(days=days)

    paid = Payment.objects.filter(status='PAID')
    sections = {
        'periode_hari': days,
        'total_penjualan': Sale.objects.filter(created_at__gte=cutoff).count(),
        'pendapatan_paid': str(paid.filter(paid_at__gte=cutoff).aggregate(v=Sum('amount'))['v'] or 0),
        'pengeluaran': str(Expense.objects.filter(created_at__gte=cutoff).aggregate(v=Sum('amount'))['v'] or 0),
        'produk_terjual': str(SaleItem.objects.filter(sale__created_at__gte=cutoff).aggregate(v=Sum('quantity'))['v'] or 0),
        'produk_terlaris': list(
            SaleItem.objects.filter(sale__created_at__gte=cutoff)
            .values('product__name')
            .annotate(qty=Sum('quantity'))
            .order_by('-qty')[:5]
        ),
        'stok_menipis': list(Product.objects.filter(stock__lte=10).values('name', 'stock')[:5]),
        'pengeluaran_per_kategori': list(
            Expense.objects.filter(created_at__gte=cutoff).values('category').annotate(total=Sum('amount'))
        ),
        'metode_pembayaran': list(paid.filter(paid_at__gte=cutoff).values('method').annotate(total=Sum('amount'))),
        'jumlah_laporan': Laporan.objects.filter(created_at__gte=cutoff).count(),
    }
    if laporan is not None:
        items = laporan.sale.items.all()
        sections['laporan'] = {
            'id': laporan.id,
            'nama': laporan.user_name,
            'no_resi': laporan.sale.receipt_number,
            'items': [
                {
                    'produk': item.product.name if item.product else '-',
                    'qty': item.quantity,
                    'subtotal': str(item.subtotal),
                }
                for item in items
            ],
            'total': str(sum(item.subtotal for item in items)),
        }
    return sections