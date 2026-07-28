import 'dotenv/config'

const BASE = process.env.JIRA_BASE_URL?.replace(/\/$/, '')
const auth = process.env.JIRA_USERNAME && process.env.JIRA_PASSWORD
  ? `Basic ${Buffer.from(`${process.env.JIRA_USERNAME}:${process.env.JIRA_PASSWORD}`).toString('base64')}`
  : `Bearer ${process.env.JIRA_PAT}`

async function jira(path) {
  const r = await fetch(`${BASE}/${path}`, { headers: { Authorization: auth, 'Content-Type': 'application/json' } })
  return r.json()
}

const jql = `project IN (RP, TRF, APS) AND sprint in openSprints() AND assignee = "Rainy"`
const data = await jira(`rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary,assignee,customfield_11000,customfield_11103,issuetype,parent&maxResults=10`)

for (const issue of data.issues || []) {
  const f = issue.fields
  const dev = f.customfield_11000?.displayName || f.customfield_11103?.[0]?.displayName || f.customfield_11103?.displayName || 'none'
  console.log(issue.key, '| isSubTask:', f.issuetype?.subtask, '| assignee.key:', f.assignee?.key, '| assignee.name:', f.assignee?.name, '| developer:', dev)
}
