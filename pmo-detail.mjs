/**
 * 提取各部门已完成 ticket 的详细功能分类
 */
import https from 'https'
const JIRA_BASE = 'https://jira.logisticsteam.com'
const AUTH = Buffer.from('suili.wang@item.com:123456').toString('base64')

const DEPTS = [
  { name: 'DTS', keys: ['DTS'] },
  { name: 'IDC', keys: ['RP', 'TRF', 'APS'] },
  { name: 'EAG', keys: ['BP', 'CRMC', 'VRM', 'OW', 'RE'] },
  { name: 'Platform', keys: ['PLATFORM'] },
  { name: 'AI Agent', keys: ['AIAG'] },
  { name: 'BI', keys: ['BI'] },
  { name: 'SAIL', keys: ['SAIL'] },
  { name: 'RMS', keys: ['RMS'] },
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
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

async function main() {
  for (const dept of DEPTS) {
    const pk = dept.keys.length === 1 ? `project = ${dept.keys[0]}` : `project IN (${dept.keys.join(', ')})`
    const jql = `${pk} AND created >= "2026/01/01" AND status in (Done, Closed, Resolved, Released) ORDER BY created DESC`
    const url = `/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary&maxResults=100&startAt=0`
    try {
      const data = await jiraFetch(url)
      const titles = (data.issues ?? []).map(i => i.fields?.summary ?? '').filter(s => s.length > 3)
      console.log(`\n=== ${dept.name} (${data.total} completed) ===`)
      // 打印前30个有代表性的
      for (const t of titles.slice(0, 30)) {
        console.log(`  - ${t}`)
      }
    } catch (e) {
      console.log(`\n=== ${dept.name} ERROR: ${e.message} ===`)
    }
  }
}
main()
