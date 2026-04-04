import { useState, useEffect, useCallback } from 'react'
import { Plus, Calculator, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import Modal from '@/components/Modal'
import Toggle from '@/components/Toggle'
import { Toast, useToast } from '@/components/Toast'
import {
  getTaxes, createTax, updateTax, deleteTax, toggleTax,
  type Tax,
} from '@/services/billingService'

const MOCK_TAXES: Tax[] = [
  { id: '1', name: 'GST 18%',   rate: 18, active: true,  created_at: '2024-01-01' },
  { id: '2', name: 'GST 12%',   rate: 12, active: true,  created_at: '2024-01-01' },
  { id: '3', name: 'GST 5%',    rate: 5,  active: true,  created_at: '2024-01-01' },
  { id: '4', name: 'No Tax',    rate: 0,  active: true,  created_at: '2024-01-01' },
  { id: '5', name: 'Import Duty', rate: 25, active: false, created_at: '2024-03-15' },
]

type TaxForm = {
  name: string
  rate: number
}

export default function TaxesPage() {
  const { toasts, toast, dismiss } = useToast()
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Tax | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tax | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TaxForm>()

  const fetchTaxes = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getTaxes()
      setTaxes(res.data.length ? res.data : MOCK_TAXES)
    } catch {
      setTaxes(MOCK_TAXES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTaxes() }, [fetchTaxes])

  const openCreate = () => { setEditing(null); reset({ name: '', rate: 18 }); setModalOpen(true) }
  const openEdit = (t: Tax) => { setEditing(t); reset({ name: t.name, rate: t.rate }); setModalOpen(true) }

  const onSubmit = async (data: TaxForm) => {
    try {
      const payload = { ...data, rate: Number(data.rate) }
      if (editing) {
        await updateTax(editing.id, payload)
        toast('success', 'Tax rate updated')
      } else {
        await createTax(payload)
        toast('success', 'Tax rate created')
      }
      setModalOpen(false)
      fetchTaxes()
    } catch {
      toast('error', 'Failed to save tax rate')
    }
  }

  const handleToggle = async (tax: Tax) => {
    setToggling(tax.id)
    try {
      await toggleTax(tax.id)
      setTaxes((prev) => prev.map((t) => t.id === tax.id ? { ...t, active: !t.active } : t))
    } catch {
      toast('error', 'Failed to toggle tax')
    } finally {
      setToggling(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTax(deleteTarget.id)
      toast('success', 'Tax rate deleted')
      setDeleteTarget(null)
      fetchTaxes()
    } catch {
      toast('error', 'Failed to delete tax rate')
    }
  }

  const activeTaxes = taxes.filter((t) => t.active)
  const inactiveTaxes = taxes.filter((t) => !t.active)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Calculator size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Tax Rates</h1>
            <p className="text-xs text-slate-500">{activeTaxes.length} active · {inactiveTaxes.length} inactive</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-colors shadow-glow"
        >
          <Plus size={15} /> Add Tax Rate
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">All Tax Rates</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Name', 'Rate (%)', 'Status', 'Active', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
              ) : taxes.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No tax rates configured</td></tr>
              ) : taxes.map((tax) => (
                <tr key={tax.id} className={`hover:bg-white/[0.02] transition-colors ${!tax.active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-white font-medium">{tax.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-amber-400 font-bold text-base">{tax.rate}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${tax.active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-600/30 text-slate-400 border-slate-600/40'}`}>
                      {tax.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Toggle
                      checked={tax.active}
                      onChange={() => handleToggle(tax)}
                      disabled={toggling === tax.id}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(tax)} className="text-slate-500 hover:text-primary-400 transition-colors p-1 rounded hover:bg-white/5">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(tax)} className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-white/5">
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Tax Rate' : 'Add Tax Rate'} width="max-w-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Tax Name</label>
            <input
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="e.g. GST 18%"
              {...register('name', { required: 'Required' })}
            />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="form-label">Rate (%)</label>
            <input
              type="number" step="0.01" min="0" max="100"
              className={`form-input ${errors.rate ? 'error' : ''}`}
              placeholder="18"
              {...register('rate', {
                required: 'Required',
                min: { value: 0, message: 'Min 0%' },
                max: { value: 100, message: 'Max 100%' },
              })}
            />
            {errors.rate && <p className="field-error">{errors.rate.message}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary py-2.5">
              {isSubmitting ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete Tax Rate" width="max-w-sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">Delete "{deleteTarget?.name}"?</p>
              <p className="text-xs text-slate-400 mt-1">This will remove the tax rate permanently.</p>
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
