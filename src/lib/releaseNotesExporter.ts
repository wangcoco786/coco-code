import type {
  ReleaseNotesData,
  ExportOptions,
  ClassifiedIssue,
  CategorizedIssues,
  IssueCategory,
} from '@/types/platform'

// ============================================================
// Release Notes Exporter — Markdown/HTML generation and download
// ============================================================

/** Category display names (Chinese) */
const CATEGORY_LABELS: Record<IssueCategory, string> = {
  feature: '🚀 新功能 (Feature)',
  bug_fix: '🐛 Bug 修复 (Bug Fix)',
  hot_fix: '🔥 紧急修复 (Hot Fix)',
  improvement: '⚡ 优化改进 (Improvement)',
  other: '📋 其他 (Other)',
}

/** Category emoji for Markdown headings */
const CATEGORY_EMOJI: Record<IssueCategory, string> = {
  feature: '🚀',
  bug_fix: '🐛',
  hot_fix: '🔥',
  improvement: '⚡',
  other: '📋',
}

// ─── sanitizeFilename ───────────────────────────────────────

/**
 * Sanitize a sprint name for use in filenames.
 * Replaces special characters with hyphens and trims leading/trailing hyphens.
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── generateExportFilename ─────────────────────────────────

/**
 * Generate the export filename based on project key, sprint name, and format.
 * Pattern: release-notes-{projectKey}-{sprintName}.{ext}
 */
export function generateExportFilename(options: ExportOptions): string {
  const ext = options.format === 'markdown' ? 'md' : 'html'
  const sanitizedSprintName = sanitizeFilename(options.sprintName)
  return `release-notes-${options.projectKey}-${sanitizedSprintName}.${ext}`
}

// ─── generateMarkdown ───────────────────────────────────────

/**
 * Generate a Markdown document from ReleaseNotesData.
 * Includes sprint name, date range, completion summary, and categorized issue list.
 */
export function generateMarkdown(data: ReleaseNotesData): string {
  const lines: string[] = []

  // Header
  lines.push(`# Release Notes: ${data.sprintName}`)
  lines.push('')
  lines.push(`**项目:** ${data.projectKey}`)
  lines.push(`**Sprint 周期:** ${data.sprintStartDate} ~ ${data.sprintEndDate}`)
  lines.push(`**生成时间:** ${data.generatedAt}`)
  lines.push('')

  // Completion Summary
  lines.push('## 📊 完成度摘要')
  lines.push('')
  lines.push(`| 指标 | 数值 |`)
  lines.push(`| --- | --- |`)
  lines.push(`| 总 Issue 数 | ${data.summary.totalCount} |`)
  lines.push(`| 已完成 | ${data.summary.completedCount} |`)
  lines.push(`| 完成率 | ${data.summary.completionRate}% |`)
  lines.push(`| Hot Fix 数 | ${data.summary.hotFixCount} |`)
  lines.push(`| 计划内 | ${data.summary.baselineCount} |`)
  lines.push(`| 插队 | ${data.summary.unplannedCount} |`)
  lines.push('')

  if (data.summary.isCompletionWarning) {
    lines.push('> ⚠️ **警告:** 完成率低于 80%，请关注未完成 Issue。')
    lines.push('')
  }

  // Categorized Issues
  lines.push('## 📋 变更详情')
  lines.push('')

  const categories: IssueCategory[] = ['feature', 'bug_fix', 'hot_fix', 'improvement', 'other']

  for (const category of categories) {
    const issues = data.categorizedIssues[category]
    if (issues.length === 0) continue

    lines.push(`### ${CATEGORY_LABELS[category]} (${issues.length})`)
    lines.push('')
    lines.push(...formatIssueListMarkdown(issues))
    lines.push('')
  }

  // Stale Issues Warning
  if (data.staleIssues.length > 0) {
    lines.push('## ⚠️ 状态待更新')
    lines.push('')
    lines.push(`以下 ${data.staleIssues.length} 个 Issue 状态可能未及时更新：`)
    lines.push('')
    for (const issue of data.staleIssues) {
      lines.push(`- **${issue.id}** ${issue.title} — 当前状态: ${formatStatus(issue.status)}`)
    }
    lines.push('')
  }

  // Footer
  lines.push('---')
  lines.push(`*Generated at ${data.generatedAt}*`)
  lines.push('')

  return lines.join('\n')
}

// ─── generateHTML ───────────────────────────────────────────

