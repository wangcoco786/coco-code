import https from 'https'
import fs from 'fs'

const JIRA_BASE = 'https://jira.logisticsteam.com'
const AUTH = Buffer.from('suili.wang@item.com:123456').toString('base64')

const DEPTS = [
  { name: 'DTS', keys: ['DTS', 'CRM'] },
  { name: 'AIAG', keys: ['AIAG'] },
  { name: 'BI', keys: ['BI'] },
  { name: 'EAG', keys: ['BP', 'CRMC', 'VRM', 'OW', 'RE'] },
  { name: 'IDC', keys: ['RP', 'TRF', 'APS'] },
]

const START_DATE = '2026-06-04'
const LOG_FILE = './export-log.txt'

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  fs.appendFileSync(LOG_FILE, line)
}

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
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`))
        else { try { resolve(JSON.parse(data)) } catch { reject(new Error('JSON parse error')) } }
      })
    })
    req.on('error', reject)
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

async function fetchAllIssues(jql) {
  const issues = []
  let startAt = 0
  const maxResults = 100

  while (true) {
    const url = `/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=key,summary&maxResults=${maxResults}&startAt=${startAt}`
    const data = await jiraFetch(url)
    if (data.issues && data.issues.length > 0) {
      issues.push(...data.issues)
    }
    log(`  fetched ${issues.length} / ${data.total}`)
    if (issues.length >= data.total || !data.issues || data.issues.length === 0) break
    startAt += maxResults
  }
  return issues
}

async function main() {
  // 清空日志
  fs.writeFileSync(LOG_FILE, '')
  log('开始导出...')

  const allRows = []

  for (const dept of DEPTS) {
    const pk = dept.keys.length === 1
      ? `project = ${dept.keys[0]}`
      : `project IN (${dept.keys.join(', ')})`

    const jql = `${pk} AND status IN (Done, Closed, Resolved) AND resolved >= "${START_DATE}"`
    log(`查询 ${dept.name}: ${jql}`)

    try {
      const issues = await fetchAllIssues(jql)
      log(`${dept.name}: ${issues.length} 条`)
      for (const issue of issues) {
        allRows.push({
          department: dept.name,
          key: issue.key,
          summary: issue.fields.summary || '',
        })
      }
    } catch (err) {
      log(`${dept.name} 失败: ${err.message}`)
    }
  }

  // 统计各部门数量
  const deptCounts = {}
  for (const r of allRows) {
    deptCounts[r.department] = (deptCounts[r.department] || 0) + 1
  }

  log(`数据拉取完成，共 ${allRows.length} 条，开始生成 Word...`)

  // 生成 docx
  try {
    const docx = await import('docx')
    const { Document, Packer, Paragraph, Table, TableRow, TableCell,
      WidthType, TextRun, HeadingLevel, AlignmentType, VerticalAlign } = docx

    function createCell(text, opts = {}) {
      return new TableCell({
        width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: String(text), bold: opts.bold || false, size: opts.size || 20 }),
            ],
            alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
          }),
        ],
      })
    }

    // 汇总表
    const summaryHeaderRow = new TableRow({
      children: [
        createCell('Department', { bold: true, width: 40, center: true }),
        createCell('Completed Tickets', { bold: true, width: 60, center: true }),
      ],
    })
    const summaryRows = DEPTS.map(dept => new TableRow({
      children: [
        createCell(dept.name, { width: 40, center: true }),
        createCell(String(deptCounts[dept.name] || 0), { width: 60, center: true }),
      ],
    }))
    const summaryTotalRow = new TableRow({
      children: [
        createCell('Total', { bold: true, width: 40, center: true }),
        createCell(String(allRows.length), { bold: true, width: 60, center: true }),
      ],
    })
    const summaryTable = new Table({
      rows: [summaryHeaderRow, ...summaryRows, summaryTotalRow],
      width: { size: 50, type: WidthType.PERCENTAGE },
    })

    // 明细表
    const headerRow = new TableRow({
      children: [
        createCell('Department', { bold: true, width: 15, center: true }),
        createCell('Ticket No.', { bold: true, width: 20, center: true }),
        createCell('Summary', { bold: true, width: 65 }),
      ],
    })

    const dataRows = allRows.map(r => new TableRow({
      children: [
        createCell(r.department, { width: 15, center: true }),
        createCell(r.key, { width: 20, center: true }),
        createCell(r.summary, { width: 65 }),
      ],
    }))

    const table = new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    })

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: '已完成 Ticket 导出',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: `部门: DTS, AIAG, BI, EAG, IDC`, size: 22 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `时间范围: ${START_DATE} 至今`, size: 22 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `总计: ${allRows.length} 条`, size: 22 })],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '各部门完成情况汇总',
            heading: HeadingLevel.HEADING_2,
          }),
          summaryTable,
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '明细列表',
            heading: HeadingLevel.HEADING_2,
          }),
          table,
        ],
      }],
    })

    const buffer = await Packer.toBuffer(doc)
    const outPath = './completed-tickets-export.docx'
    fs.writeFileSync(outPath, buffer)
    log(`导出完成！文件: ${outPath}`)
  } catch (err) {
    log(`生成 Word 失败: ${err.stack || err.message}`)
  }
}

main()
