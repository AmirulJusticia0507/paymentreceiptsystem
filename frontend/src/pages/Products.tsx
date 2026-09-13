import { useState, type FormEvent } from 'react'
import api from '../lib/api.ts'
import { useFetch } from '../lib/useFetch.ts'
import type { Product } from '../lib/types.ts'
import {
  Table,
  Td,
  Button,
  ButtonGhost,
  Input,
  Modal,
  Card,
  ErrorState,
  EmptyState,
  formatIDR,
} from '../components/ui.tsx'

interface ProductFormData {
  name: string
  stock: string
  price: string
}

const emptyForm = (): ProductFormData => ({ name: '', stock: '', price: '' })

export default function Products() {
  const { data, error, loading, reload } = useFetch<Product[]>('/api/inventory/products/')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormData>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({ name: p.name, stock: String(p.stock), price: p.price })
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload = { name: form.name, stock: Number(form.stock), price: form.price }
      if (editing) {
        await api.patch(`/api/inventory/products/${editing.id}/`, payload)
      } else {
        await api.post('/api/inventory/products/', payload)
      }
      setModalOpen(false)
      reload()
    } catch {
      setFormError('Gagal menyimpan produk. Periksa kembali isian.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await api.delete(`/api/inventory/products/${deleting.id}/`)
      setDeleting(null)
      reload()
    } catch {
      setFormError('Gagal menghapus produk.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Produk</h1>
        <Button onClick={openCreate}>+ Tambah Produk</Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Card>
          {loading ? (
            <div className="h-40 animate-pulse rounded bg-slate-200" />
          ) : !data || data.length === 0 ? (
            <EmptyState message="Belum ada produk. Klik '+ Tambah Produk'." />
          ) : (
            <Table headers={['Nama', 'Stok', 'Harga', 'Aksi']}>
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <Td className="font-medium">{p.name}</Td>
                  <Td>
                    <span className={p.stock <= 0 ? 'text-rose-600' : ''}>{p.stock}</span>
                  </Td>
                  <Td>{formatIDR(p.price)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <ButtonGhost onClick={() => openEdit(p)}>Edit</ButtonGhost>
                      <ButtonGhost className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => setDeleting(p)}>
                        Hapus
                      </ButtonGhost>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {modalOpen && (
        <Modal title={editing ? `Edit Produk: ${editing.name}` : 'Tambah Produk'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nama</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Stok</label>
              <Input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Harga (Rp)</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
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

      {deleting && (
        <Modal title="Hapus Produk" onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-600">
            Yakin hapus produk <strong>{deleting.name}</strong>? Tindakan ini tidak bisa dibatalkan.
          </p>
          {formError && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}
          <div className="flex justify-end gap-2 pt-4">
            <ButtonGhost onClick={() => setDeleting(null)}>Batal</ButtonGhost>
            <Button className="bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>
              Hapus
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}