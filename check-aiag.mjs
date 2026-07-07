import 'dotenv/config'

const { JIRA_BASE_URL, JIRA_USERNAME, JIRA_PASSWORD } = process.env
const authHeader = `Basic ${Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD}`).toString('base64')}`

async function jiraFetch(path) {
  const url = `${JIRA_BASE_URL}/rest/api/2/${path}`
  const res = await fetch(url, { headers: { Authorization: authHeader, 'Content-Type': 'application/json' } })
  if (!res.ok) { console.log('HTTP', res.status); return null }
  return res.json()
}

async function main() {
  // Try different JQL approaches
  const queries = [
    ['resolved filter', `project = AIAG AND status in (Done, Closed, Released) AND resolved >= "2026-04-10" AND resolved <= "2026-06-04"`],
    ['status changed', `project = AIAG AND status changed to (Done, Closed, Released) during ("2026-04-10", "2026-06-04")`],
    ['status changed Closed only', `project = AIAG AND status changed to Closed during ("2026-04-10", "2026-06-04")`],
    ['updated filter', `project = AIAG AND status in (Done, Closed, Released) AND updated >= "2026-04-10" AND updated <= "2026-06-04"`],
    ['statusCategory = Done + updated', `project = AIAG AND statusCategory = Done AND updated >= "2026-04-10" AND updated <= "2026-06-04"`],
    ['all closed ever', `project = AIAG AND status in (Done, Closed, Released)`],
  ]

  for (const [label, jql] of queries) {
    const data = await jiraFetch(`search?jql=${encodeURIComponent(jql)}&maxResults=3&fields=summary,status,resolutiondate,updated`)
    console.log(`${label}: ${data?.total || 0}`)
    if (data?.issues?.length) {
      data.issues.slice(0, 2).forEach(i => console.log(`  ${i.key} | status=${i.fields.status?.name} | resolved=${i.fields.resolutiondate} | updated=${i.fields.updated?.substring(0,10)}`))
    }
    console.log('')
  }
}

main()
