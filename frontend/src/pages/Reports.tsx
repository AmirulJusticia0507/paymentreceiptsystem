import { useState, type FormEvent } from 'react'
import './Reports.css'
import api from '../lib/api.ts'
import { useFetch } from '../lib/useFetch.ts'
import type { Laporan } from '../lib/types.ts'
import {
  Button,
  ButtonGhost,
  Input,
  Select,
  Card,
  ErrorState,
  EmptyState,
  formatIDR,
} from '../components/ui.tsx'

const INSTITUSI = {
  nama: 'DINAS / PERUSAHAAN',
  alamat: 'Jalan Contoh Alamat Nomor 123, Kota',
  telepon: '(021) 1234-5678',
}

const STATUS_TONE: Record<string, 'green' | 'amber' | 'red'> = {
  DRAFT: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
}

function LaporanLetter({ laporan }: { laporan: Laporan }) {
  const items = laporan.sale_data.items
  const total = items.reduce((s, it) => s + Number(it.subtotal), 0)
  const date = new Date(laporan.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <section className="laporan-letter">
      <div className="letter-header">
        <div className="kop-line">
          <span className="kop-badge">📄</span>
          <div>
            <p className="kop-nama">{INSTITUSI.nama}</p>
            <p className="kop-alamat">{INSTITUSI.alamat} — {INSTITUSI.telepon}</p>
          </div>
        </div>
      </div>

      <header className="letter-title-section">
        <h1 className="letter-title">LAPORAN PEMBAYARAN</h1>
        <p className="letter-subtitle">Nomor: LPR-{String(laporan.id).padStart(5, '0')} / {new Date(laporan.created_at).getFullYear()}</p>
      </header>

      <div className="letter-meta">
        <div className="meta-row">
          <span className="meta-label">Nama</span>
          <span className="meta-value">{laporan.user_name}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">NIK</span>
          <span className="meta-value">{laporan.nik}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Tanggal</span>
          <span className="meta-value">{date}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">No. Resi</span>
          <span className="meta-value">{laporan.sale_data.receipt_number}</span>
        </div>
      </div>

      <div className="letter-divider" />

      <p className="letter-body">
        Berikut ini adalah data barang yang tercatat dalam transaksi penjualan dengan nomor resi{' '}
        <strong>{laporan.sale_data.receipt_number}</strong> atas nama pelanggan{' '}
        <strong>{laporan.sale_data.customer_name}</strong>, yang dilaporkan oleh pegawai tersebut di atas.
      </p>

      <table className="letter-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>No</th>
            <th>Nama Produk</th>
            <th style={{ width: 72, textAlign: 'center' }}>Qty</th>
            <th style={{ width: 120, textAlign: 'right' }}>Harga Satuan</th>
            <th style={{ width: 120, textAlign: 'right' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id}>
              <td>{i + 1}</td>
              <td>{it.product !== null ? it.product_name ?? 'Produk #' + it.product : '-'}</td>
              <td style={{ textAlign: 'center' }}>{it.quantity}</td>
              <td style={{ textAlign: 'right' }}>{formatIDR(it.unit_price)}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatIDR(it.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="letter-total-row">
            <td colSpan={4} className="text-right font-semibold">TOTAL</td>
            <td className="font-bold">{formatIDR(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="letter-body" style={{ marginTop: 24 }}>
        <p>Demikian laporan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</p>
      </div>

      <div className="signature-section">
        {[
          { label: 'Mengetahui / Menerima', name: 'General Affair' },
          { label: 'Menyetujui', name: 'Divisi Keuangan' },
          { label: 'Menyetujui', name: 'Direktur' },
        ].map((col) => (
          <div key={col.name} className="signature-col">
            <div className="signature-line" />
            <p className="signature-label">{col.label}</p>
            <p className="signature-name">{col.name}</p>
          </div>
        ))}
      </div>

      <footer className="letter-footer">
        <p>— Dokumen ini dibuat secara otomatis oleh sistem —</p>
      </footer>
    </section>
  )
}

export default function Reports() {
  const { data, error, loading, reload } = useFetch<Laporan[]>('/api/reports/laporans/')
  const salesFetch = useFetch<{ id: number; receipt_number: string; customer_name: string }[]>('/api/sales/sales/')

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState('')
  const [userName, setUserName] = useState('')
  const [nik, setNik] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [viewId, setViewId] = useState<number | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [liveSummary, setLiveSummary] = useState<string | null>(null)

  const sales = salesFetch.data ?? []

  async function handleGenerateSummary() {
    if (!viewLaporan || summaryLoading) return
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      const res = await api.post<{ summary: string; saved: boolean }>('/api/ai/summarize-report/', {
        laporan_id: viewLaporan.id,
        save: true,
      })
      setLiveSummary(res.data.summary)
      reload()
    } catch {
      setSummaryError('Gagal generate ringkasan AI.')
    } finally {
      setSummaryLoading(false)
    }
  }

  function openCreate() {
    setSelectedSale('')
    setUserName('')
    setNik('')
    setFormError(null)
    setViewId(null)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedSale || !userName || !nik) {
      setFormError('Lengkapi semua field.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const res = await api.post<Laporan>('/api/reports/laporans/', {
        sale: Number(selectedSale),
        user_name: userName,
        nik,
      })
      setModalOpen(false)
      setViewId(res.data.id)
      setLiveSummary(null)
      reload()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setFormError('Gagal membuat laporan.')
    } finally {
      setSaving(false)
    }
  }

  const viewLaporan = data?.find((l) => l.id === viewId) ?? null
  const viewing = viewLaporan !== null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Laporan</h1>
        <Button onClick={openCreate}>+ Buat Laporan</Button>
      </div>

      {viewing && viewLaporan && (
        <div className="printable-area">
          <div className="flex justify-end mb-3 print:hidden">
            <ButtonGhost onClick={() => setViewId(null)}>Kembali ke daftar</ButtonGhost>
          </div>
          <LaporanLetter laporan={viewLaporan} />

          {(liveSummary ?? viewLaporan.ai_summary) || summaryLoading || summaryError ? (
            <section className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5 print:hidden">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-indigo-900">Ringkasan AI</h3>
                {!summaryLoading && (
                  <Button onClick={handleGenerateSummary}>
                    {liveSummary || viewLaporan.ai_summary ? '↻ Buat Ulang' : '✨ Buat Ringkasan AI'}
                  </Button>
                )}
              </div>
              {summaryLoading ? (
                <p className="text-sm text-indigo-600">AI menyusun ringkasan…</p>
              ) : summaryError ? (
                <p className="text-sm text-rose-600">{summaryError}</p>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {liveSummary ?? viewLaporan.ai_summary}
                </p>
              )}
            </section>
          ) : (
            <div className="mt-6 flex justify-end print:hidden">
              <Button onClick={handleGenerateSummary} disabled={summaryLoading}>
                {summaryLoading ? 'Menyusun…' : '✨ Buat Ringkasan AI'}
              </Button>
            </div>
          )}
        </div>
      )}

      {!viewing && (
        <>
          <Card>
            {error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : loading ? (
              <div className="h-32 animate-pulse rounded bg-slate-200" />
            ) : !data || data.length === 0 ? (
              <EmptyState message="Belum ada laporan. Klik '+ Buat Laporan'." />
            ) : (
              <table className="w-full min-w-max text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Nomor</th>
                    <th className="px-3 py-3">Nama</th>
                    <th className="px-3 py-3">NIK</th>
                    <th className="px-3 py-3">No. Resi</th>
                    <th className="px-3 py-3">Tanggal</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setViewId(l.id); setLiveSummary(null) }}>
                      <td className="px-3 py-3 font-medium">#{l.id}</td>
                      <td className="px-3 py-3">{l.user_name}</td>
                      <td className="px-3 py-3">{l.nik}</td>
                      <td className="px-3 py-3">{l.sale_data.receipt_number}</td>
                      <td className="px-3 py-3 text-slate-500">{new Date(l.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STATUS_TONE[l.status] === 'green' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : STATUS_TONE[l.status] === 'amber' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-rose-50 text-rose-700 ring-rose-200'}`}>{l.status}</span></td>
                      <td className="px-3 py-3 font-semibold">{formatIDR(l.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setModalOpen(false)}>
              <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h3 className="text-sm font-semibold text-slate-800">Buat Laporan</h3>
                  <button className="text-slate-400 hover:text-slate-600" onClick={() => setModalOpen(false)} aria-label="Close">✕</button>
                </header>
                <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Transaksi Penjualan</label>
                    <Select value={selectedSale} onChange={(e) => setSelectedSale(e.target.value)} required>
                      <option value="">Pilih transaksi…</option>
                      {sales.map((s) => (
                        <option key={s.id} value={s.id}>{s.receipt_number} — {s.customer_name}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Nama</label>
                    <Input value={userName} onChange={(e) => setUserName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">NIK</label>
                    <Input value={nik} onChange={(e) => setNik(e.target.value)} required />
                  </div>
                  {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}
                  <div className="flex justify-end gap-2 pt-2">
                    <ButtonGhost type="button" onClick={() => setModalOpen(false)}>Batal</ButtonGhost>
                    <Button type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Buat Laporan'}</Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}