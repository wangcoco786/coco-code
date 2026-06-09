import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Login.module.css'

const ACCESS_CODE = '123456'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ACCESS_CODE) {
      sessionStorage.setItem('ai-pm-auth', 'true')
      navigate('/dashboard', { replace: true })
    } else {
      setError('密码错误')
    }
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
        <p className={styles.subtitle}>AI 驱动的智能项目管理平台</p>
        <form onSubmit={handleLogin} className={styles.form}>
          <input
            type="password"
            className={styles.input}
            placeholder="请输入访问密码"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            autoFocus
          />
          {error && <p className={styles.errorText}>{error}</p>}
          <button type="submit" className={styles.ssoButton}>
            登 录
          </button>
        </form>
      </div>
    </div>
  )
}
