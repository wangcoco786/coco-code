import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { jiraClient } from '@/lib/jiraClient'
import { buildPageContext } from '@/lib/aiContextBuilder'
import type { PageType, AIContext, PlatformIssue } from '@/types/platform'
import { mapJiraIssueToPlatform } from '@/lib/statusMapper'
import styles from './AIAssistant.module.css'

// ============================================================
// LinkifiedText — 将文本中的 URL 和 Jira ticket ID 转为可点击链接
// ============================================================

const JIRA_BASE_URL = import.meta.env.VITE_JIRA_BASE_URL || ''

function LinkifiedText({ text }: { text: string }) {
  let processed = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
  const mdLinks: { placeholder: string; label: string; url: string }[] = []
  processed = processed.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_match, label, url) => {
    const placeholder = `__MDLINK_${mdLinks.length}__`
    mdLinks.push({ placeholder, label, url })
    return placeholder
  })

  const lines = processed.split('\n')
  const result: React.ReactNode[] = []

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) result.push(<br key={`br-${lineIdx}`} />)
    const segments = line.split(/(__MDLINK_\d+__)/g)

    segments.forEach((segment, segIdx) => {
      const mdMatch = mdLinks.find(l => l.placeholder === segment)
      if (mdMatch) {
        result.push(
          <a key={`md-${lineIdx}-${segIdx}`} href={mdMatch.url} target="_blank" rel="noopener noreferrer"
            style={{ color: '#667eea', fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}>
            {mdMatch.label}
          </a>
        )
        return
      }

      let lastIdx = 0
      const combinedRegex = new RegExp(`(https?:\\/\\/[^\\s<)\\]]+)|(\\b[A-Z][A-Z0-9]+-\\d+\\b)`, 'g')
      let m: RegExpExecArray | null

      while ((m = combinedRegex.exec(segment)) !== null) {
        if (m.index > lastIdx) result.push(segment.slice(lastIdx, m.index))
        const [, rawUrl, ticketKey] = m

        if (rawUrl) {
          const cleanUrl = rawUrl.replace(/[)]+$/, '')
          result.push(
            <a key={`url-${lineIdx}-${segIdx}-${m.index}`} href={cleanUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: '#667eea', textDecoration: 'underline', wordBreak: 'break-all' }}>{cleanUrl}</a>
          )
          if (cleanUrl.length < rawUrl.length) result.push(rawUrl.slice(cleanUrl.length))
        } else if (ticketKey) {
          const href = JIRA_BASE_URL ? `${JIRA_BASE_URL}/browse/${ticketKey}` : ''
          if (href) {
            result.push(
              <a key={`ticket-${lineIdx}-${segIdx}-${m.index}`} href={href} target="_blank" rel="noopener noreferrer"
                style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none', borderBottom: '1px dashed #667eea' }}>{ticketKey}</a>
            )
          } else {
            result.push(ticketKey)
          }
        }
        lastIdx = m.index + m[0].length
      }
      if (lastIdx < segment.length) result.push(segment.slice(lastIdx))
    })
  })

  return <>{result}</>
}

// ============================================================
// 配置常量
// ============================================================
const WS_URL = 'wss://agentforce.item.pub/ws/open/chat'
const API_KEY = 'laf_8416833a931a7fc7a7078fad36aec10e'
const AGENT_ID = 'e4a00a96-b3e2-4b29-84b2-c62e5f9f4169'
const CHAT_HISTORY_KEY = 'ai-pm-chat-history'
const MAX_HISTORY_MESSAGES = 50

// ============================================================
// 缓存系统
// ============================================================
interface CacheEntry<T> { data: T; time: number }
const toolCache = new Map<string, CacheEntry<string>>()
const TOOL_CACHE_TTL = 5 * 60 * 1000
const DATA_CACHE_TTL = 3 * 60 * 1000

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string, ttl: number): T | null {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.time < ttl) return entry.data
  return null
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, time: Date.now() })
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) cache.delete(oldestKey)
  }
}

