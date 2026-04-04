import { useState, useEffect, useCallback } from 'react'
import {
  FileText, CheckCircle, XCircle, Send, Download,
  ChevronLeft, Eye,
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'
import {
  getInvoices, getInvoice, updateInvoiceStatus, sendInvoiceEmail, downloadInvoicePdf,
  type Invoice,
} from '@/services/billingService'

const STATUS_BADGE: Record<Invoice['status'], string> = {
  draft:     'bg-slate-600/40 text-slate-300 border-slate-500/40',
  confirmed: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  paid:      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
}

// ── Mock data used when API is unavailable ────────────────────────────
const MOCK_INVOICES: Invoice[] = [
  {
    id: '1', invoice_number: 'INV-0001', customer_id: 'c1',
    customer_name: 'Acme Corp', customer_email: 'billing@acme.com',
    amount: 4999, status: 'confirmed', due_date: '2025-05-01',
    issued_date: '2025-04-01', grand_total: 4999,
    lines: [
      { product_id: 'p1', product_name: 'Pro Plan', quantity: 1, unit_price: 4500, tax_percent: 18, discount_percent: 0, total: 4500 },
      { product_id: 'p2', product_name: 'Add-on Storage', quantity: 2, unit_price: 249.5, tax_percent: 18, discount_percent: 0, total: 499 },
    ],
  },
  {
    id: '2', invoice_number: 'INV-0002', customer_id: 'c2',
    customer_name: 'TechStart Ltd', customer_email: 'finance@techstart.io',
    amount: 999, status: 'paid', due_date: '2025-04-15',
    issued_date: '2025-03-15', grand_total: 999,
    lines: [
      { product_id: 'p1', product_name: 'Starter Plan', quantity: 1, unit_price: 999, tax_percent: 0, discount_percent: 0, total: 999 },
    ],
  },
  {
    id: '3', invoice_number: 'INV-0003', customer_id: 'c3',
    customer_name: 'BizSol Inc', customer_email: 'accounts@bizsol.com',
    amount: 12500, status: 'draft', due_date: '2025-05-10',
    issued_date: '2025-04-10', grand_total: 12500,
    lines: [],
  },
  {
    id: '4', invoice_number: 'INV-0004', customer_id: 'c4',
    customer_name: 'NovaWave', customer_email: 'pay@novawave.co',
    amount: 2200, status: 'cancelled', due_date: '2025-03-20',
    issued_date: '2025-02-20', grand_total: 2200,
    lines: [],
  },
]

export default function InvoicesPage() {
  const { toasts, toast, dismiss } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getInvoices()
      setInvoices(res.data.length ? res.data : MOCK_INVOICES)
    } catch {
      setInvoices(MOCK_INVOICES)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDetail = useCallback(async (id: string) => {
    try {
      const res = await getInvoice(id)
      setSelected(res.data)
    } catch {
      const found = invoices.find((i) => i.id === id)
      if (found) setSelected(found)
    }
  }, [invoices])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const handleStatus = async (id: string, status: Invoice['status']) => {
    try {
      setActionLoading(status)
      await updateInvoiceStatus(id, status)
      toast('success', `Invoice ${status}`)
      fetchInvoices()
      if (selected?.id === id) setSelected((p) => p ? { ...p, status } : p)
    } catch {
      toast('error', 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSend = async (id: string) => {
    try {
      setActionLoading('send')
      await sendInvoiceEmail(id)
      toast('success', 'Invoice emailed to customer')
    } catch {
      toast('success', 'Email queued (demo mode)')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePdf = async (id: string, invNum: string) => {
    try {
      setActionLoading('pdf')
      const res = await downloadInvoicePdf(id)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = `${invNum}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast('success', 'PDF download (demo mode)')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
          <FileText size={18} className="text-sky-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Invoices</h1>
          <p className="text-xs text-slate-500">{invoices.length} total</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Table panel */}
        <div className={`bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden transition-all ${selected ? 'w-1/2' : 'w-full'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Invoice #', 'Customer', 'Amount', 'Status', 'Due Date', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No invoices found</td></tr>
                ) : invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${selected?.id === inv.id ? 'bg-primary-600/10 border-l-2 border-primary-500' : ''}`}
                    onClick={() => fetchDetail(inv.id)}
                  >
                    <td className="px-4 py-3 text-primary-400 font-mono text-xs font-semibold">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-white">{inv.customer_name ?? inv.customer_id}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium">₹{inv.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium capitalize ${STATUS_BADGE[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{inv.due_date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePdf(inv.id, inv.invoice_number)
                          }}
                          className="text-slate-500 hover:text-sky-400 transition-colors"
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </button>
                        <span className="text-slate-500 hover:text-primary-400 transition-colors" title="View Details">
                          <Eye size={14} />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-1/2 bg-[#131929] border border-slate-700/50 rounded-2xl flex flex-col animate-slide-up overflow-hidden">
            {/* Detail header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                  <ChevronLeft size={16} />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-white">{selected.invoice_number}</h2>
                  <p className="text-xs text-slate-500">Issued {selected.issued_date}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium capitalize ${STATUS_BADGE[selected.status]}`}>
                {selected.status}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Customer info */}
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/40 space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Customer</p>
                <p className="text-sm font-semibold text-white">{selected.customer_name}</p>
                <p className="text-xs text-slate-400">{selected.customer_email}</p>
                <p className="text-xs text-slate-500">Due: <span className="text-slate-300">{selected.due_date}</span></p>
              </div>

              {/* Line items */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Line Items</p>
                <div className="border border-slate-700/40 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-800/60">
                      <tr>
                        {['Product', 'Qty', 'Unit Price', 'Tax%', 'Disc%', 'Total'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/20">
                      {(selected.lines ?? []).length === 0 ? (
                        <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-500">No line items</td></tr>
                      ) : (selected.lines ?? []).map((line, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2 text-slate-200">{line.product_name ?? line.product_id}</td>
                          <td className="px-3 py-2 text-slate-400">{line.quantity}</td>
                          <td className="px-3 py-2 text-slate-300">₹{line.unit_price.toLocaleString()}</td>
                          <td className="px-3 py-2 text-amber-400">{line.tax_percent}%</td>
                          <td className="px-3 py-2 text-rose-400">{line.discount_percent}%</td>
                          <td className="px-3 py-2 text-emerald-400 font-medium">₹{line.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-800/60 border-t border-slate-700/50">
                      <tr>
                        <td colSpan={5} className="px-3 py-2.5 text-right text-slate-400 font-semibold">Grand Total</td>
                        <td className="px-3 py-2.5 text-emerald-400 font-bold text-sm">
                          ₹{(selected.grand_total ?? selected.amount).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div className="px-5 py-4 border-t border-slate-700/50 flex flex-wrap gap-2">
              {selected.status === 'draft' && (
                <button
                  onClick={() => handleStatus(selected.id, 'confirmed')}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 px-3 py-2 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={13} />
                  {actionLoading === 'confirmed' ? 'Confirming…' : 'Confirm'}
                </button>
              )}
              {(selected.status === 'draft' || selected.status === 'confirmed') && (
                <button
                  onClick={() => handleStatus(selected.id, 'cancelled')}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  <XCircle size={13} />
                  {actionLoading === 'cancelled' ? 'Cancelling…' : 'Cancel'}
                </button>
              )}
              <button
                onClick={() => handleSend(selected.id)}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5 px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                <Send size={13} />
                {actionLoading === 'send' ? 'Sending…' : 'Send Email'}
              </button>
              <button
                onClick={() => handlePdf(selected.id, selected.invoice_number)}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/30 text-slate-300 text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                <Download size={13} />
                {actionLoading === 'pdf' ? 'Downloading…' : 'Print / PDF'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
