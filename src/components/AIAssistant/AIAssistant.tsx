import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { jiraClient } from '@/lib/jiraClient'
import styles from './AIAssistant.module.css'

// ============================================================
// AgentForce WebSocket AI 助手
// ============================================================

const WS_URL = 'wss://agentforce.item.pub/ws/open/chat'
const API_KEY = 'laf_8416833a931a7fc7a7078fad36aec10e'
const AGENT_ID = 'e4a00a96-b3e2-4b29-84b2-c62e5f9f4169'

const JIRA_TOOLS = [
  {
    name: 'search_jira_issues',
    description: '搜索 Jira 项目中的 Issue。可以按项目、状态、优先级、关键词等条件搜索任务。',
    inputSchema: {
      jql: { type: 'string', description: 'JQL 查询语句，如 project = DTS AND sprint in openSprints()' },
      maxResults: { type: 'number', description: '最多返回条数，默认 20' },
    },
  },
  {
    name: 'get_sprint_status',
    description: '获取指定项目当前活跃 Sprint 的状态，包括任务数量、完成率、成员分配等。',
    inputSchema: {
      projectKey: { type: 'string', description: '项目 Key，如 DTS、WISE2018 等' },
    },
  },
  {
    name: 'get_project_list',
    description: '获取 Jira 中所有项目的列表。',
    inputSchema: {},
  },
  {
    name: 'get_issue_detail',
    description: '获取指定 Issue 的详细信息。',
    inputSchema: {
      issueKey: { type: 'string', description: 'Issue Key，如 DTS-1234' },
    },
  },
]

async function executeJiraTool(toolName: string, toolInput: Record<string, unknown>): Promise<string> {
  try {
    switch (toolName) {
      case 'search_jira_issues': {
        const jql = (toolInput.jql as string) || 'project is not EMPTY ORDER BY updated DESC'
        const maxResults = (toolInput.maxResults as number) || 20
        const result = await jiraClient.searchIssues(
          jql, ['summary', 'status', 'priority', 'assignee', 'created', 'updated'], 0, maxResults
        )
        const issues = result.issues.map(i => ({
          key: i.key, summary: i.fields.summary, status: i.fields.status.name,
          priority: i.fields.priority.name, assignee: i.fields.assignee?.displayName ?? '未分配',
        }))
        return JSON.stringify({ total: result.total, issues })
      }
      case 'get_sprint_status': {
        const projectKey = toolInput.projectKey as string
        if (!projectKey) return JSON.stringify({ error: '需要提供 projectKey' })
        const sprints = await jiraClient.getActiveSprints(projectKey)
        if (!sprints.length) return JSON.stringify({ message: `项目 ${projectKey} 暂无活跃 Sprint` })
        const sprintInfo = await Promise.all(
          sprints.map(async sprint => {
            const issues = await jiraClient.getActiveSprintIssues(projectKey)
            const total = issues.issues.length
            const done = issues.issues.filter(i => ['Done', 'Closed', 'Resolved', '已完成'].includes(i.fields.status.name)).length
            return { name: sprint.name, startDate: sprint.startDate, endDate: sprint.endDate,
              totalIssues: total, completedIssues: done,
              completionRate: total > 0 ? `${Math.round((done / total) * 100)}%` : '0%' }
          })
        )
        return JSON.stringify({ activeSprints: sprintInfo })
      }
      case 'get_project_list': {
        const projects = await jiraClient.getProjects()
        return JSON.stringify({ total: projects.length, projects: projects.slice(0, 30).map(p => ({ key: p.key, name: p.name })) })
      }
      case 'get_issue_detail': {
        const issueKey = toolInput.issueKey as string
        if (!issueKey) return JSON.stringify({ error: '需要提供 issueKey' })
        const issue = await jiraClient.getIssue(issueKey)
        return JSON.stringify({ key: issue.key, summary: issue.fields.summary, status: issue.fields.status.name,
          priority: issue.fields.priority.name, assignee: issue.fields.assignee?.displayName ?? '未分配',
          created: issue.fields.created, updated: issue.fields.updated })
      }
      default:
        return JSON.stringify({ error: `未知工具: ${toolName}` })
    }
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : '工具执行失败' })
  }
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  isStreaming?: boolean
  toolCalls?: { name: string; status: 'running' | 'done' }[]
}

