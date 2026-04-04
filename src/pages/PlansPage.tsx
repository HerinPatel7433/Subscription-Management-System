import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, CreditCard, Package } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import Modal from '@/components/Modal'
import Toggle from '@/components/Toggle'
import { Toast, useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { getPlans, createPlan, updatePlan, deletePlan, type RecurringPlan } from '@/services/subscriptionService'

type PlanForm = {
  name: string
  price: number
  billing_period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  min_qty: number
  start_date: string
  end_date: string
  auto_close: boolean
  closable: boolean
  pausable: boolean
  renewable: boolean
}

const PERIOD_COLORS: Record<string, string> = {
  daily: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  weekly: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  monthly: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  yearly: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

export default function PlansPage() {
  const { isAdmin } = useAuth()
  const { toasts, toast, dismiss } = useToast()
  const navigate = useNavigate()

  const [plans, setPlans] = useState<RecurringPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editPlan, setEditPlan] = useState<RecurringPlan | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<PlanForm>()

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getPlans()
      setPlans(res.data)
    } catch {
      toast('error', 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const openAdd = () => {
    setEditPlan(null)
    reset({ auto_close: false, closable: false, pausable: false, renewable: false, min_qty: 1 })
    setModalOpen(true)
  }

  const openEdit = (p: RecurringPlan) => {
    setEditPlan(p)
    reset({
      ...p,
      start_date: p.start_date ?? '',
      end_date: p.end_date ?? '',
    })
    setModalOpen(true)
  }

  const onSave = async (data: PlanForm) => {
    const payload = {
      ...data,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
    }
    try {
      if (editPlan) {
        await updatePlan(editPlan.id, payload)
        toast('success', 'Plan updated')
      } else {
        await createPlan(payload)
        toast('success', 'Plan created')
      }
      setModalOpen(false)
      fetchPlans()
    } catch {
      toast('error', 'Failed to save plan')
    }
  }

  const onDelete = async (id: string) => {
    try {
      await deletePlan(id)
      toast('success', 'Plan deleted')
      setDeleteConfirm(null)
      fetchPlans()
    } catch {
      toast('error', 'Failed to delete plan')
    }
  }

  const FlagBadge = ({ active, label }: { active: boolean; label: string }) => (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${active ? 'bg-primary-500/20 text-primary-300 border-primary-500/30' : 'bg-slate-700/30 text-slate-500 border-slate-600/30'}`}>
      {label}
    </span>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <CreditCard size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Recurring Plans</h1>
            <p className="text-xs text-slate-500">{plans.length} plans configured</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-colors shadow-glow"
            >
              <Plus size={15} /> Add Plan
            </button>
            <button
              onClick={() => navigate('/products')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-slate-300 text-xs font-medium rounded-xl transition-colors"
            >
              <Package size={14} /> Add Product
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan Name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Start</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">End</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Flags</th>
                {isAdmin && <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : plans.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No plans found</td></tr>
              ) : plans.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-semibold">₹{Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-lg border capitalize font-medium ${PERIOD_COLORS[p.billing_period] ?? ''}`}>
                      {p.billing_period}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{p.start_date ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{p.end_date ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <FlagBadge active={p.auto_close} label="Auto-close" />
                      <FlagBadge active={p.closable} label="Closable" />
                      <FlagBadge active={p.pausable} label="Pausable" />
                      <FlagBadge active={p.renewable} label="Renewable" />
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editPlan ? 'Edit Plan' : 'Add Recurring Plan'} width="max-w-xl">
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="form-label">Plan Name</label>
            <input className={`form-input ${errors.name ? 'error' : ''}`} {...register('name', { required: 'Required' })} placeholder="Pro Yearly" />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Price (₹)</label>
              <input type="number" step="0.01" className={`form-input ${errors.price ? 'error' : ''}`}
                {...register('price', { required: 'Required', valueAsNumber: true, min: { value: 0, message: 'Must be ≥ 0' } })} placeholder="4999.00" />
              {errors.price && <p className="field-error">{errors.price.message}</p>}
            </div>
            <div>
              <label className="form-label">Billing Period</label>
              <select className="form-input" {...register('billing_period', { required: 'Required' })}>
                <option value="">Select period</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              {errors.billing_period && <p className="field-error">{errors.billing_period.message}</p>}
            </div>
          </div>

          <div>
            <label className="form-label">Min. Quantity</label>
            <input type="number" className="form-input" {...register('min_qty', { valueAsNumber: true, min: 1 })} defaultValue={1} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" {...register('start_date')} />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" {...register('end_date')} />
            </div>
          </div>

          {/* Boolean flags */}
          <div className="border border-slate-700/50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Plan Flags</p>
            <div className="grid grid-cols-2 gap-3">
              {(['auto_close', 'closable', 'pausable', 'renewable'] as const).map((flag) => (
                <Controller
                  key={flag}
                  name={flag}
                  control={control}
                  render={({ field }) => (
                    <Toggle
                      checked={!!field.value}
                      onChange={field.onChange}
                      label={flag.replace('_', '-').replace(/\b\w/g, (c) => c.toUpperCase())}
                    />
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary py-2.5">
              {isSubmitting ? 'Saving…' : (editPlan ? 'Update Plan' : 'Create Plan')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <p className="text-slate-300 text-sm mb-6">Delete this plan? Any linked subscriptions will be affected.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={() => deleteConfirm && onDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors">Delete</button>
        </div>
      </Modal>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
