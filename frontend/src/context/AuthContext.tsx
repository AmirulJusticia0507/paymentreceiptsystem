import { createContext, useContext, useState, type ReactNode } from 'react'
import api, { clearTokens, saveTokens, getTokens } from '../lib/api.ts'

interface AuthContextValue {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getTokens().access))

  async function login(username: string, password: string) {
    const { data } = await api.post<{ access: string; refresh: string }>('/api/token/', {
      username,
      password,
    })
    saveTokens(data.access, data.refresh)
    setIsAuthenticated(true)
  }

  function logout() {
    clearTokens()
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}