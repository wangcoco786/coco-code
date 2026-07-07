import https from 'https'
const JIRA_BASE = 'https://jira.logisticsteam.com'
const AUTH = Buffer.from('suili.wang@item.com:123456').toString('base64')
function jiraFetch(path) {
  const url = new URL(path, JIRA_BASE)
  return new Promise((resolve, reject) => {
    const req = https.get(url.toString(), {
      headers: { 'Authorization': `Basic ${AUTH}`, 'Content-Type': 'application/json' },
      rejectUnauthorized: false,
    }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ if(res.statusCode>=400){console.log('HTTP',res.statusCode,d.slice(0,200));reject(new Error(`${res.statusCode}`))} else try{resolve(JSON.parse(d))}catch{reject(new Error('parse'))} }) })
    req.on('error',reject); req.setTimeout(30000,()=>{req.destroy();reject(new Error('timeout'))})
  })
}
async function main() {
  const fields = 'summary,status,priority,assignee,labels,created,updated,resolutiondate,timeoriginalestimate,timespent,customfield_10016,customfield_10004,customfield_11000,customfield_11103,issuelinks,comment,issuetype'
  const jql = 'project IN (BP, CRMC, VRM, OW, RE) AND sprint = "OW.2026.06/12-06/25" ORDER BY priority ASC, updated DESC'
  const url = `/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=${fields}&expand=changelog&maxResults=200`
  console.log('Testing with expand=changelog...')
  try {
    const data = await jiraFetch(url)
    console.log('OK! Total:', data.total, 'issues')
  } catch(e) { console.log('FAILED:', e.message) }
}
main()
