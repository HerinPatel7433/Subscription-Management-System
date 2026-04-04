import { useAuthStore } from '@/store/authStore'
import { logoutUser } from '@/services/authService'

export function useAuth() {
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore()

  const logout = () => {
    clearAuth()
    logoutUser()
  }

  const isAdmin = user?.role === 'admin'
  const isPortal = user?.role === 'portal'

  return { user, isAuthenticated, isAdmin, isPortal, setUser, logout }
}
