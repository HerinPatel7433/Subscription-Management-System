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
  status: 'draft' | 'quotation' | 'confirmed' | 'active' | 'closed' | 'paused'
  created_at: string
  lines?: SubscriptionLine[]
}

export interface QuotationTemplate {
  id: string
  name: string
  validityDays?: number      // Prisma camelCase
  validity_days?: number     // snake_case fallback
  planId?: string            // Prisma camelCase
  plan_id?: string           // snake_case fallback
  plan?: {
    id: string
    name: string
    billingPeriod: string
    price: number
  }
  lines?: {
    id?: string
    product_id?: string
    productId?: string
    product?: { id: string; name: string; type: string }
    quantity: number
    unit_price?: number
    unitPrice?: number
  }[]
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
export const userSubscribe = (data: { plan_id: string; services?: { product_id: string; quantity: number }[] }) =>
  api.post<{ success: boolean; data: Subscription; message: string }>('/subscriptions/subscribe', data)
export const updateSubscription = (id: string, data: Partial<Subscription>) =>
  api.put<Subscription>(`/subscriptions/${id}`, data)
const STATUS_ACTION_MAP: Partial<Record<Subscription['status'], string>> = {
  quotation: 'confirm',
  confirmed: 'confirm',
  active:    'activate',
  closed:    'close',
  paused:    'pause',
}

export const updateSubscriptionStatus = (
  id: string,
  status: Subscription['status']
): Promise<import('axios').AxiosResponse<Subscription>> => {
  const action = STATUS_ACTION_MAP[status]
  if (!action) {
    return Promise.reject(new Error(`No action mapped for status: ${status}`))
  }
  return api.post<Subscription>(`/subscriptions/${id}/${action}`)
}

export const resumeSubscription = (id: string) =>
  api.post<Subscription>(`/subscriptions/${id}/resume`)

export const renewSubscription = (id: string) =>
  api.post<Subscription>(`/subscriptions/${id}/renew`)
export const generateInvoice = (id: string) =>
  api.post(`/invoices/generate/${id}`)

// ── Quotation Templates ───────────────────────────────────────────────

export const getTemplates = () => api.get<QuotationTemplate[]>('/templates')

export const getTemplate = (id: string) =>
  api.get<QuotationTemplate>(`/templates/${id}`)

export const createTemplate = (data: Partial<QuotationTemplate>) =>
  api.post<QuotationTemplate>('/templates', data)

export const updateTemplate = (id: string, data: Partial<QuotationTemplate>) =>
  api.put<QuotationTemplate>(`/templates/${id}`, data)

export const deleteTemplate = (id: string) =>
  api.delete(`/templates/${id}`)

export const addTemplateLine = (
  templateId: string,
  data: { product_id: string; quantity: number; unit_price: number }
) => api.post(`/templates/${templateId}/lines`, data)

export const deleteTemplateLine = (templateId: string, lineId: string) =>
  api.delete(`/templates/${templateId}/lines/${lineId}`)

// ── Users ─────────────────────────────────────────────────────────────

export const getUsers = () => api.get<User[]>('/users')
export const createUser = (data: Partial<User> & { password?: string }) => api.post<User>('/users', data)
