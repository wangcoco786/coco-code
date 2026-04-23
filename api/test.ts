import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    env: {
      hasJiraUrl: !!process.env.JIRA_BASE_URL,
      hasUsername: !!process.env.JIRA_USERNAME,
      hasPassword: !!process.env.JIRA_PASSWORD,
      jiraUrl: process.env.JIRA_BASE_URL ?? 'NOT SET',
    },
  })
}
