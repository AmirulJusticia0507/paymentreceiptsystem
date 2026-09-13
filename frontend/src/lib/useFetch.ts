import { useCallback, useEffect, useState } from 'react'
import api from './api.ts'

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<T>(url)
      setData(res.data)
    } catch {
      setError('Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, error, loading, reload }
}