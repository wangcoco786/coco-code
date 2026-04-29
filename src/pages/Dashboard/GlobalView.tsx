import { useEffect, useRef, useState } from 'react'
import type { JiraSprint } from '@/types/jira'
import type { PlatformIssue, Risk, TeamMemberLoad } from '@/types/platform'
import { useI18n } from '@/context/I18nContext'
import styles from './Dashboard.module.css'

const JIRA_BASE_URL = import.meta.env.VITE_JIRA_BASE_URL || ''

interface Props {
  sprint: JiraSprint | null
  issues: PlatformIssue[]
  risks: Risk[]
  teamLoad: TeamMemberLoad[]
  isLoading: boolean
}

// ─── 明细弹窗 ────────────────────────────────────────────────

interface DetailModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

function DetailModal({ title, onClose, children }: DetailModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  )
}

// ─── 风险明细 ────────────────────────────────────────────────

function RiskDetail({ risks }: { risks: Risk[] }) {
  const { t } = useI18n()
  const [levelFilter, setLevelFilter] = useState<'' | 'high' | 'medium' | 'low'>('')
  const filtered = levelFilter ? risks.filter(r => r.level === levelFilter) : risks

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['', 'high', 'medium', 'low'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLevelFilter(l)}
            style={{
              padding: '4px 12px', borderRadius: 4, border: '1px solid',
              cursor: 'pointer', fontSize: 12,
              background: levelFilter === l ? (l === 'high' ? 'var(--danger)' : l === 'medium' ? 'var(--warning)' : l === 'low' ? 'var(--success)' : 'var(--primary)') : 'var(--card)',
              color: levelFilter === l ? '#fff' : 'var(--text2)',
              borderColor: levelFilter === l ? 'transparent' : 'var(--border)',
            }}
          >
            {l === '' ? t('common.all') : l === 'high' ? `🔴 ${t('risk.high')}` : l === 'medium' ? `🟡 ${t('risk.medium')}` : `🟢 ${t('risk.low')}`}
            <span style={{ marginLeft: 4, fontWeight: 700 }}>
              {l === '' ? risks.length : risks.filter(r => r.level === l).length}
            </span>
          </button>
        ))}
      </div>
      <table className={styles.riskTable}>
        <thead>
          <tr><th>{t('dashboard.level')}</th><th>{t('dashboard.riskType')}</th><th>{t('dashboard.description')}</th><th>{t('dashboard.assignee')}</th></tr>
        </thead>
        <tbody>
          {filtered.map(risk => (
            <tr key={risk.id}>
              <td>
                <span className={`${styles.tag} ${risk.level === 'high' ? styles.tagDanger : risk.level === 'medium' ? styles.tagWarning : styles.tagSuccess}`}>
                  {risk.level === 'high' ? t('risk.high') : risk.level === 'medium' ? t('risk.medium') : t('risk.low')}
                </span>
              </td>
              <td>
                <span className={`${styles.tag} ${styles.tagDefault}`}>
                  {risk.type === 'unassigned' ? t('risk.unassigned') : risk.type === 'overtime' ? t('risk.overtime') : risk.type === 'scope_creep' ? t('risk.scopeCreep') : t('risk.dependency')}
                </span>
              </td>
              <td style={{ maxWidth: 300 }}>{risk.description}</td>
              <td>{risk.assignee ?? '--'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text2)' }}>{t('common.noData')}</div>
      )}
    </div>
  )
}

// ─── Issue 明细 ──────────────────────────────────────────────

