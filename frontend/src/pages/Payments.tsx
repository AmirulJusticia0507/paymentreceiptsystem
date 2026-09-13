import { useState, type FormEvent } from 'react'
import api from '../lib/api.ts'
import { useFetch } from '../lib/useFetch.ts'
import type { Payment, PaymentMethod, PaymentStatus, Sale } from '../lib/types.ts'
import {
  Table,
  Td,
  Button,
  ButtonGhost,
  Input,
  Select,
  Modal,
  Card,
  Badge,
  ErrorState,
  EmptyState,
  formatIDR,
  formatDate,
} from '../components/ui.tsx'

const METHOD_OPTIONS: PaymentMethod[] = ['CASH', 'TRANSFER', 'CARD', 'QRIS']
const STATUS_OPTIONS: PaymentStatus[] = ['PAID', 'PENDING', 'REFUNDED']

const statusTone: Record<PaymentStatus, 'green' | 'amber' | 'red'> = {
  PAID: 'green',
  PENDING: 'amber',
  REFUNDED: 'red',
}

export default function Payments() {
  const { data, error, loading, reload } = useFetch<Payment[]>('/api/finance/payments/')
  const salesFetch = useFetch<Sale[]>('/api/sales/sales/')
  const sales = salesFetch.data ?? []

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    sale: '',
    amount: '',
    method: 'CASH' as PaymentMethod,
    status: 'PAID' as PaymentStatus,
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function openCreate() {
    setForm({ sale: '', amount: '', method: 'CASH', status: 'PAID', notes: '' })
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await api.post('/api/finance/payments/', {
        sale: Number(form.sale),
        amount: form.amount,
        method: form.method,
        status: form.status,
        notes: form.notes,
      })
      setModalOpen(false)
      reload()
    } catch {
      setFormError('Gagal menyimpan pembayaran.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(p: Payment) {
    if (!window.confirm(`Hapus pembayaran untuk ${p.sale}?`)) return
    try {
      await api.delete(`/api/finance/payments/${p.id}/`)
      reload()
    } catch {
      setFormError('Gagal menghapus pembayaran.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Pembayaran</h1>
        <Button onClick={openCreate} disabled={sales.length === 0}>
          + Catat Pembayaran
        </Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Card>
          {loading ? (
            <div className="h-40 animate-pulse rounded bg-slate-200" />
          ) : !data || data.length === 0 ? (
            <EmptyState message="Belum ada pembayaran." />
          ) : (
            <Table headers={['No. Transaksi', 'Metode', 'Status', 'Jumlah', 'Waktu', 'Aksi']}>
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <Td className="font-medium">#{p.sale}</Td>
                  <Td>{p.method}</Td>
                  <Td>
                    <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                  </Td>
                  <Td className="font-semibold">{formatIDR(p.amount)}</Td>
                  <Td className="text-slate-500">{formatDate(p.paid_at)}</Td>
                  <Td>
                    <ButtonGhost className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(p)}>
                      Hapus
                    </ButtonGhost>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {modalOpen && (
        <Modal title="Catat Pembayaran" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Transaksi Penjualan</label>
              <Select
                value={form.sale}
                onChange={(e) => {
                  const sale = sales.find((s) => String(s.id) === e.target.value)
                  setForm({
                    ...form,
                    sale: e.target.value,
                    amount: sale ? String(sale.items.reduce((sum, it) => sum + Number(it.subtotal), 0)) : form.amount,
                  })
                }}
                required
              >
                <option value="">Pilih transaksi…</option>
                {sales.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} — {s.customer_name} ({s.receipt_number})
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Jumlah (Rp)</label>
                <Input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Metode</label>
                <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}>
                  {METHOD_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PaymentStatus })}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Catatan</label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="opsional" />
              </div>
            </div>

            {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <ButtonGhost type="button" onClick={() => setModalOpen(false)}>
                Batal
              </ButtonGhost>
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}