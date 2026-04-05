import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, CreditCard, RefreshCw,
  FileText, Wallet, Tag, Calculator, BarChart2, Users,
  LogOut, ChevronRight, Zap,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  roles: ('admin' | 'internal' | 'portal')[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     path: '/dashboard',         icon: <LayoutDashboard size={18} />, roles: ['admin'] },
  { label: 'Products',      path: '/products',          icon: <Package size={18} />,         roles: ['admin', 'internal'] },
  { label: 'Plans',         path: '/plans',             icon: <CreditCard size={18} />,      roles: ['admin', 'internal'] },
  { label: 'Subscriptions', path: '/subscriptions',     icon: <RefreshCw size={18} />,       roles: ['admin', 'internal'] },
  { label: 'Store',         path: '/store',             icon: <Package size={18} />,         roles: ['portal'] },
  { label: 'My Subscriptions', path: '/my-subscriptions', icon: <RefreshCw size={18} />,    roles: ['portal'] },
  { label: 'Invoices',      path: '/invoices',          icon: <FileText size={18} />,        roles: ['admin', 'portal'] },
  { label: 'Payments',      path: '/payments',          icon: <Wallet size={18} />,          roles: ['admin'] },
  { label: 'Discounts',     path: '/discounts',         icon: <Tag size={18} />,             roles: ['admin'] },
  { label: 'Taxes',         path: '/taxes',             icon: <Calculator size={18} />,      roles: ['admin'] },
  { label: 'Reports',       path: '/reports',           icon: <BarChart2 size={18} />,       roles: ['admin'] },
  { label: 'Users',         path: '/users',             icon: <Users size={18} />,           roles: ['admin'] },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  )

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex flex-col h-full w-64 bg-surface-card border-r border-surface-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-surface-border">
        <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg shadow-glow">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">SubsManager</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            {user?.role === 'admin' ? 'Admin Panel' : user?.role === 'internal' ? 'Internal Portal' : 'My Portal'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User profile + logout */}
      <div className="border-t border-surface-border px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl mb-1">
          <div className="w-8 h-8 rounded-full bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-primary-400 text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
