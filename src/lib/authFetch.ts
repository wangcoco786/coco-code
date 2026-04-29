// authFetch — 封装 fetch，自动注入 Authorization 头并处理 Token 过期刷新
import { getAccessToken, refreshAccessToken, clearTokens } from './tokenManager'

/**
 * 封装 fetch，自动注入 Bearer Token。
 * 收到 401 + X-Token-Expired: true 时自动刷新 Token 并重试一次。
 * 刷新失败时清除 Token 并重定向到 /login。
 */
export async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const response = await fetchWithToken(url, options)

  // 非 401 或非 Token 过期 → 直接返回
  if (
    response.status !== 401 ||
    response.headers.get('X-Token-Expired') !== 'true'
  ) {
    return response
  }

  // Token 过期 → 尝试刷新
  try {
    await refreshAccessToken()
  } catch {
    // 刷新失败 → 清除 Token，重定向到登录页
    clearTokens()
    window.location.href = '/login'
    return response
  }

  // 刷新成功 → 用新 Token 重试原始请求
  return fetchWithToken(url, options)
}

/**
 * 内部辅助：发起带 Authorization 头的 fetch 请求
 */
function fetchWithToken(url: string, options: RequestInit): Promise<Response> {
  const token = getAccessToken()
  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(url, { ...options, headers })
}
