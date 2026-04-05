import api from './api'

// ── Invoice Types ─────────────────────────────────────────────────────

export interface InvoiceLine {
  id?: string
  product_id: string
  product_name?: string
  quantity: number
  unit_price: number
  tax_percent: number
  discount_percent: number
  total: number
}

export interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  customer_name?: string
  customer_email?: string
  subscription_id?: string
  amount: number
  status: 'draft' | 'confirmed' | 'paid' | 'cancelled'
  due_date: string
  issued_date: string
  notes?: string
  lines?: InvoiceLine[]
  grand_total?: number
}

// ── Payment Types ─────────────────────────────────────────────────────

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'upi' | 'other'

export interface Payment {
  id: string
  invoice_id: string
  invoice_number?: string
  customer_name?: string
  amount: number
  method: PaymentMethod        // returned by backend as 'method'
  payment_method?: PaymentMethod
  payment_date: string
  notes?: string
}

export interface RecordPaymentPayload {
  invoice_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  notes?: string
}

// ── Discount Types ────────────────────────────────────────────────────

export type DiscountType = 'fixed' | 'percent'

export interface Discount {
  id: string
  name: string
  type: DiscountType
  value: number
  start_date?: string
  end_date?: string
  usage_limit?: number
  usage_count?: number
  applies_to?: string   // plan id or 'all'
  applies_to_name?: string
  active: boolean
}

// ── Tax Types ─────────────────────────────────────────────────────────

export interface Tax {
  id: string
  name: string
  rate: number
  active: boolean
  created_at?: string
}

// ── Report Types ──────────────────────────────────────────────────────

export interface ReportSummary {
  active_subscriptions: number
  monthly_revenue: number
  pending_invoices: number
  overdue_invoices: number
}

export interface RevenueByMonth {
  month: string   // e.g. "Jan 2025"
  revenue: number
}

export interface TopCustomer {
  customer_id: string
  customer_name: string
  total_value: number
  active_subscriptions: number
}

// ── Invoice API ───────────────────────────────────────────────────────

export const getInvoices = (params?: Record<string, string>) =>
  api.get<Invoice[]>('/invoices', { params })

export const getInvoice = (id: string) =>
  api.get<Invoice>(`/invoices/${id}`)

export const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
  if (status === 'confirmed') {
    return api.post<Invoice>(`/invoices/${id}/confirm`)
  }
  if (status === 'cancelled') {
    return api.post<Invoice>(`/invoices/${id}/cancel`)
  }
  return Promise.reject(new Error(`Unsupported status update: ${status}`))
}

export const sendInvoiceEmail = (id: string) =>
  api.post(`/invoices/${id}/send`)

export const downloadInvoicePdf = (id: string) =>
  api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })

// ── Payment API ───────────────────────────────────────────────────────

export const getPayments = () =>
  api.get<Payment[]>('/payments')

export const recordPayment = (data: RecordPaymentPayload) =>
  api.post<Payment>('/payments', data)

export const getInvoiceBalance = () =>
  api.get<{ invoiceId: string; balanceDue: number }[]>('/payments/outstanding')

// ── Discount API ──────────────────────────────────────────────────────

export const getDiscounts = () =>
  api.get<Discount[]>('/discounts')

export const createDiscount = (data: Partial<Discount>) =>
  api.post<Discount>('/discounts', data)

export const updateDiscount = (id: string, data: Partial<Discount>) =>
  api.put<Discount>(`/discounts/${id}`, data)

export const deleteDiscount = (id: string) =>
  api.delete(`/discounts/${id}`)

// ── Tax API ───────────────────────────────────────────────────────────

export const getTaxes = () =>
  api.get<Tax[]>('/taxes')

export const createTax = (data: Partial<Tax>) =>
  api.post<Tax>('/taxes', data)

export const updateTax = (id: string, data: Partial<Tax>) =>
  api.put<Tax>(`/taxes/${id}`, data)

export const deleteTax = (id: string) =>
  api.delete(`/taxes/${id}`)

export const toggleTax = (id: string) =>
  api.patch<Tax>(`/taxes/${id}/toggle`)

// ── Reports API ───────────────────────────────────────────────────────

export const getReportSummary = (params?: Record<string, string>) =>
  api.get<ReportSummary>('/reports/summary', { params })

export const getRevenueByMonth = (params?: Record<string, string>) =>
  api.get<RevenueByMonth[]>('/reports/revenue-by-month', { params })

export const getTopCustomers = (params?: Record<string, string>) =>
  api.get<TopCustomer[]>('/reports/top-customers', { params })

// ── Dashboard Activity Types ──────────────────────────────────────────

export interface DashboardActivity {
  id: string
  type: 'subscription' | 'invoice'
  title: string
  subtitle: string
  status: string
  amount?: number
  date: string
  link: string
}

export interface SubscriptionStatusBreakdown {
  active: number
  draft: number
  closed: number
  confirmed: number
  quotation: number
}

// ── Dashboard API ─────────────────────────────────────────────────────

export const getDashboardActivity = () =>
  api.get<DashboardActivity[]>('/dashboard/activity')

export const getSubscriptionStatusBreakdown = () =>
  api.get<SubscriptionStatusBreakdown>('/dashboard/subscription-status')

export const triggerBillingJob = () =>
  api.post('/invoices/generate-all')