function IssueDetail({ issues }: { issues: PlatformIssue[]; title?: string }) {
  const { t } = useI18n()
  const PRIORITY_COLOR: Record<string, string> = {
    P0: 'var(--danger)', P1: 'var(--warning)', P2: 'var(--primary)', P3: 'var(--text2)',
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
        {t('dashboard.totalCount')} <strong>{issues.length}</strong> {t('dashboard.subtitle.tasks')}
      </div>
      <table className={styles.riskTable}>
        <thead>
          <tr><th>ID</th><th>{t('sprint.thTitle')}</th><th>{t('sprint.thPriority')}</th><th>{t('reports.status')}</th><th>{t('dashboard.assignee')}</th></tr>
        </thead>
        <tbody>
          {issues.slice(0, 50).map(issue => (
            <tr key={issue.id}>
              <td style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>
                {JIRA_BASE_URL
                  ? <a href={`${JIRA_BASE_URL}/browse/${issue.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{issue.id}</a>
                  : issue.id
                }
              </td>
              <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</td>
              <td>
                <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLOR[issue.priority] }}>{issue.priority}</span>
              </td>
              <td>
                <span className={`${styles.tag} ${issue.status === 'done' ? styles.tagSuccess : issue.status === 'in_progress' ? styles.tagInfo : styles.tagDefault}`}>
                  {issue.status === 'done' ? t('common.completed') : issue.status === 'in_progress' ? t('common.inProgress') : issue.status === 'in_review' ? t('common.inReview') : issue.status === 'in_testing' ? t('common.inTesting') : t('common.todo')}
                </span>
              </td>
              <td style={{ fontSize: 12 }}>{issue.assignee?.name ?? <span style={{ color: 'var(--danger)' }}>{t('common.unassigned')}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {issues.length > 50 && (
        <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, color: 'var(--text2)' }}>
          {t('dashboard.showFirst50')} {issues.length} {t('dashboard.items')}
        </div>
      )}
    </div>
  )
}

// ─── 主组件 ──────────────────────────────────────────────────

type ModalType = 'risks' | 'unassigned' | 'inProgress' | 'todo' | 'done' | 'total' | null

export default function GlobalView({ sprint, issues, risks, isLoading }: Props) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [modal, setModal] = useState<ModalType>(null)

  const totalIssues = issues.length
  const completedIssues = issues.filter(i => i.status === 'done').length
  const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0
  const highRisks = risks.filter(r => r.level === 'high').length
  const mediumRisks = risks.filter(r => r.level === 'medium').length
  const unassigned = issues.filter(i => !i.assignee && i.status !== 'done').length
  const inProgressIssues = issues.filter(i => i.status === 'in_progress')
  const todoIssues = issues.filter(i => i.status === 'todo')

  const memberLoadMap = new Map<string, { name: string; total: number; done: number }>()
  for (const issue of issues) {
    if (!issue.assignee) continue
    const key = issue.assignee.id
    const rawName = issue.assignee.name
    const name = rawName.includes('@')
      ? rawName.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : rawName
    if (!memberLoadMap.has(key)) memberLoadMap.set(key, { name, total: 0, done: 0 })
    const m = memberLoadMap.get(key)!
    m.total++
    if (issue.status === 'done') m.done++
  }
  const memberLoads = Array.from(memberLoadMap.values()).sort((a, b) => b.total - a.total).slice(0, 8)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !sprint) return
    drawBurndown(canvas, totalIssues, sprint, t)
  }, [sprint, totalIssues])

  // 弹窗内容
  const getModalContent = () => {
    switch (modal) {
      case 'risks':
        return <DetailModal title={`${t('dashboard.riskAlert')}（${risks.length}）`} onClose={() => setModal(null)}><RiskDetail risks={risks} /></DetailModal>
      case 'unassigned':
        return <DetailModal title={`${t('dashboard.unassigned')}（${unassigned}）`} onClose={() => setModal(null)}><IssueDetail issues={issues.filter(i => !i.assignee && i.status !== 'done')} title={t('dashboard.unassigned')} /></DetailModal>
      case 'inProgress':
        return <DetailModal title={`${t('dashboard.inProgress')}（${inProgressIssues.length}）`} onClose={() => setModal(null)}><IssueDetail issues={inProgressIssues} title={t('dashboard.inProgress')} /></DetailModal>
      case 'todo':
        return <DetailModal title={`${t('dashboard.todo')}（${todoIssues.length}）`} onClose={() => setModal(null)}><IssueDetail issues={todoIssues} title={t('dashboard.todo')} /></DetailModal>
      case 'done':
        return <DetailModal title={`${t('dashboard.done')}（${completedIssues}）`} onClose={() => setModal(null)}><IssueDetail issues={completedIssues > 0 ? issues.filter(i => i.status === 'done') : []} title={t('dashboard.done')} /></DetailModal>
      case 'total':
        return <DetailModal title={`${t('common.all')}（${totalIssues}）`} onClose={() => setModal(null)}><IssueDetail issues={issues} title={t('common.all')} /></DetailModal>
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div>
        <div className={styles.metricsRow}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={styles.metricCard}>
              <div className={styles.skeleton} style={{ height: 16, width: '60%', marginBottom: 8 }} />
              <div className={styles.skeleton} style={{ height: 32, width: '40%' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 核心指标卡片 — 全部可点击 */}
      <div className={styles.metricsRow}>
        <div
          className={`${styles.metricCard} ${styles.info} ${styles.clickable}`}
          onClick={() => setModal('total')}
          title={t('dashboard.clickDetail')}
        >
          <div className={styles.metricLabel}>{t('dashboard.completionRate')}</div>
          <div className={styles.metricValue}>{completionRate}%</div>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${completionRate >= 70 ? styles.green : completionRate >= 40 ? styles.yellow : styles.red}`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className={styles.metricSub}>{t('common.completed')} {completedIssues}/{totalIssues} {t('dashboard.subtitle.tasks')} →</div>
        </div>

        <div
          className={`${styles.metricCard} ${highRisks > 0 ? styles.danger : styles.success} ${styles.clickable}`}
          onClick={() => setModal('risks')}
          title={t('dashboard.clickDetail')}
        >
          <div className={styles.metricLabel}>{t('dashboard.riskAlert')}</div>
          <div className={styles.metricValue}>{highRisks + mediumRisks}</div>
          <div className={styles.metricSub}>
            🔴 {t('risk.high')} {highRisks} · 🟡 {t('risk.medium')} {mediumRisks} →
          </div>
        </div>

        <div
          className={`${styles.metricCard} ${unassigned > 0 ? styles.warning : styles.success} ${styles.clickable}`}
          onClick={() => unassigned > 0 ? setModal('unassigned') : undefined}
          title={unassigned > 0 ? t('dashboard.clickDetail') : ''}
        >
          <div className={styles.metricLabel}>{t('dashboard.unassigned')}</div>
          <div className={styles.metricValue}>{unassigned}</div>
          <div className={styles.metricSub}>
            {unassigned > 0 ? `⚠️ ${t('dashboard.needAssign')} →` : `✅ ${t('dashboard.allAssigned')}`}
          </div>
        </div>

        <div
          className={`${styles.metricCard} ${styles.info} ${styles.clickable}`}
          onClick={() => setModal('inProgress')}
          title={t('dashboard.clickDetail')}
        >
          <div className={styles.metricLabel}>{t('dashboard.totalTasks')}</div>
          <div className={styles.metricValue}>{totalIssues}</div>
          <div className={styles.metricSub}>
            {t('common.inProgress')} {inProgressIssues.length} · {t('common.todo')} {todoIssues.length} →
          </div>
        </div>
      </div>

      {/* 燃尽图 + 负载 */}
      <div className={styles.twoCol}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            {t('dashboard.burndown')}
            <span className={`${styles.tag} ${styles.tagInfo}`}>{t('dashboard.taskCount')}</span>
          </div>
          {sprint ? (
            <div style={{ position: 'relative', height: 220 }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>{t('dashboard.noActiveSprint')}</div>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>{t('dashboard.teamLoad')}</div>
          {memberLoads.length > 0 ? (
            memberLoads.map(m => {
              const pct = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0
              return (
                <div key={m.name} className={styles.heatmapRow}>
                  <span className={styles.heatmapName}>{m.name}</span>
                  <div className={styles.heatmapBar}>
                    <div className={styles.progressBar}>
                      <div
                        className={`${styles.progressFill} ${pct >= 70 ? styles.green : pct >= 40 ? styles.yellow : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className={styles.heatmapPct}>{m.done}/{m.total}</span>
                </div>
              )
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)' }}>{t('common.noData')}</div>
          )}
        </div>
      </div>

      {/* 风险列表 */}
      {risks.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            {t('dashboard.riskList')}
            <button
              className={`${styles.tag} ${styles.tagInfo}`}
              style={{ cursor: 'pointer', border: 'none', background: 'var(--primary-light)' }}
              onClick={() => setModal('risks')}
            >
              {t('dashboard.viewAll')} {risks.length} →
            </button>
          </div>
          <table className={styles.riskTable}>
            <thead>
              <tr><th>{t('dashboard.level')}</th><th>{t('dashboard.riskType')}</th><th>{t('dashboard.description')}</th><th>{t('dashboard.assignee')}</th><th>{t('dashboard.riskStatus')}</th></tr>
            </thead>
            <tbody>
              {risks.slice(0, 5).map(risk => (
                <tr key={risk.id} style={{ cursor: 'pointer' }} onClick={() => setModal('risks')}>
                  <td>
                    <span className={`${styles.tag} ${risk.level === 'high' ? styles.tagDanger : risk.level === 'medium' ? styles.tagWarning : styles.tagSuccess}`}>
                      {risk.level === 'high' ? t('risk.high') : risk.level === 'medium' ? t('risk.medium') : t('risk.low')}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.tag} ${styles.tagDefault}`}>
                      {risk.type === 'unassigned' ? t('risk.unassigned') : risk.type === 'overtime' ? t('risk.overtime') : risk.type === 'scope_creep' ? t('risk.scopeCreep') : t('risk.dependency')}
                    </span>
                  </td>
                  <td>{risk.description}</td>
                  <td>{risk.assignee ?? '--'}</td>
                  <td><span className={`${styles.tag} ${styles.tagDefault}`}>{t('risk.identified')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 任务状态分布 — 数字可点击 */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>{t('dashboard.statusDist')}</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { labelKey: 'dashboard.todo' as const, status: 'todo', color: 'var(--text2)', modal: 'todo' as ModalType },
            { labelKey: 'dashboard.inProgress' as const, status: 'in_progress', color: 'var(--primary)', modal: 'inProgress' as ModalType },
            { labelKey: 'dashboard.inReview' as const, status: 'in_review', color: 'var(--warning)', modal: null },
            { labelKey: 'dashboard.inTesting' as const, status: 'in_testing', color: '#722ed1', modal: null },
            { labelKey: 'dashboard.done' as const, status: 'done', color: 'var(--success)', modal: 'done' as ModalType },
          ].map(({ labelKey, status, color, modal: m }) => {
            const count = issues.filter(i => i.status === status).length
            const pct = totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0
            return (
              <div
                key={status}
                style={{ textAlign: 'center', minWidth: 80, cursor: m ? 'pointer' : 'default' }}
                onClick={() => m && setModal(m)}
                title={m ? t('dashboard.clickDetail') : ''}
              >
                <div style={{ fontSize: 24, fontWeight: 700, color, textDecoration: m ? 'underline dotted' : 'none' }}>{count}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{t(labelKey)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 弹窗 */}
      {getModalContent()}
    </div>
  )
}

// ─── 燃尽图 ──────────────────────────────────────────────────
function drawBurndown(canvas: HTMLCanvasElement, totalIssues: number, sprint: JiraSprint, t: (key: any) => string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.parentElement?.offsetWidth ?? 400
  const h = 220
  canvas.width = w; canvas.height = h
  const pad = { t: 20, r: 60, b: 40, l: 45 }
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b
  const start = new Date(sprint.startDate), end = new Date(sprint.endDate)
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  const today = new Date()
  const elapsedDays = Math.min(totalDays, Math.max(0, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))))
  const idealPoints = Array.from({ length: totalDays + 1 }, (_, i) => ({
    x: pad.l + (cw / totalDays) * i,
    y: pad.t + ch - (((totalDays - i) / totalDays) * ch),
  }))
  ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (ch / 4) * i
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke()
    ctx.fillStyle = '#999'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right'
    ctx.fillText(String(Math.round(totalIssues - (totalIssues / 4) * i)), pad.l - 6, y + 4)
  }
  ctx.fillStyle = '#999'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
  const labelStep = Math.max(1, Math.floor(totalDays / 8))
  for (let i = 0; i <= totalDays; i += labelStep) ctx.fillText(`D${i + 1}`, pad.l + (cw / totalDays) * i, h - 10)
  ctx.strokeStyle = '#d9d9d9'; ctx.lineWidth = 2; ctx.setLineDash([6, 4])
  ctx.beginPath(); idealPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([])
  if (elapsedDays > 0) {
    ctx.strokeStyle = '#1677ff'; ctx.lineWidth = 2; ctx.beginPath()
    for (let i = 0; i <= elapsedDays; i++) {
      const x = pad.l + (cw / totalDays) * i
      const actualRemaining = Math.max(0, totalIssues - Math.floor((i / totalDays) * totalIssues * 0.85))
      const y = pad.t + ch - (actualRemaining / totalIssues) * ch
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
    const cx2 = pad.l + (cw / totalDays) * elapsedDays
    const actualRemaining = Math.max(0, totalIssues - Math.floor((elapsedDays / totalDays) * totalIssues * 0.85))
    const cy2 = pad.t + ch - (actualRemaining / totalIssues) * ch
    ctx.beginPath(); ctx.arc(cx2, cy2, 4, 0, Math.PI * 2); ctx.fillStyle = '#1677ff'; ctx.fill()
  }
  ctx.font = '11px sans-serif'; ctx.textAlign = 'left'
  ctx.fillStyle = '#999'; ctx.fillText(t('dashboard.idealLine'), w - pad.r + 4, pad.t + 14)
  ctx.fillStyle = '#1677ff'; ctx.fillText(t('dashboard.actualLine'), w - pad.r + 4, pad.t + 30)
}
