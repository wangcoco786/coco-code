/**
 * AI-PM Platform — 内网一体化服务器
 * 兼容 Express 4 & 5
 */

import 'dotenv/config'
import express from 'express'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '10mb' }))

// ============================================================
// Jira API 代理  /api/jira/...
// ============================================================
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
// 前端静态文件 + SPA fallback
// ============================================================
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

app.use((_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

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
