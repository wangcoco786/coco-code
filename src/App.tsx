import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout/Layout'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import { useApp } from '@/context/AppContext'

// 懒加载页面组件（代码分割）
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'))
const Requirements = lazy(() => import('@/pages/Requirements/Requirements'))
const Sprint = lazy(() => import('@/pages/Sprint/Sprint'))
const Risk = lazy(() => import('@/pages/Risk/Risk'))
const Reports = lazy(() => import('@/pages/Reports/Reports'))
const Roadmap = lazy(() => import('@/pages/Roadmap/Roadmap'))
const Settings = lazy(() => import('@/pages/Settings/Settings'))

// 角色守卫：DEV 不能访问风险页面
function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: string[]
}) {
  const { currentUser } = useApp()
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="requirements"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Requirements />
              </Suspense>
            }
          />
          <Route
            path="sprint"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Sprint />
              </Suspense>
            }
          />
          <Route
            path="risk"
            element={
              <RoleGuard allowedRoles={['PM']}>
                <Suspense fallback={<LoadingSpinner />}>
                  <Risk />
                </Suspense>
              </RoleGuard>
            }
          />
          <Route
            path="reports"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Reports />
              </Suspense>
            }
          />
          <Route
            path="roadmap"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Roadmap />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Settings />
              </Suspense>
            }
          />
          {/* 404 → Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
