import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState, type ReactElement } from 'react'
import { useAuth } from '../context/AuthContext.tsx'

interface NavItem {
  to: string
  label: string
  icon: ReactElement
}

const iconClass = 'h-4 w-4 shrink-0'

function DashboardIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10h14V10" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h2m3 0h4M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm3 5h4m6 3h2m-2-6h4" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/products', label: 'Produk', icon: <BoxIcon /> },
  { to: '/sales', label: 'Penjualan', icon: <ReceiptIcon /> },
  { to: '/payments', label: 'Pembayaran', icon: <CardIcon /> },
  { to: '/expenses', label: 'Pengeluaran', icon: <WalletIcon /> },
  { to: '/reports', label: 'Laporan', icon: <FileIcon /> },
  { to: '/ai', label: 'Asisten AI', icon: <SparkIcon /> },
]

export default function Layout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center border-b border-slate-800 px-3 py-4">
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Perluas menu' : 'Ciutkan menu'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
              />
            </svg>
          </button>
          <div className={`ml-2 min-w-0 ${collapsed ? 'hidden' : 'flex'} items-center gap-2`}>
            <span className="text-xl">🧾</span>
            <div>
              <p className="text-sm font-bold text-white">Payment Receipt</p>
              <p className="text-xs text-slate-500">System</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={handleLogout}
            title="Keluar"
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white ${
              collapsed ? 'justify-center px-2' : ''
            }`}
          >
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && 'Keluar'}
          </button>
        </div>
      </aside>

      <main className={`flex-1 p-6 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-60'}`}>
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}