/**
 * AI-PM Platform — 内网一体化服务器
 * 兼容 Express 4 & 5
 */

import 'dotenv/config'
import express from 'express'
import path from 'path'
import os from 'os'
import fs from 'fs'
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

// 预览推送内容（不实际发送）GET /api/daily-push/preview
app.get('/api/daily-push/preview', async (_req, res) => {
  try {
    const result = await buildDailyStaleMessage()
    res.status(200).json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================================================
// 前端静态文件 + SPA fallback
// ============================================================
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    // 所有文件都禁用缓存，确保浏览器总是加载最新版本
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
}))

app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.sendFile(path.join(distPath, 'index.html'))
})

// ============================================================
// 每日定时推送：3天无更新的 ticket 报警推送到企微群
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

  const jql = `project = ${projectKey} AND sprint in openSprints() AND statusCategory != Done AND updated <= -3d ORDER BY updated ASC`
  const url = `${JIRA_BASE_URL.replace(/\/$/, '')}/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary,assignee,updated,status,customfield_11103,customfield_11000&maxResults=100`

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
    return (data.issues ?? []).map(issue => {
      // 优先取 Developer 字段的人，没有则取 assignee
      const dev11000 = issue.fields?.customfield_11000
      const dev11103 = issue.fields?.customfield_11103
      let responsible = null
      // Developer(single)
      if (dev11000 && typeof dev11000 === 'object') {
        const d = Array.isArray(dev11000) ? dev11000[0] : dev11000
        if (d?.displayName) responsible = d.displayName
      }
      // Developer(multi)
      if (!responsible && Array.isArray(dev11103) && dev11103.length > 0 && dev11103[0]?.displayName) {
        responsible = dev11103[0].displayName
      }
      // fallback to assignee
      if (!responsible) {
        responsible = issue.fields?.assignee?.displayName ?? '未分配'
      }
      return {
        key: issue.key,
        summary: issue.fields?.summary ?? '',
        assignee: responsible,
        updatedAt: issue.fields?.updated ?? '',
        status: issue.fields?.status?.name ?? '',
      }
    })
  } catch (err) {
    console.error(`[定时推送] 查询出错:`, err.message)
    return []
  }
}

async function buildDailyStaleMessage() {
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

  // 筛选超过10天未更新的 tickets，按负责人分组
  const allIssues = []
  for (const { projectKey, issues } of allStaleByProject) {
    for (const issue of issues) {
      const daysSinceUpdate = Math.floor((Date.now() - new Date(issue.updatedAt).getTime()) / 86400000)
      if (daysSinceUpdate >= 10) {
        allIssues.push({ key: issue.key, summary: issue.summary, responsible: issue.assignee, status: issue.status, days: daysSinceUpdate, project: projectKey })
      }
    }
  }

  if (allIssues.length === 0) {
    return { totalCount: 0, message: null, text: '所有项目无超过10天未更新的任务' }
  }

  // 按负责人分组，ticket数量倒序
  const grouped = {}
  for (const t of allIssues) {
    if (!grouped[t.responsible]) grouped[t.responsible] = []
    grouped[t.responsible].push(t)
  }
  const sortedGroups = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)

  // 构建企微推送消息（直接按人员分组的报表格式）
  const now = new Date()
  const lines = [
    `## 🚨 AI-PM · 超10天停滞预警`,
    '',
    `> ${now.toLocaleDateString('zh-CN')} 09:00 定时巡检 · 共 **${allIssues.length}** 个任务超过10天无更新 · 涉及 **${sortedGroups.length}** 人`,
    '',
  ]

  for (const [name, tickets] of sortedGroups) {
    const sorted = tickets.sort((a, b) => b.days - a.days)
    lines.push(`### � ${name}（${tickets.length} 个）`)
    lines.push('')
    for (const t of sorted) {
      lines.push(`> 🔴 **${t.key}** ${t.summary}`)
      lines.push(`> ${t.days}天未更新 · ${t.status} · ${t.project}`)
      lines.push('')
    }
  }

  lines.push('---')
  lines.push('> 📊 [完整报表（可打印）](https://ai-pm-platform.item.pub/stale-report.html)')

  // 生成 HTML 报表文件
  try {
    generateStaleReportHtml(allStaleByProject)
  } catch (e) {
    console.error('[定时推送] 生成报表失败:', e.message)
  }

  const message = { msgtype: 'markdown', markdown: { content: lines.join('\n') } }
  return { totalCount: allIssues.length, message, text: lines.join('\n') }
}

/**
 * 生成停滞预警 HTML 报表（按负责人分组，ticket数量倒序）
 */