// ============================================================
// 预加载的平台数据（供机器人直接使用）
// ============================================================
interface PreloadedData {
  currentProject: string | null
  sprintIssues: PlatformIssue[]
  sprintSummary: { name: string; total: number; done: number; rate: string } | null
  projectList: { key: string; name: string }[]
  lastUpdate: number
}

let preloadedData: PreloadedData = {
  currentProject: null,
  sprintIssues: [],
  sprintSummary: null,
  projectList: [],
  lastUpdate: 0,
}

async function preloadProjectData(projectKey: string | null): Promise<void> {
  if (!projectKey) return
  if (preloadedData.currentProject === projectKey && Date.now() - preloadedData.lastUpdate < DATA_CACHE_TTL) return

  console.log(`[AI] Preloading data for ${projectKey}...`)
  try {
    const [sprintResult, projects] = await Promise.all([
      jiraClient.getActiveSprintIssues(projectKey).catch(() => ({ issues: [] })),
      jiraClient.getProjects().catch(() => []),
    ])

    const issues = sprintResult.issues.map(i => mapJiraIssueToPlatform(i))
    const doneCount = issues.filter(i => i.status === 'done').length
    const sprints = await jiraClient.getActiveSprints(projectKey).catch(() => [])

    preloadedData = {
      currentProject: projectKey,
      sprintIssues: issues,
      sprintSummary: sprints[0] ? {
        name: sprints[0].name,
        total: issues.length,
        done: doneCount,
        rate: issues.length > 0 ? `${Math.round((doneCount / issues.length) * 100)}%` : '0%'
      } : null,
      projectList: projects.slice(0, 30).map(p => ({ key: p.key, name: p.name })),
      lastUpdate: Date.now(),
    }
    console.log(`[AI] Preloaded: ${issues.length} issues, ${projects.length} projects`)
  } catch (err) {
    console.error('[AI] Preload failed:', err)
  }
}

// ============================================================
// 增强版工具定义
// ============================================================
const JIRA_TOOLS = [
  {
    name: 'get_current_page_data',
    description: '获取当前页面的数据和上下文信息，包括正在查看的任务列表、Sprint 状态等。这是最快的数据获取方式。',
    inputSchema: {},
  },
  {
    name: 'search_jira_issues',
    description: '搜索 Jira 项目中的 Issue。可以按项目、状态、优先级、关键词等条件搜索任务。',
    inputSchema: {
      jql: { type: 'string', description: 'JQL 查询语句，如 project = RP AND sprint in openSprints()' },
      maxResults: { type: 'number', description: '最多返回条数，默认 20' },
    },
  },
  {
    name: 'get_sprint_status',
    description: '获取指定项目当前活跃 Sprint 的状态，包括任务数量、完成率等。',
    inputSchema: {
      projectKey: { type: 'string', description: '项目 Key，如 RP、APS、TRF 等' },
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
      issueKey: { type: 'string', description: 'Issue Key，如 RP-1234' },
    },
  },
  {
    name: 'analyze_workload',
    description: '分析团队成员的工作负载分布，找出超载或空闲的成员。',
    inputSchema: {
      projectKey: { type: 'string', description: '项目 Key' },
    },
  },
  {
    name: 'find_stale_issues',
    description: '查找长时间未更新的任务（停滞任务），默认查找超过3天未更新的任务。',
    inputSchema: {
      projectKey: { type: 'string', description: '项目 Key' },
      days: { type: 'number', description: '停滞天数阈值，默认 3' },
    },
  },
  {
    name: 'get_high_priority_issues',
    description: '获取高优先级（P0/P1）的未完成任务。',
    inputSchema: {
      projectKey: { type: 'string', description: '项目 Key' },
    },
  },
]

// 当前页面上下文引用（由组件更新）
let currentPageContext: AIContext | null = null
let currentProjectKeyRef: string | null = null

