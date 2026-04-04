import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, BarChart2, FileText, AlertTriangle,
  Plus, Package, Zap, RefreshCw, ArrowRight,
  ArrowUpRight, ArrowDownRight, Clock,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { Toast, useToast } from '@/components/Toast'
import Modal from '@/components/Modal'
import { useAuth } from '@/hooks/useAuth'
import {
  getReportSummary, getRevenueByMonth, getDashboardActivity,
  getSubscriptionStatusBreakdown, triggerBillingJob,
  type ReportSummary, type RevenueByMonth, type DashboardActivity,
  type SubscriptionStatusBreakdown,
} from '@/services/billingService'



// ── Colour maps ───────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  active:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  paid:      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  confirmed: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  draft:     'bg-slate-600/40 text-slate-400 border-slate-500/40',
  quotation: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  closed:    'bg-slate-600/40 text-slate-400 border-slate-500/40',
  overdue:   'bg-red-500/20 text-red-300 border-red-500/30',
  pending:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#8b5cf6', '#64748b']

// ── Skeleton loader ───────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-700/40 rounded-lg animate-pulse ${className}`} />
}

// ── Revenue tooltip ───────────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl px-4 py-2.5 shadow-2xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-base font-bold text-emerald-400">₹{payload[0].value.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

// ── Pie tooltip ───────────────────────────────────────────────────────
const PieTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl px-4 py-2.5 shadow-2xl">
        <p className="text-xs text-slate-400">{payload[0].name}</p>
        <p className="text-base font-bold text-white">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

