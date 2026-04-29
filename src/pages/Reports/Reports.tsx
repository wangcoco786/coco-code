import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { useActiveSprintIssuesByProject, useActiveSprintsByProject } from '@/hooks/useProjectIssues'
import { useWecomSend } from '@/hooks/useWecomSend'
import { useI18n } from '@/context/I18nContext'
import { buildReportMessage } from '@/lib/wecomClient'
import { analyzeRisks } from '@/lib/riskEngine'
import type { Report, ReportType, ReportStatus } from '@/types/platform'
import styles from './Reports.module.css'
import AIInsight from '@/components/AIInsight/AIInsight'

// ─── helpers ────────────────────────────────────────────────

const QUICK_CARDS: { type: ReportType; labelKey: string; descKey: string; icon: string }[] = [
  { type: 'daily', labelKey: 'reports.daily', descKey: 'reports.dailyDesc', icon: '📅' },
  { type: 'weekly', labelKey: 'reports.weekly', descKey: 'reports.weeklyDesc', icon: '📊' },
  { type: 'sprint_review', labelKey: 'reports.sprint', descKey: 'reports.sprintDesc', icon: '🎯' },
  { type: 'daily', labelKey: 'reports.monthly', descKey: 'reports.monthlyDesc', icon: '📈' },
  { type: 'weekly', labelKey: 'reports.collaboration', descKey: 'reports.collaborationDesc', icon: '🤝' },
]

// ─── Generate Report Content ─────────────────────────────────