async function executeJiraTool(toolName: string, toolInput: Record<string, unknown>): Promise<string> {
  const cacheKey = `${toolName}:${JSON.stringify(toolInput)}`
  const cached = getCached(toolCache, cacheKey, TOOL_CACHE_TTL)
  if (cached) {
    console.log(`[AI Tool] Cache HIT: ${toolName}`)
    return cached
  }

  console.log(`[AI Tool] Executing: ${toolName}`)
  const startTime = Date.now()

  try {
    let result: string

    switch (toolName) {
      case 'get_current_page_data': {
        // 直接返回预加载的数据，超快！
        const data = {
          page: currentPageContext?.pageType ?? 'unknown',
          summary: currentPageContext?.summary ?? '',
          project: currentProjectKeyRef,
          sprint: preloadedData.sprintSummary,
          issueCount: preloadedData.sprintIssues.length,
          statusBreakdown: getStatusBreakdown(preloadedData.sprintIssues),
          priorityBreakdown: getPriorityBreakdown(preloadedData.sprintIssues),
          unassignedCount: preloadedData.sprintIssues.filter(i => !i.assignee).length,
        }
        result = JSON.stringify(data)
        break
      }

      case 'search_jira_issues': {
        const jql = (toolInput.jql as string) || 'project is not EMPTY ORDER BY updated DESC'
        const maxResults = (toolInput.maxResults as number) || 20
        const apiResult = await jiraClient.searchIssues(
          jql, ['summary', 'status', 'priority', 'assignee', 'created', 'updated'], 0, maxResults
        )
        const issues = apiResult.issues.map(i => ({
          key: i.key, summary: i.fields.summary, status: i.fields.status.name,
          priority: i.fields.priority.name, assignee: i.fields.assignee?.displayName ?? '未分配',
        }))
        result = JSON.stringify({ total: apiResult.total, issues })
        break
      }

      case 'get_sprint_status': {
        const projectKey = (toolInput.projectKey as string) || currentProjectKeyRef
        if (!projectKey) return JSON.stringify({ error: '需要提供 projectKey' })

        // 如果是当前项目，使用预加载数据
        if (projectKey === preloadedData.currentProject && preloadedData.sprintSummary) {
          result = JSON.stringify({
            project: projectKey,
            sprint: preloadedData.sprintSummary,
            statusBreakdown: getStatusBreakdown(preloadedData.sprintIssues),
          })
          break
        }

        const sprints = await jiraClient.getActiveSprints(projectKey)
        if (!sprints.length) return JSON.stringify({ message: `项目 ${projectKey} 暂无活跃 Sprint` })
        
        const issues = await jiraClient.getActiveSprintIssues(projectKey)
        const total = issues.issues.length
        const done = issues.issues.filter(i => ['Done', 'Closed', 'Resolved', '已完成'].includes(i.fields.status.name)).length
        
        result = JSON.stringify({
          project: projectKey,
          sprint: {
            name: sprints[0].name,
            startDate: sprints[0].startDate,
            endDate: sprints[0].endDate,
            total, done,
            rate: total > 0 ? `${Math.round((done / total) * 100)}%` : '0%'
          }
        })
        break
      }

      case 'get_project_list': {
        if (preloadedData.projectList.length > 0) {
          result = JSON.stringify({ total: preloadedData.projectList.length, projects: preloadedData.projectList })
          break
        }
        const projects = await jiraClient.getProjects()
        result = JSON.stringify({ total: projects.length, projects: projects.slice(0, 30).map(p => ({ key: p.key, name: p.name })) })
        break
      }

      case 'get_issue_detail': {
        const issueKey = toolInput.issueKey as string
        if (!issueKey) return JSON.stringify({ error: '需要提供 issueKey' })
        
        // 先从预加载数据中查找
        const cached = preloadedData.sprintIssues.find(i => i.id === issueKey)
        if (cached) {
          result = JSON.stringify({
            key: cached.id, summary: cached.title, status: cached.statusName,
            priority: cached.priority, assignee: cached.assignee?.name ?? '未分配',
          })
          break
        }

        const issue = await jiraClient.getIssue(issueKey)
        result = JSON.stringify({
          key: issue.key, summary: issue.fields.summary, status: issue.fields.status.name,
          priority: issue.fields.priority.name, assignee: issue.fields.assignee?.displayName ?? '未分配',
          created: issue.fields.created, updated: issue.fields.updated
        })
        break
      }

      case 'analyze_workload': {
        const projectKey = (toolInput.projectKey as string) || currentProjectKeyRef
        if (!projectKey) return JSON.stringify({ error: '需要提供 projectKey' })

        const issues = projectKey === preloadedData.currentProject
          ? preloadedData.sprintIssues
          : (await jiraClient.getActiveSprintIssues(projectKey)).issues.map(i => mapJiraIssueToPlatform(i))

        const workload: Record<string, { total: number; inProgress: number; done: number }> = {}
        for (const issue of issues) {
          const name = issue.assignee?.name ?? '未分配'
          if (!workload[name]) workload[name] = { total: 0, inProgress: 0, done: 0 }
          workload[name].total++
          if (issue.status === 'done') workload[name].done++
          else if (issue.status === 'in_progress') workload[name].inProgress++
        }

        const sorted = Object.entries(workload)
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.total - a.total)

        result = JSON.stringify({ project: projectKey, members: sorted })
        break
      }

      case 'find_stale_issues': {
        const projectKey = (toolInput.projectKey as string) || currentProjectKeyRef
        const days = (toolInput.days as number) || 3
        if (!projectKey) return JSON.stringify({ error: '需要提供 projectKey' })

        const issues = projectKey === preloadedData.currentProject
          ? preloadedData.sprintIssues
          : (await jiraClient.getActiveSprintIssues(projectKey)).issues.map(i => mapJiraIssueToPlatform(i))

        const threshold = Date.now() - days * 24 * 60 * 60 * 1000
        const stale = issues
          .filter(i => i.status !== 'done' && new Date(i.updatedAt).getTime() < threshold)
          .map(i => ({
            key: i.id, summary: i.title, status: i.statusName,
            assignee: i.assignee?.name ?? '未分配',
            daysSinceUpdate: Math.floor((Date.now() - new Date(i.updatedAt).getTime()) / 86400000)
          }))
          .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)

        result = JSON.stringify({ project: projectKey, threshold: `${days}天`, staleIssues: stale })
        break
      }

      case 'get_high_priority_issues': {
        const projectKey = (toolInput.projectKey as string) || currentProjectKeyRef
        if (!projectKey) return JSON.stringify({ error: '需要提供 projectKey' })

        const issues = projectKey === preloadedData.currentProject
          ? preloadedData.sprintIssues
          : (await jiraClient.getActiveSprintIssues(projectKey)).issues.map(i => mapJiraIssueToPlatform(i))

        const highPriority = issues
          .filter(i => (i.priority === 'P0' || i.priority === 'P1') && i.status !== 'done')
          .map(i => ({
            key: i.id, summary: i.title, priority: i.priority,
            status: i.statusName, assignee: i.assignee?.name ?? '未分配'
          }))

        result = JSON.stringify({ project: projectKey, highPriorityIssues: highPriority })
        break
      }

      default:
        return JSON.stringify({ error: `未知工具: ${toolName}` })
    }

    console.log(`[AI Tool] ${toolName} completed in ${Date.now() - startTime}ms`)
    setCache(toolCache, cacheKey, result)
    return result
  } catch (err) {
    console.error(`[AI Tool] ${toolName} failed:`, err)
    return JSON.stringify({ error: err instanceof Error ? err.message : '工具执行失败' })
  }
}

