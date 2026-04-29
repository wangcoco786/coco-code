import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { getAccessToken } from '@/lib/tokenManager'
import { useApp } from '@/context/AppContext'
import type { UserRole } from '@/types/platform'

interface JwtPayload {
  userId: string
  username: string
  role: UserRole
}

/**
 * Decode the payload section of a JWT token (base64url → JSON).
 * Returns null if decoding fails.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // base64url → base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

/**
 * RouteGuard — protects routes that require authentication.
 * - No token → redirect to /login
 * - Has token → decode user info, write to AppContext, render children
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const token = getAccessToken()
  const { setCurrentUser } = useApp()

  useEffect(() => {
    if (!token) return
    const payload = decodeJwtPayload(token)
    if (payload) {
      setCurrentUser({
        id: payload.userId,
        name: payload.username,
        role: payload.role,
      })
    }
  }, [token, setCurrentUser])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/**
 * PublicRoute — wraps public pages (e.g. login).
 * - Already logged in → redirect to /dashboard
 * - Not logged in → render children
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = getAccessToken()

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
