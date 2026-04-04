import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import MySubscriptionsPage from '@/pages/MySubscriptionsPage'
import ProductsPage from '@/pages/ProductsPage'
import PlansPage from '@/pages/PlansPage'
import SubscriptionsPage from '@/pages/SubscriptionsPage'
import SubscriptionDetailPage from '@/pages/SubscriptionDetailPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Admin routes */}
        <Route path="/dashboard"       element={<AdminRoute><DashboardPage /></AdminRoute>} />
        <Route path="/products"        element={<AdminRoute><ProductsPage /></AdminRoute>} />
        <Route path="/plans"           element={<AdminRoute><PlansPage /></AdminRoute>} />
        <Route path="/subscriptions"   element={<AdminRoute><SubscriptionsPage /></AdminRoute>} />
        <Route path="/subscriptions/:id" element={<AdminRoute><SubscriptionDetailPage /></AdminRoute>} />

        {/* Portal + Admin routes */}
        <Route
          path="/my-subscriptions"
          element={
            <ProtectedRoute allowedRoles={['admin', 'portal']}>
              <Layout><MySubscriptionsPage /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
