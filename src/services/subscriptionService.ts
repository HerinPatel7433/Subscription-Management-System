import api from './api'

// ── Types ────────────────────────────────────────────────────────────

export interface ProductVariant {
  id: string
  product_id: string
  attribute: string
  value: string
  extra_price: number
}

export interface Product {
  id: string
  name: string
  type: string
  sales_price: number
  cost_price: number
  created_by: string
  created_at: string
  variants?: ProductVariant[]
}

export interface RecurringPlan {
  id: string
  name: string
  price: number
  billing_period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  min_qty: number
  start_date: string | null
  end_date: string | null
  auto_close: boolean
  closable: boolean
  pausable: boolean
  renewable: boolean
}

export interface SubscriptionLine {
  id?: string
  product_id: string
  quantity: number
  unit_price: number
  tax_id?: string
  amount: number
}

export interface Subscription {
  id: string
  subscription_number: string
  customer_id: string
  customer_name?: string
  plan_id: string
  plan_name?: string
  start_date: string
  expiration_date: string | null
  payment_terms: string | null
  status: 'draft' | 'quotation' | 'confirmed' | 'active' | 'closed'
  created_at: string
  lines?: SubscriptionLine[]
}

export interface QuotationTemplate {
  id: string
  name: string
  validity_days: number
  plan_id: string
  lines?: { product_id: string; quantity: number; unit_price: number }[]
}

export interface User {
  id: string
  name: string
  email: string
  role: string
}

// ── Products ─────────────────────────────────────────────────────────

export const getProducts = () => api.get<Product[]>('/products')
export const createProduct = (data: Partial<Product>) => api.post<Product>('/products', data)
export const updateProduct = (id: string, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data)
export const deleteProduct = (id: string) => api.delete(`/products/${id}`)

export const getProductVariants = (productId: string) =>
  api.get<ProductVariant[]>(`/products/${productId}/variants`)
export const createVariant = (productId: string, data: Partial<ProductVariant>) =>
  api.post<ProductVariant>(`/products/${productId}/variants`, data)
export const deleteVariant = (productId: string, variantId: string) =>
  api.delete(`/products/${productId}/variants/${variantId}`)

// ── Plans ─────────────────────────────────────────────────────────────

export const getPlans = () => api.get<RecurringPlan[]>('/plans')
export const createPlan = (data: Partial<RecurringPlan>) => api.post<RecurringPlan>('/plans', data)
export const updatePlan = (id: string, data: Partial<RecurringPlan>) => api.put<RecurringPlan>(`/plans/${id}`, data)
export const deletePlan = (id: string) => api.delete(`/plans/${id}`)

// ── Subscriptions ─────────────────────────────────────────────────────

export const getSubscriptions = () => api.get<Subscription[]>('/subscriptions')
export const getSubscription = (id: string) => api.get<Subscription>(`/subscriptions/${id}`)
export const createSubscription = (data: Partial<Subscription> & { lines?: SubscriptionLine[] }) =>
  api.post<Subscription>('/subscriptions', data)
export const updateSubscription = (id: string, data: Partial<Subscription>) =>
  api.put<Subscription>(`/subscriptions/${id}`, data)
export const updateSubscriptionStatus = (id: string, status: Subscription['status']) =>
  api.patch<Subscription>(`/subscriptions/${id}/status`, { status })
export const generateInvoice = (id: string) =>
  api.post(`/invoices/generate/${id}`)

// ── Quotation Templates ───────────────────────────────────────────────

export const getTemplates = () => api.get<QuotationTemplate[]>('/quotation-templates')

// ── Users ─────────────────────────────────────────────────────────────

export const getUsers = () => api.get<User[]>('/users')