function getStatusBreakdown(issues: PlatformIssue[]): Record<string, number> {
  const breakdown: Record<string, number> = {}
  for (const i of issues) {
    breakdown[i.statusName] = (breakdown[i.statusName] ?? 0) + 1
  }
  return breakdown
}

function getPriorityBreakdown(issues: PlatformIssue[]): Record<string, number> {
  const breakdown: Record<string, number> = {}
  for (const i of issues) {
    breakdown[i.priority] = (breakdown[i.priority] ?? 0) + 1
  }
  return breakdown
}

// ============================================================
// 对话历史持久化
// ============================================================
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  isStreaming?: boolean
  toolCalls?: { name: string; status: 'running' | 'done' }[]
  timestamp?: number
}

function loadChatHistory(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY)
    if (saved) {
      const history = JSON.parse(saved) as ChatMessage[]
      // 只保留最近的消息
      return history.slice(-MAX_HISTORY_MESSAGES)
    }
  } catch (e) {
    console.warn('[AI] Failed to load chat history:', e)
  }
  return []
}

function saveChatHistory(messages: ChatMessage[]): void {
  try {
    const toSave = messages
      .filter(m => m.id !== 'welcome' && !m.isStreaming)
      .slice(-MAX_HISTORY_MESSAGES)
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.warn('[AI] Failed to save chat history:', e)
  }
}

