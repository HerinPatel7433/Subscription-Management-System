import { BarChart2, TrendingUp, Users, CreditCard, ArrowUpRight } from 'lucide-react'

const stats = [
  { label: 'Total Revenue', value: '$48,295', change: '+12.5%', icon: <BarChart2 size={20} /> },
  { label: 'Active Subscriptions', value: '1,284', change: '+8.2%', icon: <TrendingUp size={20} /> },
  { label: 'Total Users', value: '3,591', change: '+5.3%', icon: <Users size={20} /> },
  { label: 'MRR', value: '$12,450', change: '+3.1%', icon: <CreditCard size={20} /> },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-card border border-surface-border rounded-2xl p-5 hover:border-primary-500/40 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600/20 text-primary-400 rounded-xl">
                {stat.icon}
              </div>
              <span className="flex items-center gap-1 text-green-400 text-xs font-semibold bg-green-500/10 px-2 py-1 rounded-lg">
                <ArrowUpRight size={12} />{stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Placeholder chart area */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Revenue Overview</h2>
        <div className="h-48 flex items-center justify-center border border-dashed border-surface-border rounded-xl">
          <p className="text-slate-500 text-sm">Chart component coming soon</p>
        </div>
      </div>
    </div>
  )
}
