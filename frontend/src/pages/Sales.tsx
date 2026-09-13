import { useState, type FormEvent } from 'react'
import api from '../lib/api.ts'
import { useFetch } from '../lib/useFetch.ts'
import type { Product, Sale, SaleItemInput } from '../lib/types.ts'
import {
  Table,
  Td,
  Button,
  ButtonGhost,
  Input,
  Select,
  Modal,
  Card,
  ErrorState,
  EmptyState,
  formatIDR,
  formatDate,
} from '../components/ui.tsx'

interface ItemRow extends SaleItemInput {
  key: number
}

function productTotal(sale: Sale) {
  return sale.items.reduce((sum, it) => sum + Number(it.subtotal), 0)
}

export default function Sales() {
  const { data, error, loading, reload } = useFetch<Sale[]>('/api/sales/sales/')
  const productsFetch = useFetch<Product[]>('/api/inventory/products/')

  const [modalOpen, setModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [rows, setRows] = useState<ItemRow[]>([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const products = productsFetch.data ?? []

  function openCreate() {
    setCustomerName('')
    setRows([{ key: Date.now(), product: null, quantity: 1, unit_price: '' }])
    setFormError(null)
    setModalOpen(true)
  }

  function updateRow(key: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function onProductChange(key: number, productId: string) {
    const product = products.find((p) => String(p.id) === productId)
    updateRow(key, { product: product ? product.id : null, unit_price: product ? product.price : '' })
  }

  function addRow() {
    setRows((prev) => [...prev, { key: Date.now(), product: null, quantity: 1, unit_price: '' }])
  }

  function removeRow(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  const grandTotal = rows.reduce((sum, r) => sum + Number(r.quantity) * Number(r.unit_price || 0), 0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (rows.some((r) => !r.product || Number(r.quantity) <= 0)) {
      setFormError('Setiap baris harus memilih produk dan qty lebih dari 0.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await api.post('/api/sales/sales/', {
        customer_name: customerName,
        items: rows.map(({ key: _key, ...item }) => item),
      })
      setModalOpen(false)
      reload()
    } catch {
      setFormError('Gagal menyimpan penjualan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Penjualan</h1>
        <Button onClick={openCreate} disabled={products.length === 0}>
          + Buat Penjualan
        </Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Card>
          {loading ? (
            <div className="h-40 animate-pulse rounded bg-slate-200" />
          ) : !data || data.length === 0 ? (
            <EmptyState message="Belum ada penjualan." />
          ) : (
            <Table headers={['No. Resi', 'Pelanggan', 'Tanggal', 'Item', 'Total']}>
              {data.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <Td className="font-medium">{sale.receipt_number}</Td>
                  <Td>{sale.customer_name}</Td>
                  <Td className="text-slate-500">{formatDate(sale.created_at)}</Td>
                  <Td>{sale.items.length} item</Td>
                  <Td className="font-semibold">{formatIDR(productTotal(sale))}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {modalOpen && (
        <Modal title="Buat Penjualan" onClose={() => setModalOpen(false)}>
          {products.length === 0 && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Tidak ada produk tersedia. Tambahkan produk terlebih dahulu.
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nama Pelanggan</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="cth: Budi"
                required
              />
            </div>

            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.key} className="flex items-center gap-2">
                  <Select value={row.product ? String(row.product) : ''} onChange={(e) => onProductChange(row.key, e.target.value)} required>
                    <option value="">Pilih produk…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatIDR(p.price)}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => updateRow(row.key, { quantity: Number(e.target.value) })}
                    className="w-20"
                    title="Qty"
                  />
                  <span className="w-24 text-right text-sm text-slate-600">
                    {formatIDR(Number(row.quantity) * Number(row.unit_price || 0))}
                  </span>
                  <ButtonGhost type="button" className="px-2 text-rose-500 hover:bg-rose-50" onClick={() => removeRow(row.key)}>
                    ✕
                  </ButtonGhost>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <ButtonGhost type="button" onClick={addRow}>
                + Tambah Item
              </ButtonGhost>
              <p className="text-sm">
                Total: <span className="text-base font-bold text-slate-900">{formatIDR(grandTotal)}</span>
              </p>
            </div>

            {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <ButtonGhost type="button" onClick={() => setModalOpen(false)}>
                Batal
              </ButtonGhost>
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan…' : 'Simpan Penjualan'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}