import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000'

export const TOKEN_KEYS = { access: 'prs_access', refresh: 'prs_refresh' } as const

export function getTokens() {
  return {
    access: localStorage.getItem(TOKEN_KEYS.access),
    refresh: localStorage.getItem(TOKEN_KEYS.refresh),
  }
}

export function saveTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEYS.access, access)
  localStorage.setItem(TOKEN_KEYS.refresh, refresh)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEYS.access)
  localStorage.removeItem(TOKEN_KEYS.refresh)
}

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { access } = getTokens()
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const { refresh } = getTokens()

    if (error.response?.status === 401 && original && !original._retry && refresh) {
      original._retry = true
      try {
        const { data } = await axios.post<{ access: string }>(`${API_URL}/api/token/refresh/`, {
          refresh,
        })
        saveTokens(data.access, refresh)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        clearTokens()
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api