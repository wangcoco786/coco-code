import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setTokens } from '@/lib/tokenManager'
import styles from './Login.module.css'

/**
 * SSO Auth Callback Handler
 * - SSO 回调成功后重定向到 /auth/callback?accessToken=xxx&refreshToken=yyy
 * - 从 URL 参数提取 Token 并存储到 TokenManager
 * - 存储成功后导航到 /dashboard
 * Requirements: 2.7
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken)
      navigate('/dashboard', { replace: true })
    } else {
      setError('登录失败：未收到有效的认证令牌')
    }
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className={styles.error}>
        <p className={styles.errorText}>{error}</p>
        <button
          type="button"
          className={styles.retryButton}
          onClick={() => {
            window.location.href = '/api/auth/sso/login'
          }}
        >
          重新登录
        </button>
      </div>
    )
  }

  return (
    <div className={styles.loading}>
      <p>正在完成登录...</p>
    </div>
  )
}