function generateReportContent(
  type: ReportType,
  sprintName: string,
  allIssues: import('@/types/platform').PlatformIssue[],
  allRisks: import('@/types/platform').Risk[],
): string {
  const total = allIssues.length
  const done = allIssues.filter(i => i.status === 'done').length
  const inProgress = allIssues.filter(i => i.status === 'in_progress').length
  const inReview = allIssues.filter(i => i.status === 'in_review').length
  const inTesting = allIssues.filter(i => i.status === 'in_testing').length
  const todo = allIssues.filter(i => i.status === 'todo').length
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

  const highRisks = allRisks.filter(r => r.level === 'high')
  const mediumRisks = allRisks.filter(r => r.level === 'medium')

  const p0Issues = allIssues.filter(i => i.priority === 'P0' && i.status !== 'done')
  const p1Issues = allIssues.filter(i => i.priority === 'P1' && i.status !== 'done')
  const unassigned = allIssues.filter(i => !i.assignee && i.status !== 'done')

  // 按负责人分组统计
  const memberMap = new Map<string, { name: string; total: number; done: number; inProgress: number }>()
  for (const issue of allIssues) {
    const name = issue.assignee?.name ?? '未分配'
    const entry = memberMap.get(name) ?? { name, total: 0, done: 0, inProgress: 0 }
    entry.total++
    if (issue.status === 'done') entry.done++
    if (issue.status === 'in_progress') entry.inProgress++
    memberMap.set(name, entry)
  }
  const members = Array.from(memberMap.values()).sort((a, b) => b.total - a.total)

  // 最近完成的任务（取前5）
  const recentDone = allIssues
    .filter(i => i.status === 'done')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  // 进行中的任务（取前8）
  const activeIssues = allIssues
    .filter(i => i.status === 'in_progress')
    .sort((a, b) => {
      const pOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }
      return (pOrder[a.priority] ?? 9) - (pOrder[b.priority] ?? 9)
    })
    .slice(0, 8)

  const dateStr = new Date().toLocaleDateString('zh-CN')

  const memberSection = members.slice(0, 10).map(m => {
    const pct = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0
    return `| ${m.name} | ${m.total} | ${m.done} | ${m.inProgress} | ${pct}% |`
  }).join('\n')

  const riskSection = highRisks.length > 0
    ? highRisks.map(r => `- 🔴 ${r.description}${r.assignee ? `（${r.assignee}）` : ''}`).join('\n')
    : '- 暂无高危风险'

  const mediumRiskSection = mediumRisks.length > 0
    ? mediumRisks.slice(0, 5).map(r => `- 🟡 ${r.description}${r.assignee ? `（${r.assignee}）` : ''}`).join('\n')
    : '- 暂无中危风险'

  if (type === 'daily') {
    return `# 日报 - ${dateStr}
**${sprintName}**

## 📊 Sprint 进度
- 总任务：${total} 个
- ✅ 已完成：${done}（${completionRate}%）
- 🔄 进行中：${inProgress} | 📋 待办：${todo} | 🔍 评审：${inReview} | 🧪 测试：${inTesting}

## 🔥 进行中的任务
${activeIssues.length > 0 ? activeIssues.map(i => `- [${i.priority}] ${i.id} ${i.title}（${i.assignee?.name ?? '未分配'}）`).join('\n') : '- 暂无进行中任务'}

## ✅ 最近完成
${recentDone.length > 0 ? recentDone.map(i => `- ${i.id} ${i.title}（${i.assignee?.name ?? '—'}）`).join('\n') : '- 暂无'}

## ⚠️ 风险提醒
${riskSection}
${p0Issues.length > 0 ? `\n**P0 紧急未完成（${p0Issues.length}个）：**\n${p0Issues.map(i => `- ${i.id} ${i.title}`).join('\n')}` : ''}
${unassigned.length > 0 ? `\n**未分配任务：${unassigned.length} 个**` : ''}

---
*本报告由 AI-PM 平台自动生成 · ${dateStr}*`
  }

  if (type === 'weekly') {
    return `# 周报 - ${sprintName}
**报告日期：${dateStr}**

## 📊 Sprint 整体进度
| 指标 | 数值 |
|------|------|
| 总任务 | ${total} |
| 已完成 | ${done}（${completionRate}%）|
| 进行中 | ${inProgress} |
| 评审中 | ${inReview} |
| 测试中 | ${inTesting} |
| 待办 | ${todo} |

## 👥 团队成员工作量
| 成员 | 总任务 | 已完成 | 进行中 | 完成率 |
|------|--------|--------|--------|--------|
${memberSection}

## ✅ 本周完成的任务
${recentDone.length > 0 ? recentDone.map(i => `- ${i.id} ${i.title}（${i.assignee?.name ?? '—'}）`).join('\n') : '- 暂无完成任务'}

## 🔄 当前进行中
${activeIssues.length > 0 ? activeIssues.map(i => `- [${i.priority}] ${i.id} ${i.title}（${i.assignee?.name ?? '未分配'}）`).join('\n') : '- 暂无'}

## ⚠️ 风险与阻塞
**高危风险（${highRisks.length}个）：**
${riskSection}

**中危风险（${mediumRisks.length}个）：**
${mediumRiskSection}

${p0Issues.length > 0 ? `**P0 紧急未完成（${p0Issues.length}个）：**\n${p0Issues.map(i => `- ${i.id} ${i.title}（${i.assignee?.name ?? '未分配'}）`).join('\n')}` : ''}
${p1Issues.length > 0 ? `\n**P1 高优未完成（${p1Issues.length}个）：**\n${p1Issues.slice(0, 5).map(i => `- ${i.id} ${i.title}`).join('\n')}` : ''}
${unassigned.length > 0 ? `\n**⚠️ 未分配任务：${unassigned.length} 个，需尽快分配**` : ''}

## 📋 下周计划
- 继续推进 Sprint 剩余 ${total - done} 个任务
- 重点关注 ${p0Issues.length} 个 P0 任务和 ${highRisks.length} 个高危风险
${unassigned.length > 0 ? `- 分配 ${unassigned.length} 个未分配任务` : ''}

---
*本报告由 AI-PM 平台自动生成 · ${dateStr}*`
  }

  if (type === 'sprint_review') {
    const topMembers = members.filter(m => m.name !== '未分配').slice(0, 5)
    const overloaded = topMembers.filter(m => m.total > 15)
    const underloaded = topMembers.filter(m => m.total < 5)

    return `# Sprint 复盘报告 - ${sprintName}
**报告日期：${dateStr}**

## 📊 Sprint 概览
| 指标 | 数值 |
|------|------|
| 计划任务 | ${total} |
| 完成任务 | ${done} |
| 完成率 | ${completionRate}% |
| 未完成 | ${total - done} |
| 高危风险 | ${highRisks.length} |
| 中危风险 | ${mediumRisks.length} |

## 👥 团队贡献
| 成员 | 总任务 | 已完成 | 进行中 | 完成率 |
|------|--------|--------|--------|--------|
${memberSection}

${overloaded.length > 0 ? `**⚠️ 负载过高：** ${overloaded.map(m => m.name).join('、')}（任务数 > 15）` : ''}
${underloaded.length > 0 ? `**💡 可承担更多：** ${underloaded.map(m => m.name).join('、')}（任务数 < 5）` : ''}

## ⚠️ 风险回顾
**高危风险（${highRisks.length}个）：**
${riskSection}

**中危风险（${mediumRisks.length}个）：**
${mediumRiskSection}

## 📌 未完成任务分析
${p0Issues.length > 0 ? `**P0 紧急（${p0Issues.length}个）：**\n${p0Issues.map(i => `- ${i.id} ${i.title}（${i.assignee?.name ?? '未分配'}）`).join('\n')}` : '- 无 P0 遗留'}
${p1Issues.length > 0 ? `\n**P1 高优（${p1Issues.length}个）：**\n${p1Issues.slice(0, 8).map(i => `- ${i.id} ${i.title}（${i.assignee?.name ?? '未分配'}）`).join('\n')}` : ''}

## 💡 改进建议
1. ${completionRate < 70 ? '完成率偏低，建议优化需求拆分和估算' : '完成率良好，继续保持'}
2. ${highRisks.length > 3 ? '高危风险较多，建议加强风险预警和提前干预' : '风险可控'}
3. ${unassigned.length > 5 ? `${unassigned.length} 个任务未分配，建议优化任务分配流程` : '任务分配合理'}
4. ${overloaded.length > 0 ? `部分成员负载过高，建议平衡工作量` : '团队负载均衡'}

---
*本报告由 AI-PM 平台自动生成 · ${dateStr}*`
  }

  return '报告内容生成中…'
}

