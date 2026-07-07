import https from 'https'
const JIRA_BASE = 'https://jira.logisticsteam.com'
const AUTH = Buffer.from('suili.wang@item.com:123456').toString('base64')

function jiraFetch(path) {
  const url = new URL(path, JIRA_BASE)
  return new Promise((resolve, reject) => {
    const req = https.get(url.toString(), {
      headers: { 'Authorization': `Basic ${AUTH}`, 'Content-Type': 'application/json' },
      rejectUnauthorized: false,
    }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ if(res.statusCode>=400){console.log('ERROR:',d.slice(0,300));reject(new Error(`${res.statusCode}`))} else try{resolve(JSON.parse(d))}catch{reject(new Error('parse'))} }) })
    req.on('error',reject); req.setTimeout(30000,()=>{req.destroy();reject(new Error('timeout'))})
  })
}

async function main() {
  // Test 1: Query with project IN and sprint name
  const jql1 = 'project IN (BP, CRMC, VRM, OW, RE) AND sprint = "OW.2026.06/12-06/25"'
  console.log('JQL:', jql1)
  const url1 = `/rest/api/2/search?jql=${encodeURIComponent(jql1)}&fields=summary,status&maxResults=10`
  try {
    const data = await jiraFetch(url1)
    console.log('Result:', data.total, 'issues')
    for (const i of (data.issues ?? []).slice(0, 3)) {
      console.log(' -', i.key, i.fields?.summary)
    }
  } catch(e) { console.log('Failed:', e.message) }

  // Test 2: Query with just project OW
  const jql2 = 'project = OW AND sprint = "OW.2026.06/12-06/25"'
  console.log('\nJQL:', jql2)
  const url2 = `/rest/api/2/search?jql=${encodeURIComponent(jql2)}&fields=summary,status&maxResults=10`
  try {
    const data = await jiraFetch(url2)
    console.log('Result:', data.total, 'issues')
    for (const i of (data.issues ?? []).slice(0, 3)) {
      console.log(' -', i.key, i.fields?.summary)
    }
  } catch(e) { console.log('Failed:', e.message) }

  // Test 3: What sprints does OW have?
  const jql3 = 'project = OW AND sprint is not EMPTY'
  console.log('\nJQL:', jql3)
  const url3 = `/rest/api/2/search?jql=${encodeURIComponent(jql3)}&fields=customfield_10005&maxResults=5`
  try {
    const data = await jiraFetch(url3)
    console.log('Total issues with sprint:', data.total)
    // Parse sprint names from first issue
    const raw = data.issues?.[0]?.fields?.customfield_10005
    if (raw) {
      const names = (Array.isArray(raw) ? raw : [raw]).join(' ').match(/name=[^,\]]+/g)
      console.log('Sprint names found:', names?.slice(0, 5))
    }
  } catch(e) { console.log('Failed:', e.message) }
}
main()
