import { useState, useEffect, useCallback } from 'react'
import { Plus, Wallet, CreditCard, Banknote, Building2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import Modal from '@/components/Modal'
import { Toast, useToast } from '@/components/Toast'
import {
  getPayments, recordPayment, getInvoices, getInvoiceBalance,
  type Payment, type PaymentMethod,
} from '@/services/billingService'
import type { Invoice } from '@/services/billingService'

const METHOD_ICON: Record<PaymentMethod, React.ReactNode> = {
  bank_transfer: <Building2 size={13} />,
  credit_card:   <CreditCard size={13} />,
  cash:          <Banknote size={13} />,
  upi:           <Wallet size={13} />,
  other:         <Wallet size={13} />,
}

const METHOD_BADGE: Record<PaymentMethod, string> = {
  bank_transfer: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  credit_card:   'bg-violet-500/20 text-violet-300 border-violet-500/30',
  cash:          'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  upi:           'bg-amber-500/20 text-amber-300 border-amber-500/30',
  other:         'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

const MOCK_PAYMENTS: Payment[] = [
  { id: '1', invoice_id: '1', invoice_number: 'INV-0001', customer_name: 'Acme Corp',    amount: 4999,  method: 'bank_transfer', payment_date: '2025-04-02' },
  { id: '2', invoice_id: '2', invoice_number: 'INV-0002', customer_name: 'TechStart Ltd', amount: 999,   method: 'credit_card',  payment_date: '2025-03-18' },
  { id: '3', invoice_id: '3', invoice_number: 'INV-0003', customer_name: 'BizSol Inc',   amount: 5000,  method: 'upi',           payment_date: '2025-04-11' },
]

type PaymentForm = {
  invoice_id: string
  amount: number
  method: PaymentMethod
  payment_date: string
  notes?: string
}

export default function PaymentsPage() {
  const { toasts, toast, dismiss } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [outstanding, setOutstanding] = useState<number | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<PaymentForm>({
    defaultValues: { payment_date: new Date().toISOString().slice(0, 10), method: 'bank_transfer' },
  })

  const selectedInvoiceId = watch('invoice_id')

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [pmts, invs] = await Promise.all([getPayments(), getInvoices()])
      setPayments(pmts.data.length ? pmts.data : MOCK_PAYMENTS)
      setInvoices(invs.data)
    } catch {
      setPayments(MOCK_PAYMENTS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Fetch outstanding balance when invoice changes
  useEffect(() => {
    if (!selectedInvoiceId) { setOutstanding(null); return }
    setBalanceLoading(true)
    getInvoiceBalance()
      .then((r) => {
        const entry = r.data.find((b) => b.invoiceId === selectedInvoiceId)
        const inv = invoices.find((i) => i.id === selectedInvoiceId)
        setOutstanding(entry?.balanceDue ?? inv?.amount ?? null)
      })
      .catch(() => {
        const inv = invoices.find((i) => i.id === selectedInvoiceId)
        setOutstanding(inv?.amount ?? null)
      })
      .finally(() => setBalanceLoading(false))
  }, [selectedInvoiceId, invoices])

  const openModal = () => { reset({ payment_date: new Date().toISOString().slice(0, 10), method: 'bank_transfer' }); setModalOpen(true) }

  const onSubmit = async (data: PaymentForm) => {
    try {
      await recordPayment({ ...data, amount: Number(data.amount) })
      toast('success', 'Payment recorded')
      setModalOpen(false)
      fetchAll()
    } catch {
      toast('error', 'Failed to record payment')
    }
  }

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Wallet size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Payments</h1>
            <p className="text-xs text-slate-500">{payments.length} transactions · ₹{totalPaid.toLocaleString()} collected</p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-colors shadow-glow"
        >
          <Plus size={15} /> Record Payment
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Invoice Ref', 'Customer', 'Method', 'Amount', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No payments yet</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-primary-400 font-mono text-xs font-semibold">{p.invoice_number ?? p.invoice_id}</td>
                  <td className="px-4 py-3 text-white">{p.customer_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium capitalize ${METHOD_BADGE[p.method]}`}>
                      {METHOD_ICON[p.method]}
                      {p.method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">₹{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{p.payment_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment" width="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Invoice selector */}
          <div>
            <label className="form-label">Invoice</label>
            <select
              className={`form-input ${errors.invoice_id ? 'error' : ''}`}
              {...register('invoice_id', { required: 'Select an invoice' })}
            >
              <option value="">Select invoice…</option>
              {invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled').map((i) => (
                <option key={i.id} value={i.id}>{i.invoice_number} — {i.customer_name} (₹{i.amount.toLocaleString()})</option>
              ))}
            </select>
            {errors.invoice_id && <p className="field-error">{errors.invoice_id.message}</p>}
          </div>

          {/* Outstanding balance */}
          {selectedInvoiceId && (
            <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="text-xs text-amber-300 font-medium">Outstanding Balance</span>
              <span className="text-sm font-bold text-amber-300">
                {balanceLoading ? '…' : outstanding !== null ? `₹${outstanding.toLocaleString()}` : '—'}
              </span>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="form-label">Amount (₹)</label>
            <input
              type="number" step="0.01" min="0.01"
              className={`form-input ${errors.amount ? 'error' : ''}`}
              placeholder="0.00"
              {...register('amount', {
                required: 'Required',
                min: { value: 0.01, message: 'Must be > 0' },
                max: outstanding !== null 
                  ? { value: outstanding, message: `Amount exceeds outstanding balance of ₹${outstanding.toLocaleString()}` }
                  : undefined
              })}
            />
            {errors.amount && <p className="field-error">{errors.amount.message}</p>}
          </div>

          {/* Method */}
          <div>
            <label className="form-label">Payment Method</label>
            <select className="form-input" {...register('method', { required: true })}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="form-label">Payment Date</label>
            <input type="date" className="form-input" {...register('payment_date', { required: 'Required' })} />
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input resize-none" rows={2} placeholder="Reference / remarks…" {...register('notes')} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary py-2.5">
              {isSubmitting ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
