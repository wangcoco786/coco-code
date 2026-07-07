/**
 * PMO 年终报告 — 2026.01.01 至今所有 Ticket 统计
 * 按部门聚合，统计完成/进行中/待办，参与开发人数，以及主要完成事项
 */

import https from 'https'
import http from 'http'

const JIRA_BASE = 'https://jira.logisticsteam.com'
const USERNAME = 'suili.wang@item.com'
const PASSWORD = '123456'
const AUTH = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')

// 部门分组
const DEPARTMENTS = [
  { name: 'IDC', projects: ['RP', 'TRF', 'APS'] },
  { name: 'EAG', projects: ['BP', 'CRMC', 'VRM', 'OW', 'RE'] },
  { name: 'DTS', projects: ['DTS'] },
  { name: 'AIAG', projects: ['AIAG'] },
  { name: 'BI', projects: ['BI'] },
  { name: 'CRM', projects: ['CRM'] },
  { name: 'CSR', projects: ['CSR'] },
  { name: 'FMS', projects: ['FMS'] },
  { name: 'HRM', projects: ['HRM'] },
  { name: 'AIH', projects: ['AIH'] },
  { name: 'PLATFORM', projects: ['PLATFORM'] },
  { name: 'RMS', projects: ['RMS'] },
  { name: 'SAIL', projects: ['SAIL'] },
  { name: 'TMS', projects: ['TMS'] },
  { name: 'WCS', projects: ['WCS'] },
  { name: 'WISE2018', projects: ['WISE2018'] },
  { name: 'CYC', projects: ['CYC'] },
]