function generateStaleReportHtml(allStaleByProject) {
  const allIssues = []
  for (const { projectKey, issues } of allStaleByProject) {
    for (const issue of issues) {
      const days = Math.floor((Date.now() - new Date(issue.updatedAt).getTime()) / 86400000)
      allIssues.push({ key: issue.key, summary: issue.summary, responsible: issue.assignee, status: issue.status, days, project: projectKey })
    }
  }

  const grouped = {}
  for (const t of allIssues) {
    if (!grouped[t.responsible]) grouped[t.responsible] = []
    grouped[t.responsible].push(t)
  }
  const sortedGroups = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)

  const date = new Date().toLocaleDateString('zh-CN')
  const over10 = allIssues.filter(t => t.days >= 10).length

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>IDC 停滞预警报表 ${date}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;padding:40px;background:#f5f5f5}
.container{max-width:1100px;margin:0 auto;background:#fff;border-radius:8px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
h1{font-size:22px;margin-bottom:4px}.subtitle{color:#666;font-size:14px;margin-bottom:24px}
.summary{display:flex;gap:20px;margin-bottom:30px}.stat{background:#f8f9fa;border-radius:8px;padding:16px 24px;flex:1;text-align:center}
.stat-value{font-size:28px;font-weight:700;color:#1677ff}.stat-value.danger{color:#f5222d}.stat-label{font-size:12px;color:#999;margin-top:4px}
h2{font-size:16px;margin:24px 0 12px;padding:8px 12px;background:#f0f7ff;border-radius:4px}h2 .count{color:#1677ff;font-weight:700}
table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}
th{background:#fafafa;padding:8px 10px;text-align:left;font-weight:600;border-bottom:2px solid #eee}
td{padding:8px 10px;border-bottom:1px solid #f0f0f0}tr:hover td{background:#f9f9f9}
.days{font-weight:700}.days.high{color:#f5222d}.days.mid{color:#fa8c16}.days.low{color:#52c41a}
.ticket-key{color:#1677ff;font-weight:600;white-space:nowrap}
a{color:#1677ff;text-decoration:none}a:hover{text-decoration:underline}
.footer{margin-top:30px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center}
@media print{body{padding:10px;background:#fff}.container{box-shadow:none;padding:20px}}</style></head>
<body><div class="container">
<h1>🚨 IDC 项目停滞预警报表</h1>
<p class="subtitle">生成时间：${date} | 项目：${DAILY_PUSH_PROJECTS.join(' / ')} | 条件：Sprint 内超过3天未更新</p>
<div class="summary">
<div class="stat"><div class="stat-value">${allIssues.length}</div><div class="stat-label">总停滞 Tickets</div></div>
<div class="stat"><div class="stat-value danger">${over10}</div><div class="stat-label">超10天（高风险）</div></div>
<div class="stat"><div class="stat-value">${sortedGroups.length}</div><div class="stat-label">涉及人员</div></div>
</div>`

  for (const [name, tickets] of sortedGroups) {
    const sorted = tickets.sort((a, b) => b.days - a.days)
    html += `<h2>👤 ${name} <span class="count">— ${tickets.length} 个</span></h2>
<table><tr><th>Ticket</th><th>项目</th><th>天数</th><th>状态</th><th>标题</th></tr>`
    for (const t of sorted) {
      const cls = t.days >= 10 ? 'high' : t.days >= 7 ? 'mid' : 'low'
      const s = t.summary.length > 60 ? t.summary.substring(0, 60) + '...' : t.summary
      const jiraUrl = `${process.env.JIRA_BASE_URL || 'https://jira.logisticsteam.com'}/browse/${t.key}`
      html += `<tr><td class="ticket-key"><a href="${jiraUrl}" target="_blank">${t.key}</a></td><td>${t.project}</td><td class="days ${cls}">${t.days}天</td><td>${t.status}</td><td>${s}</td></tr>`
    }
    html += `</table>`
  }

  html += `<div class="footer">AI-PM Platform · 自动生成 · ${date}</div></div></body></html>`

  const reportPath = path.join(__dirname, 'dist', 'stale-report.html')
  fs.writeFileSync(reportPath, html, 'utf-8')
  console.log(`[定时推送] 报表已生成: ${reportPath}`)
}

async function sendDailyStaleAlert() {
  const webhookUrl = process.env.DAILY_PUSH_WEBHOOK_URL || 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=4ddf5570-ab55-4024-868c-f954082ccc1f'

  const { totalCount, message } = await buildDailyStaleMessage()
  if (totalCount === 0 || !message) {
    console.log(`[定时推送] 所有项目无超期未更新任务`)
    return
  }

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

// 每分钟检查一次，工作日到设定的小时则执行推送（北京时间）
let lastPushDate = ''
setInterval(() => {
  // 使用北京时间 (UTC+8)
  const now = new Date()
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const todayStr = beijingTime.toISOString().slice(0, 10)
  const hour = beijingTime.getUTCHours()
  const dayOfWeek = beijingTime.getUTCDay() // 0=周日, 6=周六

  // 只在工作日（周一到周五）推送
  if (dayOfWeek === 0 || dayOfWeek === 6) return

  if (hour === DAILY_PUSH_HOUR && lastPushDate !== todayStr) {
    lastPushDate = todayStr
    console.log(`[定时推送] 北京时间 ${todayStr} ${hour}:00 触发每日推送...`)
    sendDailyStaleAlert()
  }
}, 60 * 1000) // 每分钟检查一次

// ============================================================
// Ach rate 变更监控：定时轮询 APS/RP/TRF，发现变化推送到企微群
// ============================================================
const ACH_RATE_PROJECTS = ['APS', 'RP', 'TRF']
const ACH_RATE_FIELD = 'customfield_12616'
const ACH_RATE_WEBHOOK = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=f6bc8773-f9be-42e0-85ca-a8224398b70f'
const ACH_RATE_POLL_INTERVAL = 5 * 60 * 1000 // 5分钟

// 存储上次记录的 ach rate 值：{ "RP-123": "80%" }
const achRateCache = new Map()

async function fetchAchRatesForProject(projectKey) {
  const { JIRA_BASE_URL, JIRA_USERNAME, JIRA_PASSWORD, JIRA_PAT } = process.env
  if (!JIRA_BASE_URL || (!JIRA_USERNAME && !JIRA_PAT)) return []

  const authHeader = JIRA_USERNAME
    ? `Basic ${Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD ?? ''}`).toString('base64')}`
    : `Bearer ${JIRA_PAT}`

  const jql = `project = ${projectKey} AND sprint in openSprints() AND cf[12616] is not empty ORDER BY updated DESC`
  const url = `${JIRA_BASE_URL.replace(/\/$/, '')}/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary,assignee,${ACH_RATE_FIELD}&maxResults=200`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json', Accept: 'application/json' },
    })
    if (!res.ok) {
      console.error(`[Ach rate] ${projectKey} Jira查询失败: ${res.status}`)
      return []
    }
    const data = await res.json()
    return (data.issues ?? []).map(issue => ({
      key: issue.key,
      summary: issue.fields?.summary ?? '',
      assignee: issue.fields?.assignee?.displayName ?? '未分配',
      achRate: issue.fields?.[ACH_RATE_FIELD] ?? null,
    }))
  } catch (err) {
    console.error(`[Ach rate] ${projectKey} 查询出错:`, err.message)
    return []
  }
}

async function checkAchRateChanges() {
  const changes = []

  for (const projectKey of ACH_RATE_PROJECTS) {
    const issues = await fetchAchRatesForProject(projectKey)
    for (const issue of issues) {
      if (issue.achRate == null) continue
      const achValue = String(issue.achRate)
      const cacheKey = issue.key
      const prevValue = achRateCache.get(cacheKey)

      if (prevValue !== undefined && prevValue !== achValue) {
        // 值发生了变化
        changes.push({
          key: issue.key,
          summary: issue.summary,
          assignee: issue.assignee,
          projectKey,
          oldValue: prevValue,
          newValue: achValue,
        })
      }
      achRateCache.set(cacheKey, achValue)
    }
  }

  if (changes.length === 0) return

  // 构建推送消息
  const lines = [
    `## 📊 Ach Rate 更新通知`,
    '',
    `> ${new Date(Date.now() + 8 * 3600000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
    '',
  ]

  for (const c of changes) {
    lines.push(`> **${c.key}** ${c.summary}`)
    lines.push(`> 负责人: ${c.assignee} · Ach rate: ${c.oldValue} → **${c.newValue}**`)
    lines.push('')
  }

  const message = { msgtype: 'markdown', markdown: { content: lines.join('\n') } }

  try {
    const res = await fetch(ACH_RATE_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
    const result = await res.json()
    if (result.errcode === 0) {
      console.log(`[Ach rate] 推送 ${changes.length} 条变更通知`)
    } else {
      console.error(`[Ach rate] 推送失败:`, result.errmsg)
    }
  } catch (err) {
    console.error(`[Ach rate] 推送失败:`, err.message)
  }
}

// 启动时先加载一次缓存（不推送），之后每30分钟检查变化
fetchAchRatesForProject('APS').then(issues => issues.forEach(i => i.achRate != null && achRateCache.set(i.key, String(i.achRate))))
fetchAchRatesForProject('RP').then(issues => issues.forEach(i => i.achRate != null && achRateCache.set(i.key, String(i.achRate))))
fetchAchRatesForProject('TRF').then(issues => issues.forEach(i => i.achRate != null && achRateCache.set(i.key, String(i.achRate))))

setTimeout(() => {
  setInterval(checkAchRateChanges, ACH_RATE_POLL_INTERVAL)
  console.log('[Ach rate] 监控已启动，每5分钟检查一次 APS/RP/TRF')
}, 10000) // 启动10秒后开始轮询

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
