import https from 'https'
const JIRA_BASE = 'https://jira.logisticsteam.com'
const AUTH = Buffer.from('suili.wang@item.com:123456').toString('base64')
const DEPTS = [
  { name: 'IDC', keys: ['RP', 'TRF', 'APS'] },
  { name: 'EAG', keys: ['BP', 'CRMC', 'VRM', 'OW', 'RE'] },
  { name: 'DTS', keys: ['DTS', 'CRM'] },
  { name: 'Platform', keys: ['PLATFORM'] },
  { name: 'RMS', keys: ['RMS'] },
  { name: 'BI', keys: ['BI'] },
  { name: 'AI Agent', keys: ['AIAG'] },
  { name: 'SAIL', keys: ['SAIL'] },
]

function jiraFetch(path) {
  const url = new URL(path, JIRA_BASE)
  return new Promise((resolve, reject) => {
    const req = https.get(url.toString(), {
      headers: { 'Authorization': `Basic ${AUTH}`, 'Content-Type': 'application/json' },
      rejectUnauthorized: false,
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}`))
        else { try { resolve(JSON.parse(data)) } catch { reject(new Error('parse')) } }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

async function getCount(keys, startDate, endDate) {
  const pk = keys.length === 1 ? `project = ${keys[0]}` : `project IN (${keys.join(', ')})`
  const jql = `${pk} AND created >= "${startDate}" AND created <= "${endDate}"`
  const url = `/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=key&maxResults=0`
  try {
    const data = await jiraFetch(url)
    return data.total ?? 0
  } catch { return 0 }
}

async function main() {
  console.log('部门 | 2025 H1 | 2026 H1 | 增长')
  console.log('---|---|---|---')
  for (const dept of DEPTS) {
    const c2025 = await getCount(dept.keys, '2025/01/01', '2025/06/29')
    const c2026 = await getCount(dept.keys, '2026/01/01', '2026/06/29')
    const growth = c2025 > 0 ? Math.round(((c2026 - c2025) / c2025) * 100) : 'N/A'
    console.log(`${dept.name} | ${c2025} | ${c2026} | ${growth}%`)
  }
}
main()
