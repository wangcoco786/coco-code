import { useState, useCallback, useRef } from 'react'
import { useAgentForce } from '@/hooks/useAgentForce'
import styles from './AIInsight.module.css'

interface AIInsightProps {
  /** 构建发送给 AI 的 prompt */
  buildPrompt: () => string
  /** 面板标题 */
  title?: string
}

export default function AIInsight({ buildPrompt, title = 'AI 智能分析' }: AIInsightProps) {
  const [cached, setCached] = useState<string | null>(null)
  const [streaming, setStreaming] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const streamRef = useRef('')

  const { sendMessage, isLoading, disconnect } = useAgentForce({
    onMessage: (content: string) => {
      streamRef.current += content
      setStreaming(streamRef.current)
    },
    onComplete: (full: string) => {
      setCached(full)
      setStreaming('')
      streamRef.current = ''
      disconnect()
    },
    onError: (err: string) => {
      setError(err)
      setStreaming('')
      streamRef.current = ''
      disconnect()
    },
  })

  const handleGenerate = useCallback(() => {
    setError(null)
    setStreaming('')
    streamRef.current = ''
    setCollapsed(false)
    sendMessage(buildPrompt())
  }, [buildPrompt, sendMessage])

  const hasContent = cached || streaming

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.left}>
          <span className={styles.icon}>🤖</span>
          <span className={styles.label}>{title}</span>
        </div>
        {!hasContent && !isLoading && (
          <button className={styles.generateBtn} onClick={handleGenerate} disabled={isLoading}>
            ✨ 生成分析
          </button>
        )}
        {hasContent && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={styles.generateBtn} onClick={handleGenerate} disabled={isLoading}>
              🔄 重新分析
            </button>
            <button className={styles.collapseBtn} onClick={() => setCollapsed(v => !v)}>
              {collapsed ? '展开' : '收起'}
            </button>
          </div>
        )}
      </div>

      {isLoading && !streaming && (
        <div className={styles.loading}>
          <span>AI 正在分析</span>
          <span className={styles.dots}><span /><span /><span /></span>
        </div>
      )}

      {!collapsed && streaming && <div className={styles.content}>{streaming}</div>}
      {!collapsed && cached && !streaming && <div className={styles.content}>{cached}</div>}

      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button className={styles.retryBtn} onClick={handleGenerate}>重试</button>
        </div>
      )}
    </div>
  )
}
