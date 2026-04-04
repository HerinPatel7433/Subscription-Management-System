import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import Modal from '@/components/Modal'
import { Toast, useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import {
  getSubscriptions, createSubscription, getPlans, getUsers, getTemplates,
  type Subscription, type RecurringPlan, type User, type QuotationTemplate, type SubscriptionLine,
} from '@/services/subscriptionService'
import { getProducts, type Product } from '@/services/subscriptionService'

type SubscriptionForm = {
  customer_id: string
  plan_id: string
  start_date: string
  expiration_date: string
  payment_terms: string
}

const STATUS_BADGE: Record<Subscription['status'], string> = {
  draft:     'bg-slate-600/40 text-slate-300 border-slate-500/40',
  quotation: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  confirmed: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  active:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed:    'bg-red-500/20 text-red-300 border-red-500/30',
  paused:    'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

export default function SubscriptionsPage() {
  const { isAdmin } = useAuth()
  const { toasts, toast, dismiss } = useToast()
  const navigate = useNavigate()

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<RecurringPlan[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [templates, setTemplates] = useState<QuotationTemplate[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  // Order lines state in the create modal
  const [orderLines, setOrderLines] = useState<SubscriptionLine[]>([])

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SubscriptionForm>()

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [subs, ps, us, tmpl, prods] = await Promise.all([
        getSubscriptions(), getPlans(), getUsers(), getTemplates(), getProducts(),
      ])
      setSubscriptions(subs.data)
      setPlans(ps.data)
      setUsers(us.data)
      setTemplates(tmpl.data)
      setProducts(prods.data)
    } catch {
      toast('error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openCreate = () => {
    reset({})
    setOrderLines([])
    setModalOpen(true)
  }

  const loadFromTemplate = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId)
    if (!tmpl) return
    setOrderLines(
      (tmpl.lines ?? []).map((l) => {
        const productId = l.product_id ?? l.productId ?? ''
        const unitPrice = l.unit_price ?? l.unitPrice ?? 0
        return {
          product_id: productId,
          quantity: l.quantity,
          unit_price: unitPrice,
          amount: l.quantity * unitPrice,
        }
      })
    )
  }

  const addOrderLine = () =>
    setOrderLines((prev) => [...prev, { product_id: '', quantity: 1, unit_price: 0, amount: 0 }])

  const removeOrderLine = (idx: number) =>
    setOrderLines((prev) => prev.filter((_, i) => i !== idx))

  const updateLine = (idx: number, field: keyof SubscriptionLine, value: string | number) => {
    setOrderLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l
        const updated = { ...l, [field]: value }
        updated.amount = updated.quantity * updated.unit_price
        return updated
      })
    )
  }

  const onSubmit = async (data: SubscriptionForm) => {
    try {
      await createSubscription({
        ...data,
        expiration_date: data.expiration_date || null,
        lines: orderLines,
      })
      toast('success', 'Subscription created')
      setModalOpen(false)
      fetchAll()
    } catch {
      toast('error', 'Failed to create subscription')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
            <RefreshCw size={18} className="text-primary-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Subscriptions</h1>
            <p className="text-xs text-slate-500">{subscriptions.length} total</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-colors shadow-glow"
          >
            <Plus size={15} /> New Subscription
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Sub #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Start</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : subscriptions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No subscriptions yet</td></tr>
              ) : subscriptions.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/subscriptions/${s.id}`)}
                  className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-primary-400 font-mono text-xs font-semibold">{s.subscription_number}</td>
                  <td className="px-4 py-3 text-white">{s.customer_name ?? s.customer_id}</td>
                  <td className="px-4 py-3 text-slate-300">{s.plan_name ?? s.plan_id}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{s.start_date}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{s.expiration_date ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium capitalize ${STATUS_BADGE[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Subscription Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Subscription" width="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Load from template */}
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/40">
            <span className="text-xs text-slate-400 whitespace-nowrap">Load template:</span>
            <select
              className="form-input py-1.5 text-xs flex-1"
              onChange={(e) => loadFromTemplate(e.target.value)}
              defaultValue=""
            >
              <option value="">— none —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Customer</label>
              <select className={`form-input ${errors.customer_id ? 'error' : ''}`} {...register('customer_id', { required: 'Required' })}>
                <option value="">Select customer</option>
                {users.filter((u) => u.role === 'portal').map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {errors.customer_id && <p className="field-error">{errors.customer_id.message}</p>}
            </div>
            <div>
              <label className="form-label">Plan</label>
              <select className={`form-input ${errors.plan_id ? 'error' : ''}`} {...register('plan_id', { required: 'Required' })}>
                <option value="">Select plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — ₹{p.price}/{p.billing_period}</option>
                ))}
              </select>
              {errors.plan_id && <p className="field-error">{errors.plan_id.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" className={`form-input ${errors.start_date ? 'error' : ''}`} {...register('start_date', { required: 'Required' })} />
              {errors.start_date && <p className="field-error">{errors.start_date.message}</p>}
            </div>
            <div>
              <label className="form-label">Expiration Date</label>
              <input type="date" className="form-input" {...register('expiration_date')} />
            </div>
          </div>

          <div>
            <label className="form-label">Payment Terms</label>
            <input className="form-input" {...register('payment_terms')} placeholder="e.g. Net 30" />
          </div>

          {/* Order lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Lines</p>
              <button type="button" onClick={addOrderLine} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
                <Plus size={12} /> Add Line
              </button>
            </div>
            <div className="border border-slate-700/40 rounded-xl overflow-hidden">
              {orderLines.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No order lines. Add one or load from a template.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-slate-800/40">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-400 font-medium">Product</th>
                      <th className="px-3 py-2 text-center text-slate-400 font-medium">Qty</th>
                      <th className="px-3 py-2 text-right text-slate-400 font-medium">Unit Price</th>
                      <th className="px-3 py-2 text-right text-slate-400 font-medium">Amount</th>
                      <th className="px-3 py-2 w-6" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/20">
                    {orderLines.map((line, idx) => (
                      <tr key={idx} className="bg-slate-800/20">
                        <td className="px-3 py-2">
                          <select
                            className="w-full bg-transparent text-white text-xs focus:outline-none"
                            value={line.product_id}
                            onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                          >
                            <option value="">Pick product</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min={1}
                            className="w-14 text-center bg-transparent text-white text-xs focus:outline-none border-b border-slate-600"
                            value={line.quantity}
                            onChange={(e) => updateLine(idx, 'quantity', +e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number" step="0.01"
                            className="w-20 text-right bg-transparent text-white text-xs focus:outline-none border-b border-slate-600"
                            value={line.unit_price}
                            onChange={(e) => updateLine(idx, 'unit_price', +e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-400 font-medium">
                          ₹{line.amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button type="button" onClick={() => removeOrderLine(idx)} className="text-slate-500 hover:text-red-400 transition-colors">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {orderLines.length > 0 && (
                    <tfoot className="bg-slate-800/40">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right text-slate-400 font-medium">Total</td>
                        <td className="px-3 py-2 text-right text-emerald-400 font-semibold">
                          ₹{orderLines.reduce((s, l) => s + l.amount, 0).toFixed(2)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary py-2.5">
              {isSubmitting ? 'Creating…' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