/**
 * Generate a styled HTML document from ReleaseNotesData.
 * Follows the visual style of release-note-v1.1.0.html.
 */
export function generateHTML(data: ReleaseNotesData): string {
  const categorySections = generateCategorySectionsHTML(data.categorizedIssues)
  const staleSectionHTML = generateStaleSectionHTML(data.staleIssues)

  return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Release Notes - ${escapeHTML(data.sprintName)}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #f0f2f5; font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif; padding: 40px 20px; }
.page { max-width: 900px; margin: 0 auto; }

.header {
  text-align: center;
  padding: 40px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: #fff;
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;
}
.header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 300px;
  height: 300px;
  background: rgba(255,255,255,0.08);
  border-radius: 50%;
}
.header h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
.header .project { font-size: 18px; opacity: 0.9; margin-bottom: 4px; }
.header .date { font-size: 14px; opacity: 0.7; }

.section {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-title .emoji { font-size: 28px; }

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.summary-card {
  text-align: center;
  padding: 16px;
  background: #fafafe;
  border-radius: 12px;
  border: 1.5px solid #e8e8f0;
}
.summary-card .value { font-size: 28px; font-weight: 800; color: #1a1a2e; }
.summary-card .label { font-size: 12px; color: #666; margin-top: 4px; }
.summary-card.warning .value { color: #faad14; }
.summary-card.success .value { color: #52c41a; }
.summary-card.hotfix .value { color: #ff4d4f; }

.summary-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.summary-tag {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 8px;
  background: #f5f5f5;
  color: #333;
}
.summary-tag.warning {
  background: #fff7e6;
  color: #d48806;
}

.issue-list { display: flex; flex-direction: column; gap: 8px; }
.issue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafe;
  border-radius: 10px;
  border-left: 3px solid #667eea;
  font-size: 13px;
}
.issue-item.done { border-left-color: #52c41a; }
.issue-item.hot_fix { border-left-color: #ff4d4f; }
.issue-item.bug_fix { border-left-color: #faad14; }
.issue-item.improvement { border-left-color: #13c2c2; }

.issue-key {
  font-weight: 700;
  color: #667eea;
  min-width: 80px;
}
.issue-title { flex: 1; color: #333; }
.issue-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.status-done { background: #f6ffed; color: #52c41a; }
.status-in_progress { background: #e6f7ff; color: #1890ff; }
.status-in_testing { background: #fff7e6; color: #faad14; }
.status-in_review { background: #f9f0ff; color: #722ed1; }
.status-todo { background: #f5f5f5; color: #999; }

.badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
}
.badge-unplanned { background: #fff1f0; color: #ff4d4f; }
.badge-stale { background: #fff7e6; color: #d48806; }

.stale-section {
  background: #fffbe6;
  border: 1px solid #ffe58f;
}

.footer {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 12px;
}

@media (max-width: 600px) {
  .summary-grid { grid-template-columns: 1fr; }
  .header h1 { font-size: 24px; }
}
</style>
</head>
<body>
<div class="page">

<div class="header">
  <div class="project">${escapeHTML(data.projectKey)}</div>
  <h1>${escapeHTML(data.sprintName)}</h1>
  <div class="date">${escapeHTML(data.sprintStartDate)} ~ ${escapeHTML(data.sprintEndDate)}</div>
</div>

<div class="section">
  <div class="section-title"><span class="emoji">📊</span> 完成度摘要</div>
  <div class="summary-grid">
    <div class="summary-card">
      <div class="value">${data.summary.totalCount}</div>
      <div class="label">总 Issue 数</div>
    </div>
    <div class="summary-card success">
      <div class="value">${data.summary.completedCount}</div>
      <div class="label">已完成</div>
    </div>
    <div class="summary-card${data.summary.isCompletionWarning ? ' warning' : ' success'}">
      <div class="value">${data.summary.completionRate}%</div>
      <div class="label">完成率</div>
    </div>
  </div>
  <div class="summary-row">
    <span class="summary-tag${data.summary.hotFixCount > 0 ? ' warning' : ''}">🔥 Hot Fix: ${data.summary.hotFixCount}</span>
    <span class="summary-tag">📌 计划内: ${data.summary.baselineCount}</span>
    <span class="summary-tag${data.summary.unplannedCount > 0 ? ' warning' : ''}">🚨 插队: ${data.summary.unplannedCount}</span>
  </div>
</div>

${categorySections}

${staleSectionHTML}

<div class="footer">
  Generated at ${escapeHTML(data.generatedAt)}
</div>

</div>
</body>
</html>`
}

// ─── triggerDownload ─────────────────────────────────────────

/**
 * Create a Blob from content and trigger a browser file download.
 * Falls back to opening content in a new window if download is not supported.
 */
export function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch {
    // Fallback: open in new window
    window.open(url, '_blank')
  } finally {
    // Revoke after a short delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

// ─── exportReleaseNotes (convenience entry point) ───────────

/**
 * Export release notes in the specified format and trigger download.
 */
export function exportReleaseNotes(data: ReleaseNotesData, options: ExportOptions): void {
  const filename = generateExportFilename(options)

  let content: string
  let mimeType: string

  if (options.format === 'markdown') {
    content = generateMarkdown(data)
    mimeType = 'text/markdown;charset=utf-8'
  } else {
    content = generateHTML(data)
    mimeType = 'text/html;charset=utf-8'
  }

  triggerDownload(content, filename, mimeType)
}

// ─── Internal helpers ───────────────────────────────────────

function formatIssueListMarkdown(issues: ClassifiedIssue[]): string[] {
  const lines: string[] = []
  for (const issue of issues) {
    const statusIcon = issue.status === 'done' ? '✅' : '🔲'
    const unplannedBadge = issue.isUnplanned ? ' `插队`' : ''
    const staleBadge = issue.isStaleStatus ? ' `状态待更新`' : ''
    const assigneeName = issue.assignee?.name ?? '未分配'
    lines.push(
      `- ${statusIcon} **${issue.id}** ${issue.title}${unplannedBadge}${staleBadge}` +
      `  \n  状态: ${formatStatus(issue.status)} | 优先级: ${issue.priority} | 负责人: ${assigneeName}`,
    )
  }
  return lines
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    todo: '待办',
    in_progress: '进行中',
    in_review: '评审中',
    in_testing: '测试中',
    done: '已完成',
  }
  return statusMap[status] ?? status
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function generateCategorySectionsHTML(categorizedIssues: CategorizedIssues): string {
  const categories: IssueCategory[] = ['feature', 'bug_fix', 'hot_fix', 'improvement', 'other']
  const sections: string[] = []

  for (const category of categories) {
    const issues = categorizedIssues[category]
    if (issues.length === 0) continue

    const issueItems = issues
      .map((issue) => {
        const statusClass = `status-${issue.status}`
        const itemClass = issue.status === 'done' ? 'issue-item done' : `issue-item ${category}`
        const unplannedBadge = issue.isUnplanned
          ? '<span class="badge badge-unplanned">插队</span>'
          : ''
        const staleBadge = issue.isStaleStatus
          ? '<span class="badge badge-stale">状态待更新</span>'
          : ''
        const assigneeName = issue.assignee?.name ?? '未分配'

        return `    <div class="${itemClass}">
      <span class="issue-key">${escapeHTML(issue.id)}</span>
      <span class="issue-title">${escapeHTML(issue.title)}</span>
      <span class="issue-status ${statusClass}">${formatStatus(issue.status)}</span>
      ${unplannedBadge}${staleBadge}
      <span style="font-size:12px;color:#999;">${escapeHTML(assigneeName)}</span>
    </div>`
      })
      .join('\n')

    sections.push(`<div class="section">
  <div class="section-title"><span class="emoji">${CATEGORY_EMOJI[category]}</span> ${CATEGORY_LABELS[category]} (${issues.length})</div>
  <div class="issue-list">
${issueItems}
  </div>
</div>`)
  }

  return sections.join('\n\n')
}

function generateStaleSectionHTML(staleIssues: ClassifiedIssue[]): string {
  if (staleIssues.length === 0) return ''

  const items = staleIssues
    .map(
      (issue) => `    <div class="issue-item">
      <span class="issue-key">${escapeHTML(issue.id)}</span>
      <span class="issue-title">${escapeHTML(issue.title)}</span>
      <span class="issue-status status-${issue.status}">${formatStatus(issue.status)}</span>
      <span class="badge badge-stale">状态待更新</span>
    </div>`,
    )
    .join('\n')

  return `<div class="section stale-section">
  <div class="section-title"><span class="emoji">⚠️</span> 状态待更新 (${staleIssues.length})</div>
  <div class="issue-list">
${items}
  </div>
</div>`
}
