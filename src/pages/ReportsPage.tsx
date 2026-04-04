import { useState, useEffect, useCallback } from 'react'
import {
  BarChart2, TrendingUp, FileText, AlertTriangle, Users,
  Download, Calendar, SlidersHorizontal,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { Toast, useToast } from '@/components/Toast'
import {
  getReportSummary, getRevenueByMonth, getTopCustomers,
  type ReportSummary, type RevenueByMonth, type TopCustomer,
} from '@/services/billingService'
import { getPlans } from '@/services/subscriptionService'
import type { RecurringPlan } from '@/services/subscriptionService'

// ── Mock data ─────────────────────────────────────────────────────────
const MOCK_SUMMARY: ReportSummary = {
  active_subscriptions: 47,
  monthly_revenue: 182500,
  pending_invoices: 12,
  overdue_invoices: 3,
}

const MOCK_REVENUE: RevenueByMonth[] = [
  { month: 'May 24',  revenue: 98000  },
  { month: 'Jun 24',  revenue: 115000 },
  { month: 'Jul 24',  revenue: 102000 },
  { month: 'Aug 24',  revenue: 134000 },
  { month: 'Sep 24',  revenue: 128000 },
  { month: 'Oct 24',  revenue: 151000 },
  { month: 'Nov 24',  revenue: 143000 },
  { month: 'Dec 24',  revenue: 172000 },
  { month: 'Jan 25',  revenue: 159000 },
  { month: 'Feb 25',  revenue: 168000 },
  { month: 'Mar 25',  revenue: 174000 },
  { month: 'Apr 25',  revenue: 182500 },
]

const MOCK_CUSTOMERS: TopCustomer[] = [
  { customer_id: 'c1', customer_name: 'Acme Corp',       total_value: 89500, active_subscriptions: 3 },
  { customer_id: 'c2', customer_name: 'TechStart Ltd',   total_value: 54000, active_subscriptions: 2 },
  { customer_id: 'c3', customer_name: 'BizSol Inc',      total_value: 49800, active_subscriptions: 2 },
  { customer_id: 'c4', customer_name: 'NovaWave',        total_value: 36000, active_subscriptions: 1 },
  { customer_id: 'c5', customer_name: 'CloudPeak', total_value: 29900, active_subscriptions: 1 },
]

// ── Custom chart tooltip ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl px-4 py-2.5 shadow-2xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-base font-bold text-emerald-400">₹{payload[0].value.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

// ── Summary card ──────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string
}) {
  return (
    <div className="bg-[#131929] border border-slate-700/50 rounded-2xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { toasts, toast, dismiss } = useToast()
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [revenue, setRevenue] = useState<RevenueByMonth[]>([])
  const [customers, setCustomers] = useState<TopCustomer[]>([])
  const [plans, setPlans] = useState<RecurringPlan[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const buildParams = useCallback(() => {
    const p: Record<string, string> = {}
    if (startDate)    p.start_date   = startDate
    if (endDate)      p.end_date     = endDate
    if (planFilter)   p.plan_id      = planFilter
    if (statusFilter) p.status       = statusFilter
    return p
  }, [startDate, endDate, planFilter, statusFilter])

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const params = buildParams()
      const [sum, rev, cust, ps] = await Promise.all([
        getReportSummary(params),
        getRevenueByMonth(params),
        getTopCustomers(params),
        getPlans(),
      ])
      setSummary(sum.data)
      setRevenue(rev.data.length ? rev.data : MOCK_REVENUE)
      setCustomers(cust.data.length ? cust.data : MOCK_CUSTOMERS)
      setPlans(ps.data)
    } catch {
      setSummary(MOCK_SUMMARY)
      setRevenue(MOCK_REVENUE)
      setCustomers(MOCK_CUSTOMERS)
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleExportCSV = () => {
    try {
      const rows = [
        ['Month', 'Revenue'],
        ...revenue.map((r) => [r.month, r.revenue]),
        [],
        ['Customer', 'Active Subscriptions', 'Total Value (₹)'],
        ...customers.map((c) => [c.customer_name, c.active_subscriptions, c.total_value]),
      ]
      const csv = rows.map((r) => r.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'subscription-report.csv'; a.click()
      URL.revokeObjectURL(url)
      toast('success', 'Report exported as CSV')
    } catch {
      toast('error', 'Export failed')
    }
  }

  const s = summary ?? MOCK_SUMMARY

  // Bar colors — highlight max revenue month
  const maxRevenue = Math.max(...revenue.map((r) => r.revenue))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
            <BarChart2 size={18} className="text-primary-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Reports</h1>
            <p className="text-xs text-slate-500">Business overview & analytics</p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-sm font-medium rounded-xl transition-colors"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-[#131929] border border-slate-700/50 rounded-2xl">
        <SlidersHorizontal size={15} className="text-slate-400" />
        <p className="text-xs text-slate-400 font-medium mr-1">Filters:</p>

        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-slate-500" />
          <input
            type="date" value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary-500"
          />
          <span className="text-slate-500 text-xs">→</span>
          <input
            type="date" value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary-500"
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary-500"
        >
          <option value="">All Plans</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="closed">Closed</option>
        </select>

        <button
          onClick={fetchAll}
          className="ml-auto px-3 py-1.5 bg-primary-600/20 hover:bg-primary-600/30 border border-primary-500/30 text-primary-300 text-xs font-medium rounded-lg transition-colors"
        >
          Apply
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Subscriptions"
          value={loading ? '—' : s.active_subscriptions}
          icon={<TrendingUp size={20} className="text-primary-400" />}
          color="bg-primary-500/20 border border-primary-500/30"
          sub="Currently running"
        />
        <StatCard
          label="Monthly Revenue"
          value={loading ? '—' : `₹${s.monthly_revenue.toLocaleString()}`}
          icon={<BarChart2 size={20} className="text-emerald-400" />}
          color="bg-emerald-500/20 border border-emerald-500/30"
          sub="This billing cycle"
        />
        <StatCard
          label="Pending Invoices"
          value={loading ? '—' : s.pending_invoices}
          icon={<FileText size={20} className="text-amber-400" />}
          color="bg-amber-500/20 border border-amber-500/30"
          sub="Awaiting payment"
        />
        <StatCard
          label="Overdue Invoices"
          value={loading ? '—' : s.overdue_invoices}
          icon={<AlertTriangle size={20} className="text-red-400" />}
          color="bg-red-500/20 border border-red-500/30"
          sub="Past due date"
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-[#131929] border border-slate-700/50 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Revenue by Month</h2>
          <p className="text-xs text-slate-500 mt-0.5">Last 12 months</p>
        </div>
        {loading ? (
          <div className="h-56 flex items-center justify-center text-slate-500 text-sm">Loading chart…</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false} tickLine={false} width={52}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {revenue.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.revenue === maxRevenue ? '#6366f1' : '#4f46e580'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top customers table */}
      <div className="bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700/50">
          <Users size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-white">Top Customers by Subscription Value</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['#', 'Customer', 'Active Subscriptions', 'Total Value'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No data available</td></tr>
              ) : customers.map((c, i) => {
                const pct = customers[0].total_value > 0 ? (c.total_value / customers[0].total_value) * 100 : 0
                return (
                  <tr key={c.customer_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${i === 0 ? 'bg-amber-500/20 text-amber-300' : i === 1 ? 'bg-slate-500/20 text-slate-300' : i === 2 ? 'bg-orange-700/20 text-orange-400' : 'text-slate-500'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{c.customer_name}</td>
                    <td className="px-4 py-3 text-slate-300">{c.active_subscriptions}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-semibold">₹{c.total_value.toLocaleString()}</span>
                        <div className="flex-1 max-w-[120px] h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
