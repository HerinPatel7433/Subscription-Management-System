import { RefreshCw, Calendar, CheckCircle, Clock } from 'lucide-react'

const mockSubscriptions = [
  { plan: 'Pro Plan', status: 'Active', renewal: 'May 15, 2026', amount: '$49/mo' },
  { plan: 'Add-on: Extra Users', status: 'Active', renewal: 'May 15, 2026', amount: '$10/mo' },
  { plan: 'Starter Plan', status: 'Expired', renewal: 'Mar 1, 2026', amount: '$19/mo' },
]

export default function MySubscriptionsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">My Subscriptions</h1>
        <p className="text-slate-400 text-sm mt-1">View and manage your active subscriptions.</p>
      </div>

      <div className="space-y-3">
        {mockSubscriptions.map((sub, i) => (
          <div
            key={i}
            className="bg-surface-card border border-surface-border rounded-2xl p-5 flex items-center justify-between hover:border-primary-500/40 transition-colors duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600/20 text-primary-400 rounded-xl flex-shrink-0">
                <RefreshCw size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{sub.plan}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`flex items-center gap-1 text-xs ${sub.status === 'Active' ? 'text-green-400' : 'text-slate-500'}`}>
                    {sub.status === 'Active' ? <CheckCircle size={11} /> : <Clock size={11} />}
                    {sub.status}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar size={11} /> Renews {sub.renewal}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{sub.amount}</p>
              <button className="text-xs text-primary-400 hover:text-primary-300 transition-colors mt-1">
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
