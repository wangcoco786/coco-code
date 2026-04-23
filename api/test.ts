import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL || ''
  const JIRA_USERNAME = process.env.JIRA_USERNAME || ''
  const JIRA_PASSWORD = process.env.JIRA_PASSWORD || ''

  const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD}`).toString('base64')
  const target = `${JIRA_BASE_URL}/rest/api/2/serverInfo`

  try {
    const resp = await fetch(target, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    })
    const text = await resp.text()
    return res.status(200).json({ status: resp.status, target, body: text.slice(0, 500) })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    const stack = e instanceof Error ? e.stack?.slice(0, 500) : ''
    return res.status(200).json({ error: msg, stack, target })
  }
}
