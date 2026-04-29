import styles from './Login.module.css'

/**
 * SSO Login Page
 * - 仅显示平台 Logo/名称 + "SSO 登录"按钮
 * - 点击按钮跳转到 /api/auth/sso/login 发起 SSO 流程
 * - 不提供任何本地用户名/密码输入字段或注册入口
 * Requirements: 1.1, 1.4, 2.7
 */
export default function Login() {
  const handleSSOLogin = () => {
    // 跳转到后端 SSO 登录发起端点，由 OIDC Client 构造 Authorization URL 并 302 重定向到 IAM
    window.location.href = '/api/auth/sso/login'
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img
          src="/favicon.svg"
          alt="AI-PM Platform Logo"
          className={styles.logo}
        />
        <h1 className={styles.title}>AI-PM Platform</h1>
        <p className={styles.subtitle}>企业统一身份认证登录</p>
        <button
          type="button"
          className={styles.ssoButton}
          onClick={handleSSOLogin}
        >
          SSO 登录
        </button>
      </div>
    </div>
  )
}
