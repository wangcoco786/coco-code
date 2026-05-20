import { useState, useMemo, useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { useNotifications } from '@/context/NotificationContext'
import { useActiveSprintIssuesByProject, useActiveSprintsByProject } from '@/hooks/useProjectIssues'
import { analyzeRisks, calculateTeamLoad } from '@/lib/riskEngine'
import { useI18n } from '@/context/I18nContext'
import { sortAndLimitActivities } from '@/lib/activityFeed'
import AIInsight from '@/components/AIInsight/AIInsight'
import ActivityFeed from '@/components/ActivityFeed/ActivityFeed'
import GlobalView from './GlobalView'
import PersonalView from './PersonalView'
import PerformanceView from './PerformanceView'
import ReleaseNotesTab from './ReleaseNotesTab'
import styles from './Dashboard.module.css'
import type { PlatformIssue, ActivityItem } from '@/types/platform'

type DashTab = 'global' | 'personal' | 'decision' | 'performance' | 'release-notes'

export default function Dashboard() {
  const { currentUser, currentProjectKey } = useApp()
  const { addNotification } = useNotifications()
  const { t } = useI18n()

  // 读取 URL 参数确定初始 Tab
  const getInitialTab = (): DashTab => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    if (tabParam === 'performance' || tabParam === 'global' || tabParam === 'personal' || tabParam === 'decision' || tabParam === 'release-notes') {
      return tabParam
    }
    // Default: PM → global, DEV → personal
    if (currentUser?.role === 'PM') return 'global'
    return 'personal'
  }

  const [activeTab, setActiveTab] = useState<DashTab>(getInitialTab)

  const handleTabChange = (tab: DashTab) => {
    setActiveTab(tab)
  }

  const { data: sprints = [] } = useActiveSprintsByProject(currentProjectKey)
  const sprint = sprints[0] ?? null  // Dashboard 显示第一个 Sprint
  const { data: issues = [], isLoading: rawLoading, error } = useActiveSprintIssuesByProject(
    sprint?.id ? currentProjectKey : null,
    sprint?.id ?? null,
  )
  const isLoading = (rawLoading && !!currentProjectKey) || (!sprint && !!currentProjectKey)

  const risks = analyzeRisks(issues)
  const teamLoad = calculateTeamLoad(issues, {})

  // Track which risks have already been notified to avoid duplicates
  const notifiedRisksRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const highRisks = risks.filter(r => r.level === 'high')
    for (const risk of highRisks) {
      // Use relatedIssueId + type as stable key (risk.id contains Date.now() so it changes)
      const stableKey = `${risk.type}-${risk.relatedIssueId ?? 'global'}`
      if (!notifiedRisksRef.current.has(stableKey)) {
        notifiedRisksRef.current.add(stableKey)
        addNotification({
          type: 'risk',
          title: '高危风险预警',
          message: risk.description,
          priority: 'high',
          actionUrl: '/risk',
        })
      }
    }
  }, [risks, addNotification])

  // Generate sample activities from sprint issues
  const sampleActivities: ActivityItem[] = useMemo(() => {
    if (issues.length === 0) return []
    const activities: ActivityItem[] = []
    for (const issue of issues.slice(0, 20)) {
      // Task created activity
      activities.push({
        id: `act-created-${issue.id}`,
        type: 'task_created',
        actor: { id: issue.assignee?.id ?? 'system', name: issue.assignee?.name ?? 'System' },
        target: { type: 'issue', id: issue.id, title: issue.title },
        description: '创建了任务',
        timestamp: issue.createdAt,
      })
      // Status change activity for non-todo issues
      if (issue.status !== 'todo') {
        activities.push({
          id: `act-status-${issue.id}`,
          type: 'status_change',
          actor: { id: issue.assignee?.id ?? 'system', name: issue.assignee?.name ?? 'System' },
          target: { type: 'issue', id: issue.id, title: issue.title },
          description: `将状态变更为 ${issue.status}`,
          timestamp: issue.updatedAt,
        })
      }
    }
    return sortAndLimitActivities(activities, 50)
  }, [issues])

  // 未选择项目时，直接显示绩效视图
  if (!currentProjectKey) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{t('dashboard.title')}</h1>
            <p className={styles.subtitle}>{t('dashboard.selectProjectHint')}</p>
          </div>
        </div>
        <PerformanceView projectKey={null} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('dashboard.title')}</h1>
          <p className={styles.subtitle}>
            {sprints.length > 0
              ? sprints.length === 1
                ? `${sprint!.name} · ${sprint!.startDate?.slice(0, 10)} ~ ${sprint!.endDate?.slice(0, 10)} · ${issues.length} ${t('dashboard.subtitle.tasks')}`
                : `${sprints.length} ${t('dashboard.subtitle.activeSprints')} · ${issues.length} ${t('dashboard.subtitle.tasks')}`
              : isLoading ? t('common.loading') : t('dashboard.noActiveSprint')}
          </p>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'global' ? styles.active : ''}`}
            onClick={() => handleTabChange('global')}
          >{t('dashboard.globalView')}</button>
          <button
            className={`${styles.tab} ${activeTab === 'personal' ? styles.active : ''}`}
            onClick={() => handleTabChange('personal')}
          >{t('dashboard.personalView')}</button>
          <button
            className={`${styles.tab} ${activeTab === 'performance' ? styles.active : ''}`}
            onClick={() => handleTabChange('performance')}
          >部门绩效</button>
          {sprint && (
            <button
              className={`${styles.tab} ${activeTab === 'release-notes' ? styles.active : ''}`}
              onClick={() => handleTabChange('release-notes')}
            >Release Notes</button>
          )}
          {currentUser?.role === 'PM' && (
            <button
              className={`${styles.tab} ${activeTab === 'decision' ? styles.active : ''}`}
              onClick={() => handleTabChange('decision')}
            >{t('dashboard.aiDecision')}</button>
          )}
        </div>
      </div>

      {/* AI 分析 */}
      {issues.length > 0 && (
        <AIInsight
          title={t('ai.insight')}
          buildPrompt={() => {
            const done = issues.filter(i => i.status === 'done').length
            const inProgress = issues.filter(i => i.status === 'in_progress').length
            const highRisks = risks.filter(r => r.level === 'high').length
            return `请分析以下项目 Dashboard 数据并给出关键洞察和建议：\n` +
              `- 项目: ${currentProjectKey}\n` +
              `- Sprint: ${sprint?.name ?? '无'}\n` +
              `- 总任务: ${issues.length}，已完成: ${done}，进行中: ${inProgress}\n` +
              `- 完成率: ${issues.length > 0 ? Math.round((done / issues.length) * 100) : 0}%\n` +
              `- 高风险: ${highRisks} 个\n` +
              `请用中文回答，简洁给出：1. 项目健康度评估 2. 关键风险提示 3. 建议行动`
          }}
        />
      )}

      {/* 错误 */}
      {error && (
        <div className={styles.errorBanner}>
          ⚠️ {t('dashboard.errorLoad')}：{(error as Error).message}
        </div>
      )}

      {/* 内容区 */}
      {!error && (
        <>
          {activeTab === 'global' && (
            <GlobalView
              sprint={sprint ?? null}
              sprints={sprints}
              issues={issues}
              risks={risks}
              teamLoad={teamLoad}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'personal' && (
            <PersonalView
              issues={issues}
              currentUser={currentUser}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'performance' && (
            <PerformanceView projectKey={currentProjectKey} />
          )}
          {activeTab === 'release-notes' && sprint && (
            <ReleaseNotesTab projectKey={currentProjectKey} />
          )}
          {activeTab === 'decision' && currentUser?.role === 'PM' && (
            <DecisionView risks={risks} issues={issues} />
          )}

          {/* Activity Feed — shows recent activities from sprint issues */}
          <div style={{ marginTop: 20 }}>
            <ActivityFeed activities={sampleActivities} />
          </div>
        </>
      )}
    </div>
  )
}

// AI 决策视图
function DecisionView({
  risks,
  issues,
}: {
  risks: ReturnType<typeof analyzeRisks>
  issues: PlatformIssue[]
}) {
  const { t } = useI18n()
  const highRisks = risks.filter(r => r.level === 'high')
  const mediumRisks = risks.filter(r => r.level === 'medium')
  const allIssues = issues ?? []
  const completedIssues = allIssues.filter((i: PlatformIssue) => i.status === 'done')
  const completionRate = allIssues.length > 0
    ? Math.round((completedIssues.length / allIssues.length) * 100)
    : 0

  return (
    <div>
      <div className={styles.decisionStats}>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: 'var(--primary)' }}>{completionRate}%</div>
          <div className={styles.statLabel}>{t('dashboard.completionRateLabel')}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: 'var(--danger)' }}>{highRisks.length}</div>
          <div className={styles.statLabel}>{t('dashboard.highRisk')}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: 'var(--warning)' }}>{mediumRisks.length}</div>
          <div className={styles.statLabel}>{t('dashboard.mediumRisk')}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: 'var(--success)' }}>
            {completedIssues.length}/{allIssues.length}
          </div>
          <div className={styles.statLabel}>{t('dashboard.completedTasks')}</div>
        </div>
      </div>

      {risks.length > 0 ? (
        <div className={styles.card}>
          <div className={styles.cardTitle}>⚡ {t('dashboard.pendingRisks')}</div>
          {risks.slice(0, 5).map(risk => (
            <div key={risk.id} className={`${styles.riskItem} ${styles[risk.level]}`}>
              <span className={styles.riskBadge}>
                {risk.level === 'high' ? `🔴 ${t('risk.high')}` : risk.level === 'medium' ? `🟡 ${t('risk.medium')}` : `🟢 ${t('risk.low')}`}
              </span>
              <span className={styles.riskDesc}>{risk.description}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.card} style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
          ✅ {t('dashboard.noRisks')}
        </div>
      )}
    </div>
  )
}
