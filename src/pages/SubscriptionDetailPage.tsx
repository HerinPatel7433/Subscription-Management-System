import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, RefreshCw, CheckCircle, XCircle, Plus, Pencil, Save } from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import {
  getSubscription, updateSubscriptionStatus, resumeSubscription,
  generateInvoice, getProducts,
  type Subscription, type SubscriptionLine,
} from '@/services/subscriptionService'
import api from '@/services/api'

const STATUS_BADGE: Record<Subscription['status'], string> = {
  draft:     'bg-slate-600/40 text-slate-300 border-slate-500/40',
  quotation: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  confirmed: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  active:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed:    'bg-red-500/20 text-red-300 border-red-500/30',
  paused:    'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

const STATUS_ACTIONS: Record<Subscription['status'], Subscription['status'][]> = {
  draft:     ['quotation', 'confirmed'],
  quotation: ['confirmed'],
  confirmed: ['active', 'closed'],
  active:    ['closed', 'paused'],
  paused:    ['active'],
  closed:    [],
}

const ACTION_LABELS: Partial<Record<Subscription['status'], { label: string; icon: React.ReactNode; cls: string }>> = {
  quotation: { label: 'Send Quotation', icon: <FileText size={14} />,    cls: 'bg-sky-600 hover:bg-sky-500' },
  confirmed: { label: 'Confirm',        icon: <CheckCircle size={14} />, cls: 'bg-amber-600 hover:bg-amber-500' },
  active:    { label: 'Activate',       icon: <RefreshCw size={14} />,   cls: 'bg-emerald-600 hover:bg-emerald-500' },
  closed:    { label: 'Close',          icon: <XCircle size={14} />,     cls: 'bg-red-600 hover:bg-red-500' },
  paused:    { label: 'Pause',          icon: <RefreshCw size={14} />,   cls: 'bg-amber-600 hover:bg-amber-500' },
}

interface Product {
  id: string
  name: string
  sales_price: number
}

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { toasts, toast, dismiss } = useToast()

  const [sub, setSub] = useState<Subscription | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [lines, setLines] = useState<SubscriptionLine[]>([])
  const [editingLines, setEditingLines] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  const fetchSub = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const [subRes, prodRes] = await Promise.all([getSubscription(id), getProducts()])
      setSub(subRes.data)
      setLines(subRes.data.lines ?? [])
      setProducts(prodRes.data)
    } catch {
      toast('error', 'Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  useEffect(() => { fetchSub() }, [fetchSub])

  const changeStatus = async (newStatus: Subscription['status']) => {
    if (!id) return
    setActionLoading(true)
    try {
      await updateSubscriptionStatus(id, newStatus)
      toast('success', `Status updated to ${newStatus}`)
      fetchSub()
    } catch {
      toast('error', 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleGenerateInvoice = async () => {
    if (!id) return
    setInvoiceLoading(true)
    try {
      await generateInvoice(id)
      toast('success', 'Invoice generated successfully')
    } catch {
      toast('error', 'Failed to generate invoice')
    } finally {
      setInvoiceLoading(false)
    }
  }

  const saveLines = async () => {
    if (!id) return
    try {
      await api.put(`/subscriptions/${id}/lines`, { lines })
      toast('success', 'Order lines saved')
      setEditingLines(false)
      fetchSub()
    } catch {
      toast('error', 'Failed to save order lines')
    }
  }

  const addLine = () =>
    setLines((prev) => [...prev, { product_id: '', quantity: 1, unit_price: 0, amount: 0 }])

  const removeLine = (idx: number) =>
    setLines((prev) => prev.filter((_, i) => i !== idx))

  const updateLine = (idx: number, field: keyof SubscriptionLine, value: string | number) =>
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l
        const updated = { ...l, [field]: value }
        updated.amount = updated.quantity * updated.unit_price
        return updated
      })
    )

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-slate-500">Loading subscription…</div>
    </div>
  )

  if (!sub) return (
    <div className="p-6 text-center text-slate-500">Subscription not found</div>
  )

  const availableActions = STATUS_ACTIONS[sub.status] ?? []

  return (
    <div className="p-6 space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/subscriptions')} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-white font-mono">{sub.subscription_number}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium capitalize ${STATUS_BADGE[sub.status]}`}>
                {sub.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created {new Date(sub.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {availableActions.map((status) => {
              const action = ACTION_LABELS[status]
              if (!action) return null
              return (
                <button
                  key={status}
                  onClick={() => changeStatus(status)}
                  disabled={actionLoading}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-medium transition-colors disabled:opacity-50 ${action.cls}`}
                >
                  {action.icon} {action.label}
                </button>
              )
            })}
            {sub.status === 'paused' && (
              <button
                onClick={async () => {
                  setActionLoading(true)
                  try {
                    await resumeSubscription(id!)
                    toast('success', 'Subscription resumed')
                    fetchSub()
                  } catch {
                    toast('error', 'Failed to resume subscription')
                  } finally {
                    setActionLoading(false)
                  }
                }}
                disabled={actionLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} /> Resume
              </button>
            )}
            {(sub.status === 'active' || sub.status === 'confirmed') && (
              <button
                onClick={handleGenerateInvoice}
                disabled={invoiceLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium transition-colors disabled:opacity-50 shadow-glow"
              >
                <FileText size={14} /> {invoiceLoading ? 'Generating…' : 'Generate Invoice'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Customer', value: sub.customer_name ?? sub.customer_id },
          { label: 'Plan', value: sub.plan_name ?? sub.plan_id },
          { label: 'Start Date', value: sub.start_date },
          { label: 'Expiry Date', value: sub.expiration_date ?? '—' },
          { label: 'Payment Terms', value: sub.payment_terms ?? '—' },
        ].map((item) => (
          <div key={item.label} className="bg-[#131929] border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{item.label}</p>
            <p className="text-sm font-medium text-white truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Order Lines */}
      <div className="bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <h2 className="text-sm font-semibold text-white">Order Lines</h2>
          {isAdmin && (
            <div className="flex items-center gap-2">
              {editingLines ? (
                <>
                  <button onClick={addLine} className="flex items-center gap-1 text-xs px-3 py-1.5 text-primary-400 hover:text-primary-300 transition-colors">
                    <Plus size={12} /> Add
                  </button>
                  <button onClick={saveLines} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
                    <Save size={12} /> Save
                  </button>
                  <button onClick={() => { setEditingLines(false); setLines(sub.lines ?? []) }} className="text-xs px-3 py-1.5 text-slate-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setEditingLines(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                  <Pencil size={12} /> Edit Lines
                </button>
              )}
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/30">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Qty</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit Price</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                {editingLines && <th className="px-5 py-3 w-8" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {lines.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-500 text-xs">No order lines</td></tr>
              ) : lines.map((line, idx) => {
                const product = products.find((p) => p.id === line.product_id)
                return (
                  <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-3">
                      {editingLines ? (
                        <select
                          className="w-full bg-transparent text-white text-sm focus:outline-none border-b border-slate-600"
                          value={line.product_id}
                          onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                        >
                          <option value="">Pick product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-white">{product?.name ?? line.product_id}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {editingLines ? (
                        <input
                          type="number" min={1}
                          className="w-16 text-center bg-transparent text-white text-sm focus:outline-none border-b border-slate-600"
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, 'quantity', +e.target.value)}
                        />
                      ) : (
                        <span className="text-slate-300">{line.quantity}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {editingLines ? (
                        <input
                          type="number" step="0.01"
                          className="w-24 text-right bg-transparent text-white text-sm focus:outline-none border-b border-slate-600"
                          value={line.unit_price}
                          onChange={(e) => updateLine(idx, 'unit_price', +e.target.value)}
                        />
                      ) : (
                        <span className="text-slate-300">₹{Number(line.unit_price).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-emerald-400 font-medium">₹{Number(line.amount).toFixed(2)}</td>
                    {editingLines && (
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => removeLine(idx)} className="text-slate-500 hover:text-red-400 transition-colors">×</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
            {lines.length > 0 && (
              <tfoot className="bg-slate-800/30">
                <tr>
                  <td colSpan={editingLines ? 4 : 3} className="px-5 py-3 text-right text-slate-400 text-sm font-medium">Total</td>
                  <td className="px-5 py-3 text-right text-emerald-400 font-semibold">
                    ₹{lines.reduce((s, l) => s + Number(l.amount), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