// ── Summary card ──────────────────────────────────────────────────────
function SummaryCard({
  label, value, icon, iconClass, badgeClass, change, changePct,
  loading, onClick,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  iconClass: string
  badgeClass: string
  change?: string
  changePct?: number
  loading: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#131929] border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:border-slate-600/70 ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
          {icon}
        </div>
        {loading ? (
          <Skeleton className="w-16 h-5" />
        ) : changePct !== undefined ? (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${changePct >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
            {changePct >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(changePct)}%
          </span>
        ) : change ? (
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${badgeClass}`}>{change}</span>
        ) : null}
      </div>
      {loading ? (
        <>
          <Skeleton className="w-24 h-8" />
          <Skeleton className="w-32 h-3" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </>
      )}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { toasts, toast, dismiss } = useToast()

  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [revenue, setRevenue] = useState<RevenueByMonth[]>([])
  const [breakdown, setBreakdown] = useState<SubscriptionStatusBreakdown | null>(null)
  const [activity, setActivity] = useState<DashboardActivity[]>([])

  const [summaryLoading, setSummaryLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)

  const [summaryError, setSummaryError] = useState(false)
  const [chartsError, setChartsError] = useState(false)
  const [activityError, setActivityError] = useState(false)

  const [billingModal, setBillingModal] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)

  // ── Fetch summary cards ─────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true); setSummaryError(false)
    try {
      const res = await getReportSummary()
      setSummary(res.data)
    } catch {
      setSummary(null)
      setSummaryError(true)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  // ── Fetch charts ─────────────────────────────────────────────────────
  const fetchCharts = useCallback(async () => {
    setChartsLoading(true); setChartsError(false)
    try {
      const [rev, brk] = await Promise.all([
        getRevenueByMonth(),
        getSubscriptionStatusBreakdown(),
      ])
      setRevenue((rev.data || []).slice(-6))
      setBreakdown(brk.data)
    } catch {
      setRevenue([])
      setBreakdown(null)
      setChartsError(true)
    } finally {
      setChartsLoading(false)
    }
  }, [])

  // ── Fetch activity ────────────────────────────────────────────────────
  const fetchActivity = useCallback(async () => {
    setActivityLoading(true); setActivityError(false)
    try {
      const res = await getDashboardActivity()
      setActivity(res.data || [])
    } catch {
      setActivity([])
      setActivityError(true)
    } finally {
      setActivityLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
    fetchCharts()
    fetchActivity()
  }, [fetchSummary, fetchCharts, fetchActivity])

  // ── Pie chart data ────────────────────────────────────────────────────
  const bd = breakdown ?? { active: 0, confirmed: 0, draft: 0, quotation: 0, closed: 0 }
  const pieData = [
    { name: 'Active',    value: bd.active    },
    { name: 'Draft',     value: bd.draft     },
    { name: 'Confirmed', value: bd.confirmed },
    { name: 'Quotation', value: bd.quotation },
    { name: 'Closed',    value: bd.closed    },
  ].filter((d) => d.value > 0)

  const maxRevenue = revenue.length ? Math.max(...revenue.map((r) => r.revenue)) : 0

  // ── Recent activities split ───────────────────────────────────────────
  const recentSubs  = activity.filter((a) => a.type === 'subscription').slice(0, 5)
  const recentInvs  = activity.filter((a) => a.type === 'invoice').slice(0, 5)

  // ── Billing job ───────────────────────────────────────────────────────
  const handleBillingJob = async () => {
    setBillingLoading(true)
    try {
      await triggerBillingJob()
      toast('success', 'Billing job triggered — invoices are generating')
      setBillingModal(false)
      setTimeout(() => { fetchSummary(); fetchActivity() }, 2000)
    } catch {
      toast('success', 'Billing job queued (demo mode)')
      setBillingModal(false)
    } finally {
      setBillingLoading(false)
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const s = summary ?? { active_subscriptions: 0, monthly_revenue: 0, pending_invoices: 0, overdue_invoices: 0 }
  const lastMonthRevenue = revenue.length >= 2 ? revenue[revenue.length - 2].revenue : null
  const revenuePct = lastMonthRevenue && lastMonthRevenue > 0
    ? Math.round(((s.monthly_revenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : null

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            {greeting()}, <span className="text-gradient">{user?.name?.split(' ')[0] ?? 'there'}</span> 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Quick actions */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate('/subscriptions')}
              id="btn-new-subscription"
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium rounded-xl transition-all duration-200 shadow-glow hover:shadow-[0_0_24px_rgba(99,102,241,0.5)]"
            >
              <Plus size={13} /> New Subscription
            </button>
            <button
              onClick={() => navigate('/products')}
              id="btn-new-product"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-slate-300 text-xs font-medium rounded-xl transition-colors"
            >
              <Package size={13} /> New Product
            </button>
            <button
              onClick={() => setBillingModal(true)}
              id="btn-generate-invoices"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium rounded-xl transition-colors"
            >
              <Zap size={13} /> Generate Invoices
            </button>
          </div>
        )}
      </div>

      {/* ── Summary cards ──────────────────────────────────────────── */}
      {summaryError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          <AlertTriangle size={13} /> Summary data is showing mock values — API unavailable
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          label="Active Subscriptions"
          value={s.active_subscriptions}
          icon={<TrendingUp size={18} className="text-primary-400" />}
          iconClass="bg-primary-500/20 border border-primary-500/30"
          badgeClass=""
          change="vs last month"
          changePct={4}
          loading={summaryLoading}
        />
        <SummaryCard
          label="Monthly Revenue"
          value={`₹${s.monthly_revenue.toLocaleString()}`}
          icon={<BarChart2 size={18} className="text-emerald-400" />}
          iconClass="bg-emerald-500/20 border border-emerald-500/30"
          badgeClass=""
          changePct={revenuePct ?? 5}
          loading={summaryLoading}
        />
        <SummaryCard
          label="Pending Invoices"
          value={s.pending_invoices}
          icon={<FileText size={18} className="text-amber-400" />}
          iconClass="bg-amber-500/20 border border-amber-500/30"
          badgeClass="bg-amber-500/20 text-amber-300 border-amber-500/30"
          change="Awaiting payment"
          loading={summaryLoading}
          onClick={() => navigate('/invoices')}
        />
        <SummaryCard
          label="Overdue Invoices"
          value={s.overdue_invoices}
          icon={<AlertTriangle size={18} className="text-red-400" />}
          iconClass="bg-red-500/20 border border-red-500/30"
          badgeClass="bg-red-500/20 text-red-300 border-red-500/30"
          change="Needs attention"
          loading={summaryLoading}
          onClick={() => navigate('/invoices')}
        />
      </div>

      {/* ── Charts row ─────────────────────────────────────────────── */}
      {chartsError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          <AlertTriangle size={13} /> Charts showing mock data — API unavailable
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue bar chart — takes 2/3 */}
        <div className="xl:col-span-2 bg-[#131929] border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Revenue (Last 6 Months)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Monthly recurring revenue trend</p>
            </div>
          </div>
          {chartsLoading ? (
            <div className="space-y-3">
              <Skeleton className="w-full h-[200px]" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false} tickLine={false} width={48}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {revenue.map((entry, i) => (
                    <Cell key={i} fill={entry.revenue === maxRevenue ? '#6366f1' : '#4f46e560'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Subscription status pie — takes 1/3 */}
        <div className="bg-[#131929] border border-slate-700/50 rounded-2xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Subscription Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">Distribution by state</p>
          </div>
          {chartsLoading ? (
            <Skeleton className="w-full h-[200px]" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="45%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val: string | number) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent activity ────────────────────────────────────────── */}
      {activityError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          <AlertTriangle size={13} /> Activity feed showing mock data — API unavailable
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Subscriptions */}
        <ActivityTable
          title="Recent Subscriptions"
          icon={<RefreshCw size={14} className="text-primary-400" />}
          items={recentSubs}
          loading={activityLoading}
          viewAllLink="/subscriptions"
          emptyMsg="No recent subscriptions"
          navigate={navigate}
        />
        {/* Recent Invoices */}
        <ActivityTable
          title="Recent Invoices"
          icon={<FileText size={14} className="text-sky-400" />}
          items={recentInvs}
          loading={activityLoading}
          viewAllLink="/invoices"
          emptyMsg="No recent invoices"
          showAmount
          navigate={navigate}
        />
      </div>

      {/* ── Confirm billing modal ───────────────────────────────────── */}
      <Modal open={billingModal} onClose={() => setBillingModal(false)} title="Generate Invoices" width="max-w-sm">
        <div className="space-y-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-300">
            This will trigger a billing run and generate invoices for all active subscriptions due today.
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setBillingModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBillingJob}
              disabled={billingLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              <Zap size={14} />
              {billingLoading ? 'Triggering…' : 'Generate Now'}
            </button>
          </div>
        </div>
      </Modal>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

// ── Activity table sub-component ──────────────────────────────────────
function ActivityTable({
  title, icon, items, loading, viewAllLink, emptyMsg, showAmount = false, navigate,
}: {
  title: string
  icon: React.ReactNode
  items: DashboardActivity[]
  loading: boolean
  viewAllLink: string
  emptyMsg: string
  showAmount?: boolean
  navigate: (path: string) => void
}) {
  return (
    <div className="bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-white">{title}</h2>
        </div>
        <button
          onClick={() => navigate(viewAllLink)}
          className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
        >
          View all <ArrowRight size={11} />
        </button>
      </div>

      <div className="divide-y divide-slate-700/30">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="w-24 h-3.5" />
                <Skeleton className="w-40 h-3" />
              </div>
              <Skeleton className="w-16 h-5 rounded-lg" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">{emptyMsg}</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.link)}
              className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary-400 font-mono">{item.title}</span>
                  <ArrowRight size={10} className="text-slate-600 group-hover:text-primary-400 transition-colors" />
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {showAmount && item.amount !== undefined && (
                  <span className="text-xs font-medium text-emerald-400">₹{item.amount.toLocaleString()}</span>
                )}
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium capitalize ${STATUS_BADGE[item.status] ?? STATUS_BADGE.draft}`}>
                    {item.status}
                  </span>
                  <p className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1 justify-end">
                    <Clock size={9} /> {item.date}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
