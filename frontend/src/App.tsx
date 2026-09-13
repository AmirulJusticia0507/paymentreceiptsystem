import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import Layout from './components/Layout.tsx'
import Login from './pages/Login.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Products from './pages/Products.tsx'
import Sales from './pages/Sales.tsx'
import Payments from './pages/Payments.tsx'
import Expenses from './pages/Expenses.tsx'

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/expenses" element={<Expenses />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}