// ─── Main Page ───────────────────────────────────────────────

export default function Reports() {
  const { currentUser, currentProjectKey } = useApp()
  const { t } = useI18n()
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [reportStatuses, setReportStatuses] = useState<Record<string, ReportStatus>>({})
  const [typeFilter, setTypeFilter] = useState<'' | ReportType>('')
  const [statusFilter, setStatusFilter] = useState<'' | ReportStatus>('')
  const { data: sprints = [] } = useActiveSprintsByProject(currentProjectKey)
  const sprint = sprints[0] ?? null
  const { data: issues = [], isLoading: rawLoading, isError, error } = useActiveSprintIssuesByProject(currentProjectKey)
  const isLoading = rawLoading && !!currentProjectKey

  const wecomSend = useWecomSend()
  const isDev = currentUser?.role === 'DEV'
  const projectName = sprint?.name ?? currentProjectKey ?? 'Project'

  const risks = useMemo(() => analyzeRisks(issues), [issues])
  const highRisks = risks.filter((r) => r.level === 'high').length
  const mediumRisks = risks.filter((r) => r.level === 'medium').length
  const doneCount = issues.filter((i) => i.status === 'done').length

  // Generate mock reports
  const reports: Report[] = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)

    const base: Report[] = [
      {
        id: 'report-daily-1',
        type: 'daily',
        title: `${projectName} 日报`,
        date: today,
        status: reportStatuses['report-daily-1'] ?? 'draft',
        content: generateReportContent('daily', projectName, issues, risks),
      },
      {
        id: 'report-weekly-1',
        type: 'weekly',
        title: `${projectName} 周报`,
        date: today,
        status: reportStatuses['report-weekly-1'] ?? 'draft',
        content: generateReportContent('weekly', projectName, issues, risks),
      },
      {
        id: 'report-sprint-1',
        type: 'sprint_review',
        title: `${projectName} 复盘报告`,
        date: today,
        status: reportStatuses['report-sprint-1'] ?? 'draft',
        content: generateReportContent('sprint_review', projectName, issues, risks),
      },
    ]

    if (isDev) return base.filter((r) => r.type === 'daily')
    return base
  }, [projectName, issues, doneCount, highRisks, mediumRisks, reportStatuses, isDev])

  const selectedReport = reports.find((r) => r.id === selectedReportId) ?? null

  // 客户端筛选
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (typeFilter && r.type !== typeFilter) return false
      if (statusFilter && r.status !== statusFilter) return false
      return true
    })
  }, [reports, typeFilter, statusFilter])

  const hasFilter = typeFilter !== '' || statusFilter !== ''

  function resetFilters() {
    setTypeFilter('')
    setStatusFilter('')
  }

  function handlePush(report: Report) {
    wecomSend.mutate(buildReportMessage(report), {
      onSuccess: () => {
        setReportStatuses((prev) => ({ ...prev, [report.id]: 'pushed' }))
      },
    })
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{t('reports.title')}</h1>
          <div className={styles.subtitle}>{t('reports.subtitle')}</div>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className={styles.errorBanner}>
          ⚠️ {t('dashboard.errorLoad')}：{error instanceof Error ? error.message : t('common.error')}
        </div>
      )}

      {/* AI 分析 */}
      {currentProjectKey && issues.length > 0 && (
        <AIInsight
          title={t('ai.insight')}
          buildPrompt={() => {
            const done = issues.filter(i => i.status === 'done').length
            const inProgress = issues.filter(i => i.status === 'in_progress').length
            return `请基于以下数据生成一段简洁的项目进展摘要，可用于日报/周报：\n` +
              `- 项目: ${currentProjectKey}\n` +
              `- Sprint: ${sprint?.name ?? '无'}\n` +
              `- 总任务: ${issues.length}，已完成: ${done}，进行中: ${inProgress}\n` +
              `- 完成率: ${issues.length > 0 ? Math.round((done / issues.length) * 100) : 0}%\n` +
              `请用中文回答，给出：1. 本期进展摘要 2. 关键成果 3. 待解决问题`
          }}
        />
      )}

      {/* Quick cards */}
      <div className={styles.quickCards}>
        {QUICK_CARDS.map((card) => (
          <div key={card.labelKey} className={styles.quickCard}>
            <div className={styles.quickCardIcon}>{card.icon}</div>
            <div className={styles.quickCardLabel}>{t(card.labelKey as any)}</div>
            <div className={styles.quickCardDesc}>{t(card.descKey as any)}</div>
          </div>
        ))}
      </div>

      {/* Layout: Table + Preview */}
      {isLoading ? (
        <div className={styles.loading}>{t('common.loading')}</div>
      ) : (
        <div className={styles.layout}>
          {/* Table */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>{t('reports.reportList')}</div>

            {/* 筛选栏 */}
            <div className={styles.filterBar} style={{ padding: '12px 16px 0' }}>
              <select
                className={styles.filterSelect}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as '' | ReportType)}
              >
                <option value="">{t('reports.allTypes')}</option>
                <option value="daily">{t('reports.daily')}</option>
                <option value="weekly">{t('reports.weekly')}</option>
                <option value="sprint_review">{t('reports.sprint')}</option>
              </select>

              <select
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as '' | ReportStatus)}
              >
                <option value="">{t('reports.allStatus')}</option>
                <option value="draft">{t('reports.draft')}</option>
                <option value="pushed">{t('reports.pushed')}</option>
              </select>

              {hasFilter && (
                <button className={styles.filterReset} onClick={resetFilters}>
                  {t('common.reset')}
                </button>
              )}
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('reports.type')}</th>
                  <th>{t('reports.reportTitle')}</th>
                  <th>{t('reports.date')}</th>
                  <th>{t('reports.status')}</th>
                  <th>{t('reports.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const typeLabel: Record<ReportType, string> = {
                    daily: t('reports.daily'),
                    weekly: t('reports.weekly'),
                    sprint_review: t('reports.sprint'),
                  }
                  return (
                    <tr
                      key={report.id}
                      className={selectedReportId === report.id ? styles.selected : ''}
                    >
                      <td>{typeLabel[report.type]}</td>
                      <td>{report.title}</td>
                      <td>{report.date}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            report.status === 'pushed' ? styles.statusPushed : styles.statusDraft
                          }`}
                        >
                          {report.status === 'pushed' ? t('reports.pushed') : t('reports.draft')}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.btnLink}
                          onClick={() => setSelectedReportId(report.id)}
                        >
                          {t('common.view')}
                        </button>
                        <button
                          className={styles.btnPush}
                          onClick={() => handlePush(report)}
                          disabled={wecomSend.isPending || report.status === 'pushed'}
                        >
                          {wecomSend.isPending ? t('reports.pushing') : t('reports.pushWecom')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Preview */}
          <div className={styles.preview}>
            <div className={styles.previewTitle}>
              {t('reports.preview')}
              {selectedReport && (
                <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 400 }}>
                  {selectedReport.title}
                </span>
              )}
            </div>
            <div className={styles.previewContent}>
              {selectedReport ? (
                <pre className={styles.previewPre}>{selectedReport.content}</pre>
              ) : (
                <div className={styles.previewEmpty}>{t('reports.previewEmpty')}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
