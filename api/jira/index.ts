import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Jira Server API 代理（单入口）
 * 将 /api/jira?path=rest/api/2/project 转发至 Jira Server
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  const { JIRA_BASE_URL, JIRA_USERNAME, JIRA_PASSWORD, JIRA_PAT } = process.env
  if (!JIRA_BASE_URL) return res.status(500).json({ error: 'JIRA_BASE_URL not configured' })
  if (!JIRA_USERNAME && !JIRA_PAT) return res.status(500).json({ error: 'Jira auth not configured' })

  const authHeader = JIRA_USERNAME
    ? `Basic ${Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD ?? ''}`).toString('base64')}`
    : `Bearer ${JIRA_PAT}`

  // 从 URL 中提取 /api/jira/ 后面的路径
  const fullUrl = req.url ?? ''
  const jiraPath = fullUrl.replace(/^\/api\/jira\/?/, '').split('?')[0]
  
  // 保留原始查询参数（排除内部参数）
  const url = new URL(fullUrl, `https://${req.headers.host}`)
  const queryString = url.search || ''

  const targetUrl = `${JIRA_BASE_URL.replace(/\/$/, '')}/${jiraPath}${queryString}`

  try {
    // Disable SSL verification for self-signed certs
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
    if (['POST', 'PUT', 'PATCH'].includes(req.method ?? '') && req.body) {
      fetchOptions.body = JSON.stringify(req.body)
    }

    const jiraRes = await fetch(targetUrl, fetchOptions)
    if (!jiraRes.ok) {
      let body: unknown
      try { body = await jiraRes.json() } catch { body = { error: `HTTP ${jiraRes.status}` } }
      return res.status(jiraRes.status).json(body)
    }
    const data = await jiraRes.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Jira', detail: err instanceof Error ? err.message : 'Unknown' })
  }
}
