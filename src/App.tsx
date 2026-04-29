import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout/Layout'
import { RouteGuard, PublicRoute } from '@/components/RouteGuard/RouteGuard'
import { useApp } from '@/context/AppContext'

const Login = lazy(() => import('@/pages/Login/Login'))
const AuthCallback = lazy(() => import('@/pages/Login/AuthCallback'))
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'))
const Requirements = lazy(() => import('@/pages/Requirements/Requirements'))
const Sprint = lazy(() => import('@/pages/Sprint/Sprint'))
const Risk = lazy(() => import('@/pages/Risk/Risk'))
const Reports = lazy(() => import('@/pages/Reports/Reports'))
const Roadmap = lazy(() => import('@/pages/Roadmap/Roadmap'))
const Settings = lazy(() => import('@/pages/Settings/Settings'))

function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: string[]
}) {
  const { currentUser } = useApp()
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public: SSO login page — redirects to /dashboard if already authenticated */}
        <Route path="/login" element={<PublicRoute><Suspense fallback={null}><Login /></Suspense></PublicRoute>} />

        {/* SSO callback — no guard needed, handles token extraction */}
        <Route path="/auth/callback" element={<Suspense fallback={null}><AuthCallback /></Suspense>} />

        {/* Protected routes — RouteGuard redirects to /login if unauthenticated */}
        <Route path="/" element={<RouteGuard><Layout /></RouteGuard>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={null}><Dashboard /></Suspense>} />
          <Route path="requirements" element={<Suspense fallback={null}><Requirements /></Suspense>} />
          <Route path="sprint" element={<Suspense fallback={null}><Sprint /></Suspense>} />
          <Route path="risk" element={<RoleGuard allowedRoles={['PM']}><Suspense fallback={null}><Risk /></Suspense></RoleGuard>} />
          <Route path="reports" element={<Suspense fallback={null}><Reports /></Suspense>} />
          <Route path="roadmap" element={<Suspense fallback={null}><Roadmap /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={null}><Settings /></Suspense>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
