// Token Manager — 管理平台 JWT Token 的存储、读取、刷新和清除
// Access Token 存于模块级变量（内存），Refresh Token 存于 localStorage

const REFRESH_TOKEN_KEY = 'platform_refresh_token'

// 模块级变量：Access Token 仅存于内存
let accessToken: string | null = null

// Promise 锁：防止并发刷新
let refreshPromise: Promise<string> | null = null

/**
 * 获取内存中的 Access Token
 */
export function getAccessToken(): string | null {
  return accessToken
}

/**
 * 存储 Access Token 到内存，Refresh Token 到 localStorage
 */
export function setTokens(newAccessToken: string, refreshToken: string): void {
  accessToken = newAccessToken
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

/**
 * 清除内存中的 Access Token 和 localStorage 中的 Refresh Token
 */
export function clearTokens(): void {
  accessToken = null
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

/**
 * 获取 localStorage 中的 Refresh Token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * 刷新 Access Token — 调用 POST /api/auth/refresh
 * 使用 Promise 锁防止并发刷新：如果刷新已在进行中，后续调用等待同一个 Promise
 */
export async function refreshAccessToken(): Promise<string> {
  // 如果已有刷新请求在进行中，直接返回同一个 Promise
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = doRefresh()

  try {
    const token = await refreshPromise
    return token
  } finally {
    refreshPromise = null
  }
}

async function doRefresh(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    clearTokens()
    throw new Error('No refresh token available')
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      clearTokens()
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const data = await response.json()
    accessToken = data.accessToken
    return data.accessToken
  } catch (error) {
    clearTokens()
    throw error
  }
}
