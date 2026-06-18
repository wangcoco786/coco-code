/**
 * AI-PM Platform — 内网一体化服务器
 * 兼容 Express 4 & 5
 */

import 'dotenv/config'
import express from 'express'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

import { ssoLoginHandler, ssoCallbackHandler } from './src/server/oidcClient.js'
import { refreshToken as refreshTokenService, logout as logoutService } from './src/server/authService.js'
import { authMiddleware } from './src/server/authMiddleware.js'
import { ssoCallbackLimiter } from './src/server/rateLimiter.js'

// ============================================================
// 环境变量启动检查
// ============================================================
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'IAM_CLIENT_ID', 'IAM_CLIENT_SECRET', 'IAM_ISSUER_URL']
const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key])

if (missingVars.length > 0) {
  console.warn(`[警告] 缺少 IAM SSO 环境变量: ${missingVars.join(', ')}`)
  console.warn('[警告] SSO 认证功能将不可用，其他功能正常运行')
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '10mb' }))

// ============================================================
// 认证路由（无需 Auth Middleware 保护）
// ============================================================
app.get('/api/auth/sso/login', ssoLoginHandler)
app.get('/api/auth/sso/callback', ssoCallbackLimiter, ssoCallbackHandler)

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {}
  if (!refreshToken) {
    return res.status(401).json({ error: '刷新令牌无效' })
  }
  try {
    const result = refreshTokenService(refreshToken)
    return res.status(200).json(result)
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message || '刷新令牌无效' })
  }
})

app.post('/api/auth/logout', (req, res) => {
  const { refreshToken } = req.body || {}
  if (refreshToken) {
    logoutService(refreshToken)
  }
  return res.status(200).json({ message: '已登出' })
})

// ============================================================
// Auth Middleware — 保护后续所有 /api/ 路由
// TODO: 启用 IAM SSO 后取消注释
// ============================================================
// app.use('/api', authMiddleware)

// ============================================================
// Jira API 代理  /api/jira/...
// ============================================================

// Simple in-memory cache for Jira API responses (5 min TTL)
const jiraCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCacheKey(method, url) {
  return `${method}:${url}`
}

app.use('/api/jira', async (req, res) => {
  const { JIRA_BASE_URL, JIRA_USERNAME, JIRA_PASSWORD, JIRA_PAT } = process.env

  if (!JIRA_BASE_URL) {
    return res.status(500).json({ error: 'JIRA_BASE_URL 未配置' })
  }
  if (!JIRA_USERNAME && !JIRA_PAT) {
    return res.status(500).json({ error: 'Jira 认证未配置' })
  }

  const authHeader = JIRA_USERNAME
    ? `Basic ${Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD ?? ''}`).toString('base64')}`
    : `Bearer ${JIRA_PAT}`

  // req.url 在 use 中是相对路径（去掉了 /api/jira 前缀）
  const jiraPath = req.url.replace(/^\//, '')
  const targetUrl = `${JIRA_BASE_URL.replace(/\/$/, '')}/${jiraPath}`

  // Check cache for GET requests
  if (req.method === 'GET') {
    const cacheKey = getCacheKey(req.method, targetUrl)
    const cached = jiraCache.get(cacheKey)
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      res.setHeader('X-Cache', 'HIT')
      return res.status(200).json(cached.data)
    }
  }

  try {
    const options = {
      method: req.method,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body)
    }

    const jiraRes = await fetch(targetUrl, options)

    if (!jiraRes.ok) {
      let body
      try { body = await jiraRes.json() } catch { body = { error: `HTTP ${jiraRes.status}` } }
      return res.status(jiraRes.status).json(body)
    }

    const data = await jiraRes.json()
    
    // Cache GET responses
    if (req.method === 'GET') {
      const cacheKey = getCacheKey(req.method, targetUrl)
      jiraCache.set(cacheKey, { data, time: Date.now() })
      res.setHeader('X-Cache', 'MISS')
    }
    
    return res.status(200).json(data)
  } catch (err) {
    console.error('[Jira]', err.message)
    return res.status(502).json({ error: '无法连接到 Jira', detail: err.message })
  }
})

// ============================================================
// 企业微信代理  POST /api/wecom/send
// ============================================================
app.post('/api/wecom/send', async (req, res) => {
  const { WECOM_WEBHOOK_URL } = process.env

  if (!WECOM_WEBHOOK_URL) {
    return res.status(500).json({ error: 'WECOM_WEBHOOK_URL 未配置' })
  }

  const { message } = req.body ?? {}
  if (!message) {
    return res.status(400).json({ error: '缺少 message 字段' })
  }

  try {
    const wecomRes = await fetch(WECOM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    const data = await wecomRes.json()

    if (data.errcode !== 0) {
      return res.status(400).json({ error: `企微错误: ${data.errmsg}`, errcode: data.errcode })
    }

    return res.status(200).json(data)
  } catch (err) {
    console.error('[WeCom]', err.message)
    return res.status(502).json({ error: '无法连接到企业微信', detail: err.message })
  }
})

// ============================================================
// 手动触发每日推送（测试用）POST /api/daily-push
// ============================================================
app.post('/api/daily-push', async (_req, res) => {
  try {
    await sendDailyStaleAlert()
    res.status(200).json({ message: '每日推送已触发' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================================================
// 前端静态文件 + SPA fallback
// ============================================================
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath, {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache')
    }
  }
}))

app.use((_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// ============================================================
// 每日定时推送：2天无更新的 ticket 报警推送到企微群
// ============================================================
const DAILY_PUSH_HOUR = parseInt(process.env.DAILY_PUSH_HOUR || '9', 10) // 默认早上9点
const DAILY_PUSH_PROJECTS = (process.env.DAILY_PUSH_PROJECTS || 'RP,TRF,APS').split(',').map(s => s.trim())
const STALE_THRESHOLD_HOURS = 48 // 2天

async function fetchStaleIssuesForProject(projectKey) {
  const { JIRA_BASE_URL, JIRA_USERNAME, JIRA_PASSWORD, JIRA_PAT } = process.env
  if (!JIRA_BASE_URL || (!JIRA_USERNAME && !JIRA_PAT)) return []

  const authHeader = JIRA_USERNAME
    ? `Basic ${Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD ?? ''}`).toString('base64')}`
    : `Bearer ${JIRA_PAT}`

  const jql = `project = ${projectKey} AND sprint in openSprints() AND status != Done AND updated <= -2d ORDER BY updated ASC`
  const url = `${JIRA_BASE_URL.replace(/\/$/, '')}/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary,assignee,updated,status&maxResults=100`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json', Accept: 'application/json' },
    })
    if (!res.ok) {
      console.error(`[定时推送] Jira查询失败: ${res.status}`)
      return []
    }
    const data = await res.json()
    return (data.issues ?? []).map(issue => ({
      key: issue.key,
      summary: issue.fields?.summary ?? '',
      assignee: issue.fields?.assignee?.displayName ?? '未分配',
      updatedAt: issue.fields?.updated ?? '',
      status: issue.fields?.status?.name ?? '',
    }))
  } catch (err) {
    console.error(`[定时推送] 查询出错:`, err.message)
    return []
  }
}