function jiraFetch(path) {
  const url = new URL(path, JIRA_BASE)
  const mod = url.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const req = mod.get(url.toString(), {
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false,
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`))
        } else {
          try { resolve(JSON.parse(data)) }
          catch { reject(new Error('JSON parse error')) }
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

async function fetchAllIssues(projectKeys) {
  const allIssues = []
  const projectClause = projectKeys.length === 1
    ? `project = ${projectKeys[0]}`
    : `project IN (${projectKeys.join(', ')})`

  // 2026-01-01 至今创建的所有 ticket
  const jql = `${projectClause} AND created >= "2026/01/01" ORDER BY created DESC`
  let startAt = 0
  const pageSize = 200

  while (true) {
    const url = `/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary,status,assignee,priority,created,updated,resolutiondate,issuetype&maxResults=${pageSize}&startAt=${startAt}`
    try {
      const data = await jiraFetch(url)
      const issues = data.issues ?? []
      allIssues.push(...issues)
      if (issues.length < pageSize || allIssues.length >= data.total) break
      startAt += pageSize
    } catch (err) {
      console.error(`    ⚠️ 查询 ${projectKeys.join(',')} startAt=${startAt} 失败: ${err.message}`)
      break
    }
  }

  return allIssues
}

function categorizeStatus(statusName) {
  const s = (statusName ?? '').toLowerCase()
  if (['done', 'closed', 'resolved', 'released'].includes(s)) return 'done'
  if (['in progress', 'in development', 'in dev'].includes(s)) return 'inProgress'
  if (['in review', 'code review', 'review'].includes(s)) return 'inReview'
  if (['in testing', 'qa', 'testing', 'uat'].includes(s)) return 'inTesting'
  return 'todo'
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗')
  console.log('║       PMO 年终报告 — 2026.01.01 至今 Ticket 统计（按部门）       ║')
  console.log('╚══════════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`统计时间: ${new Date().toLocaleString('zh-CN')}`)
  console.log(`数据范围: 2026-01-01 ~ 今`)
  console.log('')

  const deptResults = []

  for (const dept of DEPARTMENTS) {
    process.stdout.write(`  查询 ${dept.name} (${dept.projects.join(', ')})...`)
    const issues = await fetchAllIssues(dept.projects)

    if (issues.length === 0) {
      console.log(' (无数据)')
      deptResults.push({ ...dept, total: 0, done: 0, inProgress: 0, inReview: 0, inTesting: 0, todo: 0, devs: new Set(), completedSummaries: [] })
      continue
    }

    let done = 0, inProgress = 0, inReview = 0, inTesting = 0, todo = 0
    const devs = new Set()
    const completedSummaries = []

    for (const issue of issues) {
      const status = categorizeStatus(issue.fields?.status?.name)
      const assignee = issue.fields?.assignee?.displayName ?? issue.fields?.assignee?.name
      if (assignee && assignee !== '+closed_folder') devs.add(assignee)

      switch (status) {
        case 'done': done++; completedSummaries.push(issue.fields?.summary ?? ''); break
        case 'inProgress': inProgress++; break
        case 'inReview': inReview++; break
        case 'inTesting': inTesting++; break
        default: todo++; break
      }
    }

    console.log(` ✅ ${issues.length} tickets`)
    deptResults.push({
      ...dept,
      total: issues.length,
      done, inProgress, inReview, inTesting, todo,
      devs,
      completedSummaries,
    })
  }

  // 过滤有数据的
  const active = deptResults.filter(d => d.total > 0)

  console.log('')
  console.log('═'.repeat(95))
  console.log('')
  console.log('【一、各部门 Ticket 统计】')
  console.log('')
  console.log('┌──────────┬───────┬───────┬──────┬──────┬──────┬──────┬────────┬──────┐')
  console.log('│ 部门     │ 总数  │ 完成  │ 进行 │ 评审 │ 测试 │ 待办 │ 完成率 │ 人数 │')
  console.log('├──────────┼───────┼───────┼──────┼──────┼──────┼──────┼────────┼──────┤')

  let grandTotal = 0, grandDone = 0, grandInProgress = 0
  const allDevs = new Set()

  for (const d of active) {
    grandTotal += d.total
    grandDone += d.done
    grandInProgress += d.inProgress
    for (const dev of d.devs) allDevs.add(dev)

    const name = d.name.padEnd(8)
    const total = String(d.total).padStart(5)
    const done = String(d.done).padStart(5)
    const prog = String(d.inProgress).padStart(4)
    const review = String(d.inReview).padStart(4)
    const test = String(d.inTesting).padStart(4)
    const td = String(d.todo).padStart(4)
    const rate = `${d.total > 0 ? Math.round((d.done / d.total) * 100) : 0}%`.padStart(6)
    const devCount = String(d.devs.size).padStart(4)

    console.log(`│ ${name} │ ${total} │ ${done} │ ${prog} │ ${review} │ ${test} │ ${td} │ ${rate} │ ${devCount} │`)
  }

  const grandRate = grandTotal > 0 ? Math.round((grandDone / grandTotal) * 100) : 0
  console.log('├──────────┼───────┼───────┼──────┼──────┼──────┼──────┼────────┼──────┤')
  console.log(`│ 合计     │ ${String(grandTotal).padStart(5)} │ ${String(grandDone).padStart(5)} │ ${String(grandInProgress).padStart(4)} │    - │    - │    - │ ${(grandRate + '%').padStart(6)} │ ${String(allDevs.size).padStart(4)} │`)
  console.log('└──────────┴───────┴───────┴──────┴──────┴──────┴──────┴────────┴──────┘')

  console.log('')
  console.log('【二、各部门主要完成事项（Top 关键词）】')
  console.log('')

  for (const d of active) {
    if (d.done === 0) continue
    // 从已完成 ticket summary 提取高频关键词
    const keywords = extractTopKeywords(d.completedSummaries, 8)
    console.log(`  ${d.name} (完成 ${d.done} 项):`)
    console.log(`    关键词: ${keywords.join('、')}`)
    // 取前 5 个有代表性的 summary
    const samples = d.completedSummaries
      .filter(s => s.length > 5 && s.length < 80)
      .slice(0, 5)
    for (const s of samples) {
      console.log(`    · ${s}`)
    }
    console.log('')
  }

  console.log('')
  console.log('【三、资源投入汇总】')
  console.log('')
  console.log(`  总参与人数（去重）: ${allDevs.size} 人`)
  console.log(`  总 Ticket 数: ${grandTotal}`)
  console.log(`  已完成: ${grandDone} (${grandRate}%)`)
  console.log(`  进行中/评审/测试: ${grandInProgress + active.reduce((s, d) => s + d.inReview + d.inTesting, 0)}`)
  console.log('')

  // 各部门人数排行
  console.log('  各部门研发人数:')
  const sorted = [...active].sort((a, b) => b.devs.size - a.devs.size)
  for (const d of sorted) {
    if (d.devs.size === 0) continue
    console.log(`    ${d.name}: ${d.devs.size} 人`)
  }
  console.log('')
}

/** 从 summary 列表中提取高频关键词 */
function extractTopKeywords(summaries, topN = 8) {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'and', 'or', 'not',
    'as', 'it', 'that', 'this', 'but', 'if', 'do', 'does', 'did', 'will', 'would',
    'can', 'could', 'should', 'has', 'have', 'had', 'may', 'might',
    '的', '了', '和', '是', '在', '有', '不', '与', '及', '等', '中', '个', '为',
    '问题', '功能', '需求', '优化', '修复', '新增', '调整', '更新', '支持',
    'bug', 'fix', 'add', 'update', 'feature', 'issue', 'task'])

  const freq = new Map()
  for (const s of summaries) {
    // 中文分词（简单按2-4字切分）+ 英文按空格
    const words = s.split(/[\s\-_/,.;:!?()[\]{}'"#@&|~`=+<>]+/)
      .map(w => w.toLowerCase().replace(/[【】「」『』（）《》]+/g, ''))
      .filter(w => w.length >= 2 && !stopWords.has(w) && !/^\d+$/.test(w))

    for (const w of words) {
      freq.set(w, (freq.get(w) ?? 0) + 1)
    }
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word)
}

main().catch(console.error)
