import 'dotenv/config'

// 模拟 fetch RMS sprint issues 并检查 RMS-2886 的归属
const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.replace(/\/$/, '')
const JIRA_USERNAME = process.env.JIRA_USERNAME
const JIRA_PASSWORD = process.env.JIRA_PASSWORD
const JIRA_PAT = process.env.JIRA_PAT

const authHeader = JIRA_USERNAME && JIRA_PASSWORD
  ? `Basic ${Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD}`).toString('base64')}`
  : `Bearer ${JIRA_PAT}`

async function jiraFetch(path) {
  const url = `${JIRA_BASE_URL}/${path}`
  const resp = await fetch(url, { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } })
  return resp.json()
}

async function main() {
  // 获取 RMS openSprints issues
  const fields = 'summary,status,priority,assignee,reporter,labels,created,updated,project,subtasks,issuelinks,comment,customfield_11102,customfield_11000,customfield_11103'
  const jql = 'project = RMS AND sprint in openSprints() ORDER BY priority ASC, updated DESC'
  const data = await jiraFetch(`rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=200`)
  
  console.log(`Total issues: ${data.total}`)
  
  // 找 RMS-2886
  const rms2886 = data.issues?.find(i => i.key === 'RMS-2886')
  if (!rms2886) {
    console.log('RMS-2886 NOT FOUND in openSprints query!')
    return
  }
  
  const f = rms2886.fields
  console.log('\n=== RMS-2886 ===')
  console.log('assignee:', f.assignee?.displayName, '(key:', f.assignee?.key, ')')
  console.log('customfield_11000:', f.customfield_11000 ? JSON.stringify({name: f.customfield_11000.name || f.customfield_11000.displayName, key: f.customfield_11000.key}) : 'null/undefined')
  console.log('customfield_11103:', f.customfield_11103 ? JSON.stringify(f.customfield_11103.map?.(d => ({name: d.name || d.displayName, key: d.key})) || {name: f.customfield_11103.name, key: f.customfield_11103.key}) : 'null/undefined')
  
  // 模拟 transformToPerformanceIssue 对 developerUser 的解析
  let developerUser = null
  const dev = f.customfield_11000 ?? null
  if (dev && typeof dev === 'object') {
    const devObj = Array.isArray(dev) ? dev[0] : dev
    if (devObj && typeof devObj === 'object') {
      if (devObj.active !== false) {
        developerUser = { id: devObj.accountId || devObj.key || devObj.name || devObj.displayName || 'unknown', name: devObj.displayName ?? '' }
      }
    }
  }
  if (!developerUser) {
    const devMulti = f.customfield_11103 ?? null
    if (devMulti && typeof devMulti === 'object') {
      const devObj = Array.isArray(devMulti) ? devMulti[0] : devMulti
      if (devObj && typeof devObj === 'object') {
        if (devObj.active !== false) {
          developerUser = { id: devObj.accountId || devObj.key || devObj.name || devObj.displayName || 'unknown', name: devObj.displayName ?? '' }
        }
      }
    }
  }
  
  console.log('\nParsed developerUser:', developerUser)
  console.log('Parsed assignee id:', f.assignee?.accountId || f.assignee?.key || f.assignee?.name || 'unknown')
  
  // 按 ownerGroups 逻辑，这个任务应该归谁？
  if (developerUser?.id) {
    console.log('\n→ RMS-2886 owner (by developer): ', developerUser.name, '(id:', developerUser.id, ')')
  } else {
    console.log('\n→ RMS-2886 owner (fallback to assignee):', f.assignee?.displayName)
  }
  
  // 统计 Xiao Fan 的所有任务（如果走 ownerGroups 逻辑）
  console.log('\n\n=== Simulating ownerGroups ===')
  const ownerGroups = {}
  for (const issue of data.issues) {
    const fields = issue.fields
    let ownerId = null
    let ownerName = null
    
    // developerUser 解析
    let devUser = null
    const d1 = fields.customfield_11000 ?? null
    if (d1 && typeof d1 === 'object') {
      const dObj = Array.isArray(d1) ? d1[0] : d1
      if (dObj && typeof dObj === 'object' && dObj.active !== false) {
        devUser = { id: dObj.accountId || dObj.key || dObj.name || dObj.displayName || 'unknown', name: dObj.displayName ?? '' }
      }
    }
    if (!devUser) {
      const d2 = fields.customfield_11103 ?? null
      if (d2 && typeof d2 === 'object') {
        const dObj = Array.isArray(d2) ? d2[0] : d2
        if (dObj && typeof dObj === 'object' && dObj.active !== false) {
          devUser = { id: dObj.accountId || dObj.key || dObj.name || dObj.displayName || 'unknown', name: dObj.displayName ?? '' }
        }
      }
    }
    
    if (devUser?.id) {
      ownerId = devUser.id
      ownerName = devUser.name
    } else if (fields.assignee) {
      ownerId = fields.assignee.accountId || fields.assignee.key || fields.assignee.name || 'unknown'
      ownerName = fields.assignee.displayName
    } else if (fields.reporter) {
      ownerId = fields.reporter.accountId || fields.reporter.key || fields.reporter.name || 'unknown'
      ownerName = fields.reporter.displayName
    }
    
    if (!ownerId) continue
    if (!ownerGroups[ownerId]) ownerGroups[ownerId] = { name: ownerName, tasks: [] }
    ownerGroups[ownerId].tasks.push(issue.key)
  }
  
  // 找 Xiao Fan
  for (const [id, group] of Object.entries(ownerGroups)) {
    if (group.name?.includes('Xiao') || group.name?.includes('Fan') || id === 'fanyangjing') {
      console.log(`\nXiao Fan (id: ${id}):`)
      console.log('  Tasks:', group.tasks.join(', '))
      console.log('  Contains RMS-2886?', group.tasks.includes('RMS-2886'))
    }
  }
  
  // 找 Sam
  for (const [id, group] of Object.entries(ownerGroups)) {
    if (group.name?.includes('Sam') || id === 'samhuang') {
      console.log(`\nSam (id: ${id}):`)
      console.log('  Tasks:', group.tasks.join(', '))
      console.log('  Contains RMS-2886?', group.tasks.includes('RMS-2886'))
    }
  }
}

main().catch(console.error)
