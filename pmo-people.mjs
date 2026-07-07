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
]
function jiraFetch(path) {
  const url = new URL(path, JIRA_BASE)
  return new Promise((resolve, reject) => {
    const req = https.get(url.toString(), {
      headers: { 'Authorization': `Basic ${AUTH}`, 'Content-Type': 'application/json' },
      rejectUnauthorized: false,
    }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ if(res.statusCode>=400)reject(new Error(`${res.statusCode}`)); else try{resolve(JSON.parse(d))}catch{reject(new Error('p'))} }) })
    req.on('error',reject); req.setTimeout(30000,()=>{req.destroy();reject(new Error('timeout'))})
  })
}
async function main() {
  console.log('去年同期(2025.01-06) 各部门参与人数：\n')
  for(const d of DEPTS) {
    const pk = d.keys.length===1?`project = ${d.keys[0]}`:`project IN (${d.keys.join(', ')})`
    const jql = `${pk} AND created >= "2025/01/01" AND created <= "2025/06/29" AND assignee is not EMPTY`
    const url = `/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=assignee&maxResults=500`
    const devs = new Set()
    try {
      const data = await jiraFetch(url)
      for(const i of data.issues??[]) {
        const a = i.fields?.assignee?.displayName ?? i.fields?.assignee?.name
        if(a && !a.startsWith('+')) devs.add(a)
      }
      console.log(`${d.name}: ${devs.size} 人`)
    } catch(e) { console.log(`${d.name}: error ${e.message}`) }
  }
}
main()
