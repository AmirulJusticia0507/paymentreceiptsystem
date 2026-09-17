"""Membangun ringkasan konteks bisnis dari database untuk disuntikkan ke prompt AI."""
from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone

from finance.models import Expense, Payment
from inventory.models import Product
from sales.models import Sale, SaleItem


def build_business_context(*, days: int = 30) -> dict:
    cutoff = timezone.now() - timedelta(days=days)

    total_revenue = Payment.objects.filter(status='PAID', paid_at__gte=cutoff).aggregate(v=Sum('amount'))['v'] or Decimal('0')
    total_expenses = Expense.objects.filter(created_at__gte=cutoff).aggregate(v=Sum('amount'))['v'] or Decimal('0')

    top_products = (
        SaleItem.objects.filter(sale__created_at__gte=cutoff)
        .values('product__name')
        .annotate(qty=Sum('quantity'))
        .order_by('-qty')[:5]
    )

    low_stock = list(Product.objects.filter(stock__lte=10).values('name', 'stock'))

    recent_sales = []
    for sale in Sale.objects.filter(created_at__gte=cutoff).order_by('-created_at')[:5].prefetch_related('items', 'items__product'):
        recent_sales.append({
            'resi': sale.receipt_number,
            'pelanggan': sale.customer_name,
            'tanggal': sale.created_at.strftime('%d-%m-%Y'),
            'items': [
                {
                    'produk': item.product.name if item.product else '-',
                    'qty': item.quantity,
                    'subtotal': str(item.subtotal),
                }
                for item in sale.items.all()
            ],
        })

    return {
        'periode_hari': days,
        'total_penjualan': Sale.objects.filter(created_at__gte=cutoff).count(),
        'total_pendapatan': str(total_revenue),
        'total_pengeluaran': str(total_expenses),
        'laba_bersih': str(total_revenue - total_expenses),
        'produk_terlaris': list(top_products),
        'stok_menipis': low_stock,
        'transaksi_terbaru': recent_sales,
        'pengeluaran_per_kategori': list(
            Expense.objects.filter(created_at__gte=cutoff).values('category').annotate(total=Sum('amount'))
        ),
        'metode_pembayaran': list(
            Payment.objects.filter(status='PAID', paid_at__gte=cutoff).values('method').annotate(total=Sum('amount'))
        ),
    }