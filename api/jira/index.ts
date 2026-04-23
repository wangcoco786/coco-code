// Must be set before any fetch calls
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { JIRA_BASE_URL, JIRA_USERNAME, JIRA_PASSWORD, JIRA_PAT } = process.env
  if (!JIRA_BASE_URL) return res.status(500).json({ error: 'JIRA_BASE_URL not configured' })
  if (!JIRA_USERNAME && !JIRA_PAT) return res.status(500).json({ error: 'Jira auth not configured' })

  const authHeader = JIRA_USERNAME
    ? `Basic ${Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD ?? ''}`).toString('base64')}`
    : `Bearer ${JIRA_PAT}`

  // Extract Jira path from URL
  const fullUrl = req.url ?? ''
  const afterJira = fullUrl.replace(/^\/api\/jira\/?/, '')
  const [jiraPath, qs] = afterJira.split('?')
  const targetUrl = `${JIRA_BASE_URL.replace(/\/$/, '')}/${jiraPath}${qs ? '?' + qs : ''}`

  try {
    const opts: RequestInit = {
      method: req.method ?? 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
    if (['POST', 'PUT', 'PATCH'].includes(req.method ?? '') && req.body) {
      opts.body = JSON.stringify(req.body)
    }

    const r = await fetch(targetUrl, opts)

    const text = await r.text()
    let data: unknown
    try { data = JSON.parse(text) } catch { data = { raw: text.slice(0, 500) } }

    if (!r.ok) return res.status(r.status).json(data)
    return res.status(200).json(data)
  } catch (err) {
    return res.status(502).json({
      error: 'Failed to reach Jira Server',
      detail: err instanceof Error ? err.message : String(err),
      target: targetUrl,
    })
  }
}
