/**
 * PMO 年中汇报 — Ticket 统计（限定部门）
 * EAG, IDC, DTS, PLATFORM, RMS, BI, AIAG, SAIL
 */

import https from 'https'

const JIRA_BASE = 'https://jira.logisticsteam.com'
const AUTH = Buffer.from('suili.wang@item.com:123456').toString('base64')

const DEPARTMENTS = [
  { name: 'IDC', projects: ['RP', 'TRF', 'APS'] },
  { name: 'EAG', projects: ['BP', 'CRMC', 'VRM', 'OW', 'RE'] },
  { name: 'DTS', projects: ['DTS'] },
  { name: 'Public Platform', projects: ['PLATFORM'] },
  { name: 'RMS', projects: ['RMS'] },
  { name: 'BI', projects: ['BI'] },
  { name: 'AI Agent', projects: ['AIAG'] },
  { name: 'SAIL', projects: ['SAIL'] },
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
        else { try { resolve(JSON.parse(data)) } catch { reject(new Error('parse error')) } }
      })
    })
    req.on('error', reject)
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

async function fetchAllIssues(projectKeys) {
  const allIssues = []
  const projectClause = projectKeys.length === 1 ? `project = ${projectKeys[0]}` : `project IN (${projectKeys.join(', ')})`
  const jql = `${projectClause} AND created >= "2026/01/01" ORDER BY created DESC`
  let startAt = 0

  while (true) {
    const url = `/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary,status,assignee,priority,created,updated,resolutiondate,issuetype,fixVersions,labels&maxResults=200&startAt=${startAt}`
    try {
      const data = await jiraFetch(url)
      const issues = data.issues ?? []
      allIssues.push(...issues)
      if (issues.length < 200 || allIssues.length >= data.total) break
      startAt += 200
    } catch (err) {
      console.error(`  ⚠️ ${projectKeys.join(',')} error at ${startAt}: ${err.message}`)
      break
    }
  }
  return allIssues
}

function catStatus(name) {
  const s = (name ?? '').toLowerCase()
  if (['done', 'closed', 'resolved', 'released'].includes(s)) return 'done'
  if (['in progress', 'in development', 'in dev'].includes(s)) return 'inProgress'
  if (['in review', 'code review', 'review'].includes(s)) return 'inReview'
  if (['in testing', 'qa', 'testing', 'uat'].includes(s)) return 'inTesting'
  return 'todo'
}

async function main() {
  console.log('# FDE 年中汇报 — Ticket 统计数据')
  console.log(`\n统计日期: ${new Date().toLocaleDateString('zh-CN')}`)
  console.log('数据范围: 2026-01-01 至今\n')

  const results = []

  for (const dept of DEPARTMENTS) {
    process.stdout.write(`  ${dept.name}...`)
    const issues = await fetchAllIssues(dept.projects)
    console.log(` ${issues.length} tickets`)

    let done = 0, inProgress = 0, inReview = 0, inTesting = 0, todo = 0
    const devs = new Set()
    const completedTitles = []

    for (const issue of issues) {
      const cat = catStatus(issue.fields?.status?.name)
      const assignee = issue.fields?.assignee?.displayName ?? issue.fields?.assignee?.name
      if (assignee && !assignee.startsWith('+')) devs.add(assignee)
      if (cat === 'done') { done++; completedTitles.push(issue.fields?.summary ?? '') }
      else if (cat === 'inProgress') inProgress++
      else if (cat === 'inReview') inReview++
      else if (cat === 'inTesting') inTesting++
      else todo++
    }

    results.push({ ...dept, total: issues.length, done, inProgress, inReview, inTesting, todo, devs: Array.from(devs), completedTitles })
  }

  console.log('\n## 各部门 Ticket 汇总\n')
  console.log('| 部门 | 总 Ticket | 已完成 | 进行中 | 评审/测试 | 待办 | 完成率 | 研发人数 |')
  console.log('|------|----------|--------|--------|-----------|------|--------|----------|')

  let gt = 0, gd = 0, gp = 0
  const allDevs = new Set()
  for (const r of results) {
    gt += r.total; gd += r.done; gp += r.inProgress
    for (const d of r.devs) allDevs.add(d)
    const rate = r.total > 0 ? Math.round((r.done / r.total) * 100) + '%' : '-'
    console.log(`| ${r.name} | ${r.total} | ${r.done} | ${r.inProgress} | ${r.inReview + r.inTesting} | ${r.todo} | ${rate} | ${r.devs.length} |`)
  }
  console.log(`| **合计** | **${gt}** | **${gd}** | **${gp}** | - | - | **${Math.round((gd/gt)*100)}%** | **${allDevs.size}** |`)

  console.log('\n## 各部门研发人员\n')
  for (const r of results) {
    if (r.devs.length === 0) continue
    console.log(`### ${r.name} (${r.devs.length}人)`)
    console.log(r.devs.sort().join('、'))
    console.log('')
  }

  console.log('\n## 各部门主要完成事项（样例）\n')
  for (const r of results) {
    if (r.done === 0) continue
    console.log(`### ${r.name} (完成 ${r.done} 项)`)
    const samples = r.completedTitles.filter(s => s.length > 5 && s.length < 100).slice(0, 10)
    for (const s of samples) console.log(`- ${s}`)
    console.log('')
  }
}

main().catch(console.error)
