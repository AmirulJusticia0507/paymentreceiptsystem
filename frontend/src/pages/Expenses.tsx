import { useState, type FormEvent } from 'react'
import api from '../lib/api.ts'
import { useFetch } from '../lib/useFetch.ts'
import type { Expense, ExpenseCategory } from '../lib/types.ts'
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

const CATEGORY_OPTIONS: ExpenseCategory[] = ['OPERATIONAL', 'PURCHASE', 'UTILITY', 'SALARY', 'OTHER']

interface ExpenseFormData {
  description: string
  amount: string
  category: ExpenseCategory | ''
}

const emptyForm = (): ExpenseFormData => ({ description: '', amount: '', category: '' })

export default function Expenses() {
  const { data, error, loading, reload } = useFetch<Expense[]>('/api/finance/expenses/')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpenseFormData>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setFormError(null)
    setAiSuggestion(null)
    setModalOpen(true)
  }

  function openEdit(expense: Expense) {
    setEditing(expense)
    setForm({ description: expense.description, amount: expense.amount, category: expense.category })
    setFormError(null)
    setAiSuggestion(null)
    setModalOpen(true)
  }

  async function handleClassify() {
    if (!form.description.trim() || aiLoading) return
    setAiLoading(true)
    setFormError(null)
    setAiSuggestion(null)
    try {
      const res = await api.post<{ category: ExpenseCategory; reason: string }>('/api/ai/categorize-expense/', {
        description: form.description,
        amount: form.amount,
      })
      setForm((f) => ({ ...f, category: res.data.category }))
      setAiSuggestion(res.data.reason ? `Saran AI: ${res.data.category} — ${res.data.reason}` : `Saran AI: ${res.data.category}`)
    } catch {
      setFormError('Gagal klasifikasi AI.')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        await api.patch(`/api/finance/expenses/${editing.id}/`, form)
      } else {
        await api.post('/api/finance/expenses/', form)
      }
      setModalOpen(false)
      reload()
    } catch {
      setFormError('Gagal menyimpan pengeluaran.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(expense: Expense) {
    if (!window.confirm(`Hapus pengeluaran "${expense.description}"?`)) return
    try {
      await api.delete(`/api/finance/expenses/${expense.id}/`)
      reload()
    } catch {
      setFormError('Gagal menghapus pengeluaran.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Pengeluaran</h1>
        <Button onClick={openCreate}>+ Catat Pengeluaran</Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <Card>
          {loading ? (
            <div className="h-40 animate-pulse rounded bg-slate-200" />
          ) : !data || data.length === 0 ? (
            <EmptyState message="Belum ada pengeluaran." />
          ) : (
            <Table headers={['Deskripsi', 'Kategori', 'Jumlah', 'Tanggal', 'Aksi']}>
              {data.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <Td className="font-medium">{expense.description}</Td>
                  <Td>
                    <Badge>{expense.category}</Badge>
                  </Td>
                  <Td className="font-semibold">{formatIDR(expense.amount)}</Td>
                  <Td className="text-slate-500">{formatDate(expense.created_at)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <ButtonGhost onClick={() => openEdit(expense)}>Edit</ButtonGhost>
                      <ButtonGhost className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(expense)}>
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
        <Modal title={editing ? 'Edit Pengeluaran' : 'Catat Pengeluaran'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Jumlah (Rp)</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Kategori</label>
                <button
                  type="button"
                  onClick={handleClassify}
                  disabled={aiLoading || !form.description.trim()}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {aiLoading ? 'Menganalisis…' : '✨ Klasifikasi dengan AI'}
                </button>
              </div>
              {aiLoading && (
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.3s]" />
                  </span>
                  AI membaca deskripsi…
                </div>
              )}
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory | '' })}>
                <option value="">Auto (AI)</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              {aiSuggestion && <p className="mt-1 text-xs text-indigo-600">{aiSuggestion}</p>}
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