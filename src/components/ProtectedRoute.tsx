import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/store/authStore'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()

  // Not logged in → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Role check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Admin always goes to dashboard; portal users go to subscriptions
    const fallback = user.role === 'admin' ? '/dashboard' : '/my-subscriptions'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
