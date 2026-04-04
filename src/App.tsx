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
import InvoicesPage from '@/pages/InvoicesPage'
import PaymentsPage from '@/pages/PaymentsPage'
import DiscountsPage from '@/pages/DiscountsPage'
import TaxesPage from '@/pages/TaxesPage'
import ReportsPage from '@/pages/ReportsPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function InternalRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'internal']}>
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

        {/* Admin-only routes */}
        <Route path="/dashboard"         element={<AdminRoute><DashboardPage /></AdminRoute>} />
        <Route path="/products"          element={<InternalRoute><ProductsPage /></InternalRoute>} />
        <Route path="/plans"             element={<InternalRoute><PlansPage /></InternalRoute>} />
        <Route path="/subscriptions"     element={<InternalRoute><SubscriptionsPage /></InternalRoute>} />
        <Route path="/subscriptions/:id" element={<InternalRoute><SubscriptionDetailPage /></InternalRoute>} />
        <Route path="/payments"          element={<AdminRoute><PaymentsPage /></AdminRoute>} />
        <Route path="/discounts"         element={<AdminRoute><DiscountsPage /></AdminRoute>} />
        <Route path="/taxes"             element={<AdminRoute><TaxesPage /></AdminRoute>} />
        <Route path="/reports"           element={<AdminRoute><ReportsPage /></AdminRoute>} />

        {/* Portal + Admin routes */}
        <Route
          path="/my-subscriptions"
          element={
            <ProtectedRoute allowedRoles={['admin', 'portal']}>
              <Layout><MySubscriptionsPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute allowedRoles={['admin', 'portal']}>
              <Layout><InvoicesPage /></Layout>
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
