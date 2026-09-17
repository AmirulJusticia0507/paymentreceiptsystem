import { useEffect, useRef, useState, type FormEvent } from 'react'
import api from '../lib/api.ts'

interface Message {
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

const SUGGESTIONS = [
  'Berapa laba bersih toko?',
  'Produk apa yang paling laris?',
  'Stok produk apa yang menipis?',
  'Bagaimana tren penjualan minggu ini?',
]

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    const question = text.trim()
    if (!question || loading) return
    setMessages((m) => [...m, { role: 'user', content: question }])
    setInput('')
    setLoading(true)
    try {
      const res = await api.post<{ reply: string }>('/api/ai/chat/', { message: question })
      setMessages((m) => [...m, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Gagal menghubungi asisten AI. Pastikan OmniRoute aktif.', error: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    send(input)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-3xl flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Asisten AI</h1>
          <p className="text-sm text-slate-500">Tanya data bisnis: penjualan, laba, stok, tren — jawaban dari data nyata.</p>
        </div>
      </div>

      <div ref={scrollRef} className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
            <p className="text-sm text-slate-500">Mulai dengan bertanya, contoh:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : m.error
                    ? 'border border-rose-200 bg-rose-50 text-rose-700'
                    : 'border border-slate-200 bg-slate-50 text-slate-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.3s]" />
              </span>
              Mengetik…
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan apa saja soal bisnis…"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
    </div>
  )
}