import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const JIRA_BASE_URL = process.env.JIRA_BASE_URL
  const JIRA_USERNAME = process.env.JIRA_USERNAME
  const JIRA_PASSWORD = process.env.JIRA_PASSWORD

  if (!JIRA_BASE_URL) return res.status(500).json({ error: 'JIRA_BASE_URL not set' })
  if (!JIRA_USERNAME) return res.status(500).json({ error: 'JIRA_USERNAME not set' })

  const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD || ''}`).toString('base64')

  const fullUrl = req.url || ''
  const afterJira = fullUrl.replace(/^\/api\/jira\/?/, '')
  const qIdx = afterJira.indexOf('?')
  const path = qIdx >= 0 ? afterJira.substring(0, qIdx) : afterJira
  const query = qIdx >= 0 ? afterJira.substring(qIdx) : ''
  const target = `${JIRA_BASE_URL}/${path}${query}`

  try {
    const init: RequestInit = {
      method: req.method || 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }
    if (req.method === 'POST' && req.body) {
      init.body = JSON.stringify(req.body)
    }

    const resp = await fetch(target, init)
    const text = await resp.text()

    res.status(resp.status)
    res.setHeader('Content-Type', 'application/json')
    return res.send(text)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return res.status(502).json({ error: msg, target })
  }
}
