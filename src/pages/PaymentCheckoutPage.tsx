import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShieldCheck, AlertCircle, Loader2, ChevronLeft, CreditCard, Zap } from 'lucide-react'
import { createRazorpayOrder, verifyRazorpayPayment, getInvoice } from '@/services/billingService'
import type { Invoice } from '@/services/billingService'

// Extend window for Razorpay
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

type PageState = 'loading' | 'ready' | 'processing' | 'success' | 'error'

export default function PaymentCheckoutPage() {
  const { id: invoiceId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [pageState, setPageState] = useState<PageState>('loading')
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successData, setSuccessData] = useState<{ payment_id: string; amount: number } | null>(null)

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) return
    try {
      const res = await getInvoice(invoiceId)
      setInvoice(res.data)
      setPageState('ready')
    } catch {
      setErrorMsg('Failed to load invoice details.')
      setPageState('error')
    }
  }, [invoiceId])

  useEffect(() => {
    loadInvoice()
  }, [loadInvoice])

  const handlePay = async () => {
    if (!invoiceId) return
    setPageState('processing')

    try {
      // Step 1: Create Razorpay order from backend
      const orderRes = await createRazorpayOrder(invoiceId)
      const order = orderRes.data

      // Step 2: Open Razorpay Checkout popup
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'SubsManager',
        description: `Payment for ${order.invoice_number}`,
        image: '/favicon.svg',
        prefill: {
          name: order.customer_name,
          email: order.customer_email,
        },
        theme: { color: '#6366f1' },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          // Step 3: Verify payment with backend
          try {
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoice_id: invoiceId,
            })
            setSuccessData({
              payment_id: response.razorpay_payment_id,
              amount: verifyRes.data?.amount ?? order.amount_display,
            })
            setPageState('success')
          } catch {
            setErrorMsg('Payment was made but verification failed. Please contact support.')
            setPageState('error')
          }
        },
        modal: {
          ondismiss: () => {
            setPageState('ready')
          },
        },
      })

      rzp.open()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to initiate payment. Please try again.'
      setErrorMsg(msg)
      setPageState('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Invoices
        </button>

        {/* Card */}
        <div className="bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border-b border-slate-700/50 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <CreditCard size={20} className="text-indigo-400" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Secure Payment</h1>
                <p className="text-slate-400 text-xs">Powered by Razorpay</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-5">

            {/* Loading */}
            {pageState === 'loading' && (
              <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                <Loader2 size={20} className="animate-spin" />
                <span>Loading invoice…</span>
              </div>
            )}

            {/* Error */}
            {pageState === 'error' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{errorMsg}</p>
                </div>
                <button
                  onClick={() => { setPageState('ready'); setErrorMsg('') }}
                  className="w-full px-4 py-2.5 border border-slate-600 text-slate-300 text-sm rounded-xl hover:bg-white/5 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Success */}
            {pageState === 'success' && successData && (
              <div className="text-center space-y-5 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto">
                  <ShieldCheck size={30} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl">Payment Successful!</h2>
                  <p className="text-slate-400 text-sm mt-1">Your invoice has been marked as paid.</p>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Amount Paid</span>
                    <span className="text-emerald-400 font-bold">₹{successData.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Payment ID</span>
                    <span className="text-white font-mono text-xs">{successData.payment_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Invoice</span>
                    <span className="text-white">{invoice ? `INV-${invoice.id.slice(0, 8).toUpperCase()}` : '—'}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/invoices')}
                  className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
                >
                  Go to Invoices
                </button>
              </div>
            )}

            {/* Ready / Processing */}
            {(pageState === 'ready' || pageState === 'processing') && invoice && (
              <div className="space-y-5">
                {/* Invoice Details */}
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice Summary</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Invoice #</span>
                      <span className="text-white font-mono font-semibold">INV-{invoice.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Customer</span>
                      <span className="text-white">{invoice.customer_name || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Due Date</span>
                      <span className="text-white">{invoice.due_date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Status</span>
                      <span className={`capitalize font-medium ${invoice.status === 'confirmed' ? 'text-amber-400' : 'text-slate-300'}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-700/40 flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">Total Amount</span>
                    <span className="text-2xl font-bold text-indigo-400">₹{invoice.amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Security note */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>Secured by 256-bit SSL encryption via Razorpay</span>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePay}
                  disabled={pageState === 'processing' || invoice.status !== 'confirmed'}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >
                  {pageState === 'processing' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Initiating Payment…
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Pay ₹{invoice.amount.toLocaleString()} with Razorpay
                    </>
                  )}
                </button>

                {invoice.status !== 'confirmed' && (
                  <p className="text-center text-xs text-amber-400">
                    ⚠ Invoice must be in <strong>Confirmed</strong> status to accept payment.
                  </p>
                )}

                {/* Accepted payment methods */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {['UPI', 'Cards', 'NetBanking', 'Wallets'].map((m) => (
                    <span key={m} className="text-xs px-2 py-1 bg-slate-800 border border-slate-700/50 rounded text-slate-400">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-4">
          SubsManager · Payments are processed securely by Razorpay
        </p>
      </div>
    </div>
  )
}
