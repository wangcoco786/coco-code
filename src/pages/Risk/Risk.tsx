import { useState, useMemo, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { useActiveSprintIssuesByProject } from '@/hooks/useProjectIssues'
import { useWecomSend } from '@/hooks/useWecomSend'
import { useI18n } from '@/context/I18nContext'
import { analyzeRisks } from '@/lib/riskEngine'
import { buildRiskNotification } from '@/lib/wecomClient'
import type { Risk, RiskLevel, RiskType } from '@/types/platform'
import styles from './Risk.module.css'
import AIInsight from '@/components/AIInsight/AIInsight'

const JIRA_BASE_URL = import.meta.env.VITE_JIRA_BASE_URL || ''

// ────── helpers ──────────────────────────────────────────

type RiskTab = 'board' | 'collab' | 'deps'

const LEVEL_CLASS: Record<string, string> = {
  high: styles.levelHigh,
  medium: styles.levelMedium,
  low: styles.levelLow,
}

const CARD_CLASS: Record<string, string> = {
  high: styles.high,
  medium: styles.medium,
  low: styles.low,
}

const LS_KEY = 'ai_pm_wecom_auto_push'

// ────── Risk Card ──────────────────────────────────────────

interface RiskCardProps {
  risk: Risk
  onNotify: (risk: Risk) => void
  isPending: boolean
}

function RiskCard({ risk, onNotify, isPending }: RiskCardProps) {
  const { t } = useI18n()
  return (
    <div className={`${styles.riskCard} ${CARD_CLASS[risk.level] ?? ''}`}>
      <span className={`${styles.riskLevel} ${LEVEL_CLASS[risk.level] ?? ''}`}>
        {risk.level === 'high' ? t('risk.high') : risk.level === 'medium' ? t('risk.medium') : t('risk.low')}
      </span>
      <div className={styles.riskDesc}>{risk.description}</div>
      {risk.assignee && (
        <div className={styles.riskMeta}>负责人：{risk.assignee}</div>
      )}
      <div className={styles.riskActions}>
        <button
          className={styles.btnNotify}
          onClick={() => onNotify(risk)}
          disabled={isPending}
        >
          {isPending ? '推送中…' : `🔔 ${t('common.notify')}`}
        </button>
      </div>
    </div>
  )
}

// ────── Main Page ──────────────────────────────────────────

export default function Risk() {
  const { currentProjectKey } = useApp()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<RiskTab>('board')
  const [autoPush, setAutoPush] = useState<boolean>(() => {
    try { return localStorage.getItem(LS_KEY) === 'true' } catch { return false }
  })
  const [modalLevel, setModalLevel] = useState<RiskLevel | 'all' | null>(null)

  const { data: issues = [], isLoading: rawLoading, isError, error } = useActiveSprintIssuesByProject(currentProjectKey)
  const isLoading = rawLoading && !!currentProjectKey

  const wecomSend = useWecomSend()

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, String(autoPush)) } catch { /* ignore */ }
  }, [autoPush])

  const risks = useMemo(() => analyzeRisks(issues), [issues])

  const highCount = risks.filter((r) => r.level === 'high').length
  const mediumCount = risks.filter((r) => r.level === 'medium').length
  const lowCount = risks.filter((r) => r.level === 'low').length

  const columns: Risk[][] = useMemo(() => {
    const open = risks.filter((r) => r.status === 'open')
    const notified = risks.filter((r) => r.status === 'notified')
    const mid = Math.ceil(notified.length / 2)
    const resolved = risks.filter((r) => r.status === 'resolved')
    return [open, notified.slice(0, mid), notified.slice(mid), resolved]
  }, [risks])

  const colLabels = [t('risk.identified'), t('risk.evaluating'), t('risk.handling'), t('risk.closed')]

  function handleNotify(risk: Risk) {
    wecomSend.mutate(buildRiskNotification(risk))
  }

  // 显示的风险列表
  const modalRisks = modalLevel === 'all' ? risks : modalLevel ? risks.filter(r => r.level === modalLevel) : []
  const modalTitle = modalLevel === 'all' ? `${t('common.all')}（${risks.length}）` :
    modalLevel === 'high' ? `${t('risk.highRisk')}（${highCount}）` :
    modalLevel === 'medium' ? `${t('risk.mediumRisk')}（${mediumCount}）` :
    `${t('risk.lowRisk')}（${lowCount}）`

  const riskTabs: { key: RiskTab; label: string }[] = [
    { key: 'board', label: t('risk.board') },
    { key: 'collab', label: t('risk.collab') },
    { key: 'deps', label: t('risk.deps') },
  ]

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{t('risk.title')}</h1>
          <div className={styles.subtitle}>基于当前 Sprint 数据自动识别风险</div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.toggleRow}>
            <span>{t('risk.autoPush')}</span>
            <label className={styles.toggle}>
              <input type="checkbox" checked={autoPush} onChange={(e) => setAutoPush(e.target.checked)} />
              <span className={styles.toggleSlider} />
            </label>
          </div>
        </div>
      </div>

      {isError && (
        <div className={styles.errorBanner}>
          ⚠️ 数据加载失败：{error instanceof Error ? error.message : '未知错误'}
        </div>
      )}

      {/* AI 分析 */}
      {currentProjectKey && issues.length > 0 && (
        <AIInsight
          title="AI 风险分析"
          buildPrompt={() => {
            return `请分析以下项目风险数据并给出洞察：\n` +
              `- 项目: ${currentProjectKey}\n` +
              `- 总任务: ${issues.length}\n` +
              `- 高风险: ${highCount} 个，中风险: ${mediumCount} 个，低风险: ${lowCount} 个\n` +
              `- 风险总数: ${risks.length}\n` +
              `请用中文回答，简洁给出：1. 风险总体评估 2. 最需关注的风险 3. 缓解建议`
          }}
        />
      )}

      {/* Stats 可点击 */}
      <div className={styles.statsRow}>
        {[
          { level: 'high' as RiskLevel, icon: '🔴', count: highCount, labelKey: 'risk.highRisk' as const, cls: styles.danger },
          { level: 'medium' as RiskLevel, icon: '🟡', count: mediumCount, labelKey: 'risk.mediumRisk' as const, cls: styles.warning },
          { level: 'low' as RiskLevel, icon: '🟢', count: lowCount, labelKey: 'risk.lowRisk' as const, cls: styles.success },
        ].map(({ level, icon, count, labelKey, cls }) => (
          <div
            key={level}
            className={`${styles.statCard} ${cls}`}
            style={{ cursor: count > 0 ? 'pointer' : 'default', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onClick={() => count > 0 && setModalLevel(level)}
            onMouseEnter={e => { if (count > 0) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
            title={count > 0 ? `点击查看${t(labelKey)}详细` : ''}
          >
            <span className={styles.statIcon}>{icon}</span>
            <div className={styles.statInfo}>
              <div className={styles.statValue} style={{ textDecoration: count > 0 ? 'underline dotted' : 'none' }}>
                {count}
              </div>
              <div className={styles.statLabel}>{t(labelKey)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {riskTabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'board' && (
        isLoading ? (
          <><div className={styles.skeleton} /><div className={styles.skeleton} /></>
        ) : (
          <BoardRiskView
            risks={risks}
            columns={columns}
            colLabels={colLabels}
            onNotify={handleNotify}
            isPending={wecomSend.isPending}
          />
        )
      )}

      {activeTab === 'collab' && (
        <CollabView issues={issues} isLoading={isLoading} />
      )}

      {activeTab === 'deps' && (
        <DepsView issues={issues} isLoading={isLoading} />
      )}

      {/* 详细弹窗 */}
      {modalLevel && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalLevel(null)}
        >
          <div
            style={{ background: 'var(--card)', borderRadius: 12, width: 720, maxWidth: '92vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{modalTitle}</span>
              <button onClick={() => setModalLevel(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text2)', padding: '4px 8px' }}>✕</button>
            </div>
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              {/* 等级筛选 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {(['all', 'high', 'medium', 'low'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setModalLevel(l === 'all' ? 'all' : l)}
                    style={{
                      padding: '4px 12px', borderRadius: 4, border: '1px solid', cursor: 'pointer', fontSize: 12,
                      background: modalLevel === l ? (l === 'high' ? 'var(--danger)' : l === 'medium' ? 'var(--warning)' : l === 'low' ? 'var(--success)' : 'var(--primary)') : 'var(--card)',
                      color: modalLevel === l ? '#fff' : 'var(--text2)',
                      borderColor: modalLevel === l ? 'transparent' : 'var(--border)',
                    }}
                  >
                    {l === 'all' ? `${t('common.all')} ${risks.length}` : l === 'high' ? `🔴 ${t('risk.high')} ${highCount}` : l === 'medium' ? `🟡 ${t('risk.medium')} ${mediumCount}` : `🟢 ${t('risk.low')} ${lowCount}`}
                  </button>
                ))}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 600 }}>等级</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 600 }}>类型</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 600 }}>描述</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 600 }}>负责人</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 600 }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {modalRisks.map(risk => (
                    <tr key={risk.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 12,
                          background: risk.level === 'high' ? 'var(--danger-light)' : risk.level === 'medium' ? 'var(--warning-light)' : 'var(--success-light)',
                          color: risk.level === 'high' ? 'var(--danger)' : risk.level === 'medium' ? '#d48806' : '#389e0d',
                        }}>
                          {risk.level === 'high' ? t('risk.high') : risk.level === 'medium' ? t('risk.medium') : t('risk.low')}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 12, background: '#f5f5f5', color: 'var(--text2)' }}>
                          {risk.type === 'unassigned' ? t('risk.unassigned') : risk.type === 'overtime' ? t('risk.overtime') : risk.type === 'scope_creep' ? t('risk.scopeCreep') : t('risk.dependency')}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', maxWidth: 280 }}>{risk.description}</td>
                      <td style={{ padding: '8px 12px' }}>{risk.assignee ?? '--'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <button
                          style={{ padding: '3px 10px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer' }}
                          onClick={() => wecomSend.mutate(buildRiskNotification(risk))}
                          disabled={wecomSend.isPending}
                        >
                          🔔 {t('common.notify')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {modalRisks.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text2)' }}>{t('common.noData')}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ────── 看板视图（含筛选）──────────────────────────────────

interface BoardRiskViewProps {
  risks: Risk[]
  columns: Risk[][]
  colLabels: string[]
  onNotify: (risk: Risk) => void
  isPending: boolean
}

function BoardRiskView({ risks, columns, colLabels, onNotify, isPending }: BoardRiskViewProps) {
  const { t } = useI18n()
  const [levelFilter, setLevelFilter] = useState<'' | RiskLevel>('')
  const [typeFilter, setTypeFilter] = useState<'' | RiskType>('')

  // 客户端过滤
  const filteredColumns = useMemo<Risk[][]>(() => {
    return columns.map((col) =>
      col.filter((r) => {
        if (levelFilter && r.level !== levelFilter) return false
        if (typeFilter && r.type !== typeFilter) return false
        return true
      })
    )
  }, [columns, levelFilter, typeFilter])

  const hasFilter = levelFilter !== '' || typeFilter !== ''

  function resetFilters() {
    setLevelFilter('')
    setTypeFilter('')
  }

  // 统计过滤后的总数（用于空状态显示）
  const totalFiltered = filteredColumns.reduce((s, c) => s + c.length, 0)
  void risks // suppress unused warning; risks used by parent for stats

  return (
    <>
      {/* 筛选栏 */}
      <div className={styles.filterBar}>
        <select
          className={styles.filterSelect}
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as '' | RiskLevel)}
        >
          <option value="">{t('risk.allLevel')}</option>
          <option value="high">{t('risk.high')}</option>
          <option value="medium">{t('risk.medium')}</option>
          <option value="low">{t('risk.low')}</option>
        </select>

        <select
          className={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as '' | RiskType)}
        >
          <option value="">{t('risk.allType')}</option>
          <option value="unassigned">{t('risk.unassigned')}</option>
          <option value="overtime">{t('risk.overtime')}</option>
          <option value="scope_creep">{t('risk.scopeCreep')}</option>
          <option value="dependency_block">{t('risk.dependency')}</option>
        </select>

        {hasFilter && (
          <button className={styles.filterReset} onClick={resetFilters}>
            {t('common.reset')}
          </button>
        )}
      </div>

      {totalFiltered === 0 && hasFilter ? (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>🔍</div>
          <div className={styles.placeholderText}>无匹配风险</div>
        </div>
      ) : (
        <div className={styles.kanban}>
          {colLabels.map((label, idx) => (
            <div key={label} className={styles.kanbanCol}>
              <div className={styles.kanbanColHeader}>
                <span className={styles.kanbanColTitle}>{label}</span>
                <span className={styles.kanbanColCount}>{filteredColumns[idx]?.length ?? 0}</span>
              </div>
              {(filteredColumns[idx] ?? []).map((risk) => (
                <RiskCard
                  key={risk.id}
                  risk={risk}
                  onNotify={onNotify}
                  isPending={isPending}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ────── 跨团队协作视图 ──────────────────────────────────────

// 从 Issue 标题中提取跨项目前缀，如 "CP|TMS|OMS" → ['CP','TMS','OMS']
function extractCrossProjects(title: string, currentProject: string): string[] {
  // 匹配 "XX|" 或 "XX-" 开头的项目标识
  const matches = title.match(/\b([A-Z]{2,8})\|/g) ?? []
  return [...new Set(
    matches
      .map(m => m.replace('|', ''))
      .filter(p => p !== currentProject && p.length >= 2)
  )]
}

interface CollabViewProps {
  issues: import('@/types/platform').PlatformIssue[]
  isLoading: boolean
}

function CollabView({ issues, isLoading }: CollabViewProps) {
  const { currentProjectKey } = useApp()

  // 跨项目分组
  const collabGroups = useMemo(() => {
    const map = new Map<string, {
      project: string
      issues: typeof issues
      done: number
      inProgress: number
      blocked: number
    }>()

    for (const issue of issues) {
      const crossProjects = extractCrossProjects(issue.title, currentProjectKey ?? '')
      for (const proj of crossProjects) {
        if (!map.has(proj)) {
          map.set(proj, { project: proj, issues: [], done: 0, inProgress: 0, blocked: 0 })
        }
        const g = map.get(proj)!
        g.issues.push(issue)
        if (issue.status === 'done') g.done++
        else if (issue.status === 'in_progress') g.inProgress++
        else if (!issue.assignee) g.blocked++
      }
    }

    return Array.from(map.values()).sort((a, b) => b.issues.length - a.issues.length)
  }, [issues, currentProjectKey])

  if (isLoading) return <div className={styles.skeleton} style={{ height: 200 }} />

  if (collabGroups.length === 0) {
    return (
      <div className={styles.placeholder}>
        <div className={styles.placeholderIcon}>🤝</div>
        <div className={styles.placeholderText}>
          当前 Sprint 暂无跨团队协作任务
          <div style={{ fontSize: 12, marginTop: 8, color: 'var(--text2)' }}>
            系统通过识别 Issue 标题中的项目前缀（如 CP|TMS|OMS）来发现跨团队协作
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
        检测到 <strong>{collabGroups.length}</strong> 个跨团队协作项目，涉及 <strong>{collabGroups.reduce((s, g) => s + g.issues.length, 0)}</strong> 个任务
      </div>
      {collabGroups.map(group => {
        const total = group.issues.length
        const pct = total > 0 ? Math.round((group.done / total) * 100) : 0
        const health = pct >= 70 ? 'good' : pct >= 40 ? 'warn' : 'bad'
        const healthColor = health === 'good' ? 'var(--success)' : health === 'warn' ? 'var(--warning)' : 'var(--danger)'

        return (
          <div key={group.project} className={styles.collabCard}>
            <div className={styles.collabHeader}>
              <div>
                <div className={styles.collabTitle}>🔗 与 {group.project} 跨团队协作</div>
                <div className={styles.collabMeta}>
                  涉及 {total} 个任务 · 完成 {group.done} · 进行中 {group.inProgress}
                  {group.blocked > 0 && <span style={{ color: 'var(--danger)' }}> · ⚠️ 未分配 {group.blocked}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: healthColor }}>{pct}%</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>完成率</div>
              </div>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${pct}%`, background: healthColor }}
              />
            </div>
            {/* 展开 Issue 列表 */}
            <div className={styles.collabIssues}>
              {group.issues.slice(0, 5).map(issue => (
                <div key={issue.id} className={styles.collabIssueRow}>
                  {JIRA_BASE_URL ? <a href={`${JIRA_BASE_URL}/browse/${issue.id}`} target="_blank" rel="noopener noreferrer" className={styles.issueKey} style={{ textDecoration: 'none' }}>{issue.id}</a> : <span className={styles.issueKey}>{issue.id}</span>}
                  <span className={styles.issueTitle}>{issue.title}</span>
                  <span className={`${styles.statusBadge} ${issue.status === 'done' ? styles.statusDone : issue.status === 'in_progress' ? styles.statusInProgress : styles.statusTodo}`}>
                    {issue.status === 'done' ? '已完成' : issue.status === 'in_progress' ? '进行中' : issue.status === 'in_review' ? '评审中' : issue.status === 'in_testing' ? '测试中' : '待办'}
                  </span>
                </div>
              ))}
              {group.issues.length > 5 && (
                <div style={{ fontSize: 12, color: 'var(--text2)', padding: '4px 0' }}>
                  还有 {group.issues.length - 5} 个任务...
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ────── 依赖管理视图 ──────────────────────────────────────────

interface DepsViewProps {
  issues: import('@/types/platform').PlatformIssue[]
  isLoading: boolean
}

function DepsView({ issues, isLoading }: DepsViewProps) {
  if (isLoading) return <div className={styles.skeleton} style={{ height: 200 }} />

  // 识别依赖风险：未分配 + 高优先级 + 超工时
  const blockedIssues = issues.filter(i =>
    !i.assignee && i.status !== 'done' && (i.priority === 'P0' || i.priority === 'P1')
  )

  const overdueIssues = issues.filter(i => {
    if (i.status === 'done') return false
    if (!i.estimatedHours || !i.spentHours) return false
    return i.spentHours > i.estimatedHours * 1.5
  })

  const staleIssues = issues.filter(i => {
    if (i.status === 'done') return false
    const updated = new Date(i.updatedAt).getTime()
    const daysSince = (Date.now() - updated) / (1000 * 60 * 60 * 24)
    return daysSince > 3 && i.status === 'in_progress'
  })

  const stats = [
    { label: '未分配高优任务', count: blockedIssues.length, color: 'var(--danger)', icon: '🚨' },
    { label: '超预估工时', count: overdueIssues.length, color: 'var(--warning)', icon: '⏰' },
    { label: '3天无更新', count: staleIssues.length, color: 'var(--warning)', icon: '💤' },
  ]

  return (
    <div>
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} className={styles.depStatCard}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{s.icon} {s.label}</div>
          </div>
        ))}
      </div>

      {/* 未分配高优任务 */}
      {blockedIssues.length > 0 && (
        <div className={styles.depSection}>
          <div className={styles.depSectionTitle}>🚨 未分配高优任务（需立即处理）</div>
          {blockedIssues.map(issue => (
            <div key={issue.id} className={styles.depRow}>
              {JIRA_BASE_URL ? <a href={`${JIRA_BASE_URL}/browse/${issue.id}`} target="_blank" rel="noopener noreferrer" className={styles.issueKey} style={{ textDecoration: 'none' }}>{issue.id}</a> : <span className={styles.issueKey}>{issue.id}</span>}
              <span className={styles.issueTitle}>{issue.title}</span>
              <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>{issue.priority} · 未分配</span>
            </div>
          ))}
        </div>
      )}

      {/* 超工时任务 */}
      {overdueIssues.length > 0 && (
        <div className={styles.depSection}>
          <div className={styles.depSectionTitle}>⏰ 超预估工时任务</div>
          {overdueIssues.map(issue => {
            const ratio = issue.estimatedHours && issue.spentHours
              ? Math.round((issue.spentHours / issue.estimatedHours) * 100)
              : 0
            return (
              <div key={issue.id} className={styles.depRow}>
                {JIRA_BASE_URL ? <a href={`${JIRA_BASE_URL}/browse/${issue.id}`} target="_blank" rel="noopener noreferrer" className={styles.issueKey} style={{ textDecoration: 'none' }}>{issue.id}</a> : <span className={styles.issueKey}>{issue.id}</span>}
                <span className={styles.issueTitle}>{issue.title}</span>
                <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>
                  超出 {ratio - 100}% · {issue.assignee?.name ?? '未分配'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* 长时间无更新 */}
      {staleIssues.length > 0 && (
        <div className={styles.depSection}>
          <div className={styles.depSectionTitle}>💤 进行中但 3 天无更新</div>
          {staleIssues.map(issue => {
            const daysSince = Math.floor(
              (Date.now() - new Date(issue.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
            )
            return (
              <div key={issue.id} className={styles.depRow}>
                {JIRA_BASE_URL ? <a href={`${JIRA_BASE_URL}/browse/${issue.id}`} target="_blank" rel="noopener noreferrer" className={styles.issueKey} style={{ textDecoration: 'none' }}>{issue.id}</a> : <span className={styles.issueKey}>{issue.id}</span>}
                <span className={styles.issueTitle}>{issue.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>
                  {daysSince} 天未更新 · {issue.assignee?.name ?? '未分配'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {blockedIssues.length === 0 && overdueIssues.length === 0 && staleIssues.length === 0 && (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>✅</div>
          <div className={styles.placeholderText}>当前暂无依赖风险</div>
        </div>
      )}
    </div>
  )
}
