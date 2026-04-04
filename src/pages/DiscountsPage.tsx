import { useState, useEffect, useCallback } from 'react'
import { Plus, Tag, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import Modal from '@/components/Modal'
import { Toast, useToast } from '@/components/Toast'
import {
  getDiscounts, createDiscount, updateDiscount, deleteDiscount,
  type Discount, type DiscountType,
} from '@/services/billingService'
import { getPlans } from '@/services/subscriptionService'
import type { RecurringPlan } from '@/services/subscriptionService'

const MOCK_DISCOUNTS: Discount[] = [
  { id: '1', name: 'New Year Launch', type: 'percent', value: 20, start_date: '2025-01-01', end_date: '2025-01-31', usage_limit: 100, usage_count: 34, applies_to: 'all', applies_to_name: 'All Plans', active: true },
  { id: '2', name: 'Annual Flat Off',  type: 'fixed',   value: 500, usage_limit: undefined, usage_count: 12, applies_to: 'p1', applies_to_name: 'Pro Plan', active: true },
  { id: '3', name: 'Summer Offer',     type: 'percent', value: 15, start_date: '2025-06-01', end_date: '2025-08-31', usage_count: 0, applies_to: 'all', applies_to_name: 'All Plans', active: false },
]

type DiscountForm = {
  name: string
  type: DiscountType
  value: number
  start_date?: string
  end_date?: string
  usage_limit?: number
  applies_to: string
}

export default function DiscountsPage() {
  const { toasts, toast, dismiss } = useToast()
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [plans, setPlans] = useState<RecurringPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Discount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<DiscountForm>({
    defaultValues: { type: 'percent', applies_to: 'all' },
  })
  const discountType = watch('type')

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [disc, ps] = await Promise.all([getDiscounts(), getPlans()])
      setDiscounts(disc.data.length ? disc.data : MOCK_DISCOUNTS)
      setPlans(ps.data)
    } catch {
      setDiscounts(MOCK_DISCOUNTS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openCreate = () => {
    setEditing(null)
    reset({ type: 'percent', applies_to: 'all' })
    setModalOpen(true)
  }

  const openEdit = (d: Discount) => {
    setEditing(d)
    reset({
      name: d.name, type: d.type, value: d.value,
      start_date: d.start_date, end_date: d.end_date,
      usage_limit: d.usage_limit, applies_to: d.applies_to ?? 'all',
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: DiscountForm) => {
    try {
      const payload = { ...data, value: Number(data.value), usage_limit: data.usage_limit ? Number(data.usage_limit) : undefined }
      if (editing) {
        await updateDiscount(editing.id, payload)
        toast('success', 'Discount updated')
      } else {
        await createDiscount(payload)
        toast('success', 'Discount created')
      }
      setModalOpen(false)
      fetchAll()
    } catch {
      toast('error', 'Failed to save discount')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteDiscount(deleteTarget.id)
      toast('success', 'Discount deleted')
      setDeleteTarget(null)
      fetchAll()
    } catch {
      toast('error', 'Failed to delete')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
            <Tag size={18} className="text-rose-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Discounts</h1>
            <p className="text-xs text-slate-500">{discounts.length} rules configured</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-colors shadow-glow"
        >
          <Plus size={15} /> Add Discount
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Name', 'Type', 'Value', 'Date Range', 'Usage', 'Applies To', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
              ) : discounts.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No discounts yet</td></tr>
              ) : discounts.map((d) => (
                <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{d.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium capitalize border ${d.type === 'percent' ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                      {d.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">
                    {d.type === 'percent' ? `${d.value}%` : `₹${d.value}`}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {d.start_date && d.end_date ? `${d.start_date} → ${d.end_date}` : d.start_date ?? d.end_date ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {d.usage_count ?? 0}{d.usage_limit ? ` / ${d.usage_limit}` : '  ∞'}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{d.applies_to_name ?? d.applies_to ?? 'All'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${d.active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-600/30 text-slate-400 border-slate-600/40'}`}>
                      {d.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(d)} className="text-slate-500 hover:text-primary-400 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(d)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Discount' : 'Add Discount'} width="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <input className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. Summer Sale 20%" {...register('name', { required: 'Required' })} />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type</label>
              <select className="form-input" {...register('type', { required: true })}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="form-label">{discountType === 'percent' ? 'Percentage (%)' : 'Fixed Amount (₹)'}</label>
              <input
                type="number" step="0.01" min="0"
                className={`form-input ${errors.value ? 'error' : ''}`}
                placeholder={discountType === 'percent' ? '10' : '500'}
                {...register('value', { required: 'Required', min: { value: 0, message: 'Must be ≥ 0' } })}
              />
              {errors.value && <p className="field-error">{errors.value.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date (optional)</label>
              <input type="date" className="form-input" {...register('start_date')} />
            </div>
            <div>
              <label className="form-label">End Date (optional)</label>
              <input type="date" className="form-input" {...register('end_date')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Usage Limit (optional)</label>
              <input type="number" min="1" className="form-input" placeholder="Unlimited" {...register('usage_limit')} />
            </div>
            <div>
              <label className="form-label">Applies To</label>
              <select className="form-input" {...register('applies_to')}>
                <option value="all">All Plans</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary py-2.5">
              {isSubmitting ? 'Saving…' : editing ? 'Update Discount' : 'Create Discount'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete Discount" width="max-w-sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">Delete "{deleteTarget?.name}"?</p>
              <p className="text-xs text-slate-400 mt-1">This action cannot be undone.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors">Delete</button>
          </div>
        </div>
      </Modal>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