export default function AIAssistant() {
  const { currentProjectKey } = useApp()
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: '你好！我是 Mini Coco 🤖\n可以帮你查询 Jira 项目数据、分析 Sprint 进度、搜索任务等。有什么需要帮忙的吗？' },
  ])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentMsgIdRef = useRef<string | null>(null)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 关闭动画
  function handleClose() {
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 250)
  }

  // ESC 关闭
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket(`${WS_URL}?api_key=${API_KEY}`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'init', agent_id: AGENT_ID,
        session_id: sessionIdRef.current ?? undefined,
        tools: JIRA_TOOLS,
        env: currentProjectKey ? { CURRENT_PROJECT: currentProjectKey } : undefined,
      }))
    }

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data)
      switch (msg.type) {
        case 'connected':
          sessionIdRef.current = msg.session_id
          setIsConnected(true)
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }))
          }, 25000)
          break
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }))
          break
        case 'text': {
          const msgId = currentMsgIdRef.current
          if (!msgId) break
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: m.content + msg.content, isStreaming: true } : m))
          break
        }
        case 'thinking': {
          const msgId = currentMsgIdRef.current
          if (!msgId) break
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, thinking: (m.thinking ?? '') + msg.content } : m))
          break
        }
        case 'tool_use': {
          const msgId = currentMsgIdRef.current
          if (!msgId) break
          setMessages(prev => prev.map(m => m.id === msgId
            ? { ...m, toolCalls: [...(m.toolCalls ?? []), { name: msg.name, status: 'running' as const }] } : m))
          break
        }
        case 'tool_result': {
          const msgId = currentMsgIdRef.current
          if (!msgId) break
          setMessages(prev => prev.map(m => m.id === msgId
            ? { ...m, toolCalls: m.toolCalls?.map(tc => tc.status === 'running' ? { ...tc, status: 'done' as const } : tc) } : m))
          break
        }
        case 'external_tool_call': {
          const result = await executeJiraTool(msg.tool_name, msg.tool_input as Record<string, unknown>)
          ws.send(JSON.stringify({ type: 'external_tool_result', request_id: msg.request_id, result, is_error: false }))
          break
        }
        case 'done':
          setIsLoading(false)
          if (currentMsgIdRef.current) {
            setMessages(prev => prev.map(m => m.id === currentMsgIdRef.current ? { ...m, isStreaming: false } : m))
          }
          currentMsgIdRef.current = null
          break
        case 'error':
          setIsLoading(false)
          currentMsgIdRef.current = null
          setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: `❌ 出错了：${msg.message}` }])
          break
      }
    }

    ws.onclose = () => { setIsConnected(false); if (pingIntervalRef.current) clearInterval(pingIntervalRef.current) }
    ws.onerror = () => { setIsConnected(false) }
  }, [currentProjectKey])

  useEffect(() => {
    if (open) connect()
    return () => { if (!open && wsRef.current) { wsRef.current.close(); wsRef.current = null } }
  }, [open, connect])

  function sendMessage() {
    const text = input.trim()
    if (!text || isLoading) return
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect(); setTimeout(() => sendMessage(), 1000); return
    }
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: text }])
    setInput('')
    const aiMsgId = `ai-${Date.now()}`
    currentMsgIdRef.current = aiMsgId
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', isStreaming: true }])
    setIsLoading(true)
    wsRef.current.send(JSON.stringify({ type: 'user_message', content: text }))
  }

  function clearChat() {
    sessionIdRef.current = null
    wsRef.current?.close(); wsRef.current = null; setIsConnected(false)
    setMessages([{ id: 'welcome', role: 'assistant', content: '对话已清空。有什么需要帮忙的吗？' }])
    setTimeout(() => connect(), 300)
  }

  return (
    <>
      {/* 遮罩层 - 点击关闭 */}
      {open && <div className={`${styles.overlay} ${closing ? styles.overlayOut : ''}`} onClick={handleClose} />}

      {/* FAB 按钮 */}
      {!open && (
        <button className={styles.fab} onClick={() => setOpen(true)} title="AI 小助手 (Esc 关闭)">
          <span className={styles.fabIcon}>🤖</span>
          {isConnected && <span className={styles.onlineDot} />}
          <span className={styles.fabPulse} />
        </button>
      )}

      {/* 对话面板 */}
      {open && (
        <div className={`${styles.panel} ${closing ? styles.panelOut : ''}`}>
          {/* 头部 */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.avatarWrap}>
                <span className={styles.avatar}>🤖</span>
                <span className={isConnected ? styles.avatarDotOnline : styles.avatarDotOffline} />
              </div>
              <div>
                <div className={styles.title}>Mini Coco</div>
                <div className={styles.subtitle}>{isConnected ? '在线 · 随时为你服务' : '连接中...'}</div>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.headerBtn} onClick={clearChat} title="清空对话">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <button className={styles.closeBtn} onClick={handleClose} title="关闭 (Esc)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* 消息列表 */}
          <div className={styles.messages}>
            {messages.map(msg => (
              <div key={msg.id} className={`${styles.msg} ${msg.role === 'user' ? styles.user : styles.bot}`}>
                {msg.role === 'assistant' && (
                  <div className={styles.msgAvatar}>🤖</div>
                )}
                <div className={styles.msgBody}>
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className={styles.toolCalls}>
                      {msg.toolCalls.map((tc, i) => (
                        <div key={i} className={`${styles.toolCall} ${tc.status === 'done' ? styles.toolDone : ''}`}>
                          <span className={styles.toolIcon}>{tc.status === 'running' ? '⏳' : '✅'}</span>
                          {tc.name.split('_').join(' ')}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles.bubble}>
                    {msg.content || (msg.isStreaming ? <span className={styles.cursor} /> : '')}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷问题 */}
          {messages.length <= 1 && (
            <div className={styles.quickBtns}>
              {['当前项目有哪些高优任务？', 'Sprint 完成率怎么样？', '有哪些未分配的任务？', '帮我查一下 DTS 项目'].map(q => (
                <button key={q} className={styles.quickBtn} onClick={() => { setInput(q); setTimeout(sendMessage, 0) }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* 输入区 */}
          <div className={styles.inputArea}>
            <input
              className={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="输入你的问题..."
              disabled={isLoading}
            />
            <button className={styles.sendBtn} onClick={sendMessage} disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <span className={styles.loadingDots}><span /><span /><span /></span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