// ============================================================
// 主组件
// ============================================================
export default function AIAssistant() {
  const { currentProjectKey } = useApp()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  
  // 初始化消息：欢迎语 + 历史记录
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const history = loadChatHistory()
    const welcome: ChatMessage = {
      id: 'welcome', role: 'assistant',
      content: '你好！我是 Mini Coco 🤖\n可以帮你查询项目数据、分析 Sprint 进度、搜索任务等。试试问我"当前项目进度如何？"'
    }
    return history.length > 0 ? [welcome, ...history] : [welcome]
  })
  
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pageContext, setPageContext] = useState<AIContext | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentMsgIdRef = useRef<string | null>(null)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const preconnectAttemptedRef = useRef(false)

  // 更新全局引用（供工具使用）
  useEffect(() => {
    currentProjectKeyRef = currentProjectKey
  }, [currentProjectKey])

  // 构建页面上下文 + 预加载数据
  useEffect(() => {
    const path = location.pathname.replace('/', '') || 'dashboard'
    const pageTypeMap: Record<string, PageType> = {
      dashboard: 'dashboard', sprint: 'sprint', requirements: 'requirements',
      risk: 'risk', reports: 'reports', roadmap: 'roadmap',
    }
    const pageType = pageTypeMap[path] ?? 'dashboard'
    const ctx = buildPageContext(pageType, { projectKey: currentProjectKey })
    setPageContext(ctx)
    currentPageContext = ctx

    // 预加载项目数据
    if (currentProjectKey) {
      preloadProjectData(currentProjectKey)
    }
  }, [location.pathname, currentProjectKey])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 保存对话历史
  useEffect(() => {
    if (messages.length > 1) {
      saveChatHistory(messages)
    }
  }, [messages])

  // ESC 关闭
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function handleClose() {
    setClosing(true)
    setTimeout(() => { setOpen(false); setClosing(false) }, 250)
  }

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket(`${WS_URL}?api_key=${API_KEY}`)
    wsRef.current = ws

    ws.onopen = () => {
      // 发送初始化消息，包含上下文
      ws.send(JSON.stringify({
        type: 'init',
        agent_id: AGENT_ID,
        session_id: sessionIdRef.current ?? undefined,
        tools: JIRA_TOOLS,
        env: {
          CURRENT_PROJECT: currentProjectKeyRef ?? '',
          PAGE_CONTEXT: currentPageContext?.summary ?? '',
          PRELOADED_SPRINT: preloadedData.sprintSummary ? JSON.stringify(preloadedData.sprintSummary) : '',
        },
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
            setMessages(prev => prev.map(m => m.id === currentMsgIdRef.current
              ? { ...m, isStreaming: false, timestamp: Date.now() } : m))
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
  }, [])

  useEffect(() => {
    if (open) connect()
    return () => { if (!open && wsRef.current) { wsRef.current.close(); wsRef.current = null } }
  }, [open, connect])

  // 预连接：悬停时提前建立连接
  const handleFabMouseEnter = useCallback(() => {
    if (!preconnectAttemptedRef.current && !wsRef.current) {
      preconnectAttemptedRef.current = true
      // 同时预加载数据
      if (currentProjectKeyRef) preloadProjectData(currentProjectKeyRef)
      connect()
    }
  }, [connect])

  function sendMessage() {
    const text = input.trim()
    if (!text || isLoading) return
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect()
      setTimeout(() => sendMessage(), 1000)
      return
    }

    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: Date.now() }])
    setInput('')
    
    const aiMsgId = `ai-${Date.now()}`
    currentMsgIdRef.current = aiMsgId
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', isStreaming: true }])
    setIsLoading(true)

    // 发送消息时附带上下文
    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      content: text,
      context: {
        project: currentProjectKeyRef,
        page: currentPageContext?.pageType,
        pageSummary: currentPageContext?.summary,
      }
    }))
  }

  function clearChat() {
    sessionIdRef.current = null
    wsRef.current?.close()
    wsRef.current = null
    setIsConnected(false)
    localStorage.removeItem(CHAT_HISTORY_KEY)
    setMessages([{ id: 'welcome', role: 'assistant', content: '对话已清空。有什么需要帮忙的吗？' }])
    setTimeout(() => connect(), 300)
  }

  // 动态快捷问题（基于当前上下文）
  const quickQuestions = React.useMemo(() => {
    const base = ['当前项目进度如何？', '有哪些高优先级任务？']
    if (currentProjectKey) {
      base.push(`${currentProjectKey} 有停滞的任务吗？`)
      base.push(`分析一下 ${currentProjectKey} 的工作负载`)
    } else {
      base.push('有哪些项目？')
      base.push('帮我搜索最近更新的任务')
    }
    return base.slice(0, 4)
  }, [currentProjectKey])

  return (
    <>
      {open && <div className={`${styles.overlay} ${closing ? styles.overlayOut : ''}`} onClick={handleClose} />}

      {!open && (
        <button className={styles.fab} onClick={() => setOpen(true)} onMouseEnter={handleFabMouseEnter}
          title="AI 小助手 (Esc 关闭)">
          <span className={styles.fabIcon}>🤖</span>
          {isConnected && <span className={styles.onlineDot} />}
          <span className={styles.fabPulse} />
        </button>
      )}

      {open && (
        <div className={`${styles.panel} ${closing ? styles.panelOut : ''}`}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.avatarWrap}>
                <span className={styles.avatar}>🤖</span>
                <span className={isConnected ? styles.avatarDotOnline : styles.avatarDotOffline} />
              </div>
              <div>
                <div className={styles.title}>Mini Coco</div>
                <div className={styles.subtitle}>
                  {isConnected
                    ? (currentProjectKey ? `在线 · ${currentProjectKey}` : '在线 · 随时为你服务')
                    : '连接中...'}
                </div>
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

          <div className={styles.messages}>
            {messages.map(msg => (
              <div key={msg.id} className={`${styles.msg} ${msg.role === 'user' ? styles.user : styles.bot}`}>
                {msg.role === 'assistant' && <div className={styles.msgAvatar}>🤖</div>}
                <div className={styles.msgBody}>
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className={styles.toolCalls}>
                      {msg.toolCalls.map((tc, i) => (
                        <div key={i} className={`${styles.toolCall} ${tc.status === 'done' ? styles.toolDone : ''}`}>
                          <span className={styles.toolIcon}>{tc.status === 'running' ? '⏳' : '✅'}</span>
                          {tc.name.replace(/_/g, ' ')}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles.bubble}>
                    {msg.content ? <LinkifiedText text={msg.content} /> : (msg.isStreaming ? <span className={styles.cursor} /> : '')}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {pageContext && messages.length <= 1 && (
            <div className={styles.contextSection}>
              <div className={styles.contextSummary}>{pageContext.summary}</div>
              {pageContext.suggestions.length > 0 && (
                <div className={styles.suggestionsRow}>
                  {pageContext.suggestions.slice(0, 2).map((suggestion, idx) => (
                    <button key={idx} className={styles.suggestionChip}
                      onClick={() => { setInput(suggestion); setTimeout(sendMessage, 0) }}>
                      💡 {suggestion.length > 20 ? suggestion.slice(0, 20) + '...' : suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.length <= 1 && (
            <div className={styles.quickBtns}>
              {quickQuestions.map(q => (
                <button key={q} className={styles.quickBtn} onClick={() => { setInput(q); setTimeout(sendMessage, 0) }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className={styles.inputArea}>
            <input className={styles.input} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={currentProjectKey ? `询问关于 ${currentProjectKey} 的问题...` : '输入你的问题...'}
              disabled={isLoading} />
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
