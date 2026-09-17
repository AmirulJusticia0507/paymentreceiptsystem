export interface Product {
  id: number
  name: string
  stock: number
  price: string
  description: string
}

export interface SaleItem {
  id: number
  product: number | null
  product_name?: string
  quantity: number
  unit_price: string
  subtotal: string
}

export interface SaleItemInput {
  product: number | null
  quantity: number
  unit_price: string
}

export interface Sale {
  id: number
  receipt_number: string
  customer_name: string
  created_at: string
  items: SaleItem[]
}

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'QRIS'
export type PaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED'

export interface Payment {
  id: number
  sale: number
  amount: string
  method: PaymentMethod
  status: PaymentStatus
  paid_at: string
  notes: string
  created_at: string
}

export type ExpenseCategory = 'OPERATIONAL' | 'PURCHASE' | 'UTILITY' | 'SALARY' | 'OTHER'

export interface Expense {
  id: number
  description: string
  amount: string
  category: ExpenseCategory
  created_at: string
}

export interface SaleMini {
  id: number
  receipt_number: string
  customer_name: string
  created_at: string
  items: SaleItem[]
}

export interface Laporan {
  id: number
  user_name: string
  nik: string
  sale: number
  sale_data: SaleMini
  status: string
  total: string
  ai_summary: string
  created_at: string
  approved_at: string | null
}

export interface ReportSummary {
  total_sales: number
  total_revenue: string
  total_expenses: string
  net_profit: string
  products_sold: number
}

export interface DayAggregate {
  day: string | null
  sales?: number
  revenue?: string
}

export interface Tokens {
  access: string
  refresh: string
}