async function sendDailyStaleAlert() {
  const webhookUrl = process.env.DAILY_PUSH_WEBHOOK_URL || process.env.WECOM_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('[定时推送] DAILY_PUSH_WEBHOOK_URL 和 WECOM_WEBHOOK_URL 都未配置，跳过')
    return
  }

  // 汇总所有项目的停滞 ticket
  const allStaleByProject = []
  let totalCount = 0

  for (const projectKey of DAILY_PUSH_PROJECTS) {
    const staleIssues = await fetchStaleIssuesForProject(projectKey)
    if (staleIssues.length > 0) {
      allStaleByProject.push({ projectKey, issues: staleIssues })
      totalCount += staleIssues.length
    }
  }

  if (totalCount === 0) {
    console.log(`[定时推送] 所有项目无超期未更新任务`)
    return
  }

  // 构建汇总消息
  const now = new Date()
  const lines = [
    `## 🚨 AI-PM · 每日停滞预警`,
    '',
    `> ${now.toLocaleDateString('zh-CN')} 09:00 定时巡检 · 共 **${totalCount}** 个任务超过2天无更新`,
    '',
  ]

  for (const { projectKey, issues } of allStaleByProject) {
    lines.push(`### 📌 ${projectKey}（${issues.length} 个）`)
    lines.push('')
    for (const issue of issues.slice(0, 10)) {
      const daysSinceUpdate = Math.floor((Date.now() - new Date(issue.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      lines.push(`> 🔴 **${issue.key}** ${issue.summary}`)
      lines.push(`> 负责人: ${issue.assignee} · ${daysSinceUpdate}天未更新 · ${issue.status}`)
      lines.push('')
    }
    if (issues.length > 10) {
      lines.push(`> ... 还有 ${issues.length - 10} 个未列出`)
      lines.push('')
    }
  }

  lines.push('---')
  lines.push('> 请相关负责人及时更新任务状态或评论说明进展')

  const message = { msgtype: 'markdown', markdown: { content: lines.join('\n') } }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
    const result = await res.json()
    if (result.errcode === 0) {
      console.log(`[定时推送] 成功推送汇总预警，共 ${totalCount} 条`)
    } else {
      console.error(`[定时推送] 企微推送失败`, result.errmsg)
    }
  } catch (err) {
    console.error(`[定时推送] 发送失败`, err.message)
  }
}

// 每小时检查一次，到设定的小时则执行推送（防止服务器重启错过）
let lastPushDate = ''
setInterval(() => {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const hour = now.getHours()

  if (hour === DAILY_PUSH_HOUR && lastPushDate !== todayStr) {
    lastPushDate = todayStr
    console.log(`[定时推送] ${todayStr} ${hour}:00 触发每日推送...`)
    sendDailyStaleAlert()
  }
}, 60 * 1000) // 每分钟检查一次

// ============================================================
// 启动
// ============================================================
function getLocalIPs() {
  const nets = os.networkInterfaces()
  const ips = []
  for (const iface of Object.values(nets)) {
    for (const addr of iface ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) ips.push(addr.address)
    }
  }
  return ips
}

app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs()
  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║     🤖 AI-PM Platform 已启动              ║')
  console.log('╚══════════════════════════════════════════╝\n')
  console.log(`  本机访问:  http://localhost:${PORT}`)
  ips.forEach(ip => console.log(`  内网访问:  http://${ip}:${PORT}  ← 分享给团队`))
  console.log('')
  console.log('  配置状态:')
  console.log(`  Jira:    ${process.env.JIRA_BASE_URL ?? '❌ 未配置'}`)
  console.log(`  用户名:  ${process.env.JIRA_USERNAME ?? '❌ 未配置'}`)
  console.log(`  企微:    ${process.env.WECOM_WEBHOOK_URL ? '✅ 已配置' : '❌ 未配置'}`)
  console.log('\n  按 Ctrl+C 停止服务\n')
})
