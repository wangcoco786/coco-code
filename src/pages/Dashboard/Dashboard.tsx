import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useActiveSprintIssuesByProject, useActiveSprintsByProject } from '@/hooks/useProjectIssues'
import { analyzeRisks, calculateTeamLoad } from '@/lib/riskEngine'
import { useI18n } from '@/context/I18nContext'
import AIInsight from '@/components/AIInsight/AIInsight'
import GlobalView from './GlobalView'
import PersonalView from './PersonalView'
import styles from './Dashboard.module.css'

type DashTab = 'global' | 'personal' | 'decision'

export default function Dashboard() {
  const { currentUser, currentProjectKey } = useApp()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<DashTab>(
    currentUser.role === 'DEV' ? 'personal' : 'global'
  )

  const { data: sprints = [] } = useActiveSprintsByProject(currentProjectKey)
  const sprint = sprints[0] ?? null  // Dashboard 显示第一个 Sprint
  const { data: issues = [], isLoading: rawLoading, error } = useActiveSprintIssuesByProject(currentProjectKey)
  const isLoading = rawLoading && !!currentProjectKey

  const risks = analyzeRisks(issues)
  const teamLoad = calculateTeamLoad(issues, {})

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('dashboard.title')}</h1>
          <p className={styles.subtitle}>
            {sprints.length > 0
              ? sprints.length === 1
                ? `${sprint!.name} · ${sprint!.startDate?.slice(0, 10)} ~ ${sprint!.endDate?.slice(0, 10)} · ${issues.length} 个任务`
                : `${sprints.length} 个活跃 Sprint · 共 ${issues.length} 个任务`
              : currentProjectKey
              ? isLoading ? t('common.loading') : t('dashboard.noActiveSprint')
              : t('dashboard.selectProjectHint')}
          </p>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'global' ? styles.active : ''}`}
            onClick={() => setActiveTab('global')}
          >{t('dashboard.globalView')}</button>
          <button
            className={`${styles.tab} ${activeTab === 'personal' ? styles.active : ''}`}
            onClick={() => setActiveTab('personal')}
          >{t('dashboard.personalView')}</button>
          {currentUser.role === 'PM' && (
            <button
              className={`${styles.tab} ${activeTab === 'decision' ? styles.active : ''}`}
              onClick={() => setActiveTab('decision')}
            >{t('dashboard.aiDecision')}</button>
          )}
        </div>
      </div>

      {/* AI 分析 */}
      {currentProjectKey && issues.length > 0 && (
        <AIInsight
          title="AI 项目洞察"
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

      {/* 未选择项目 */}
      {!currentProjectKey && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <div className={styles.emptyTitle}>请选择项目</div>
          <div className={styles.emptyDesc}>在顶部导航栏选择一个 Jira 项目，即可查看数据</div>
        </div>
      )}

      {/* 错误 */}
      {error && currentProjectKey && (
        <div className={styles.errorBanner}>
          ⚠️ 数据加载失败：{(error as Error).message}
        </div>
      )}

      {/* 内容区 */}
      {currentProjectKey && !error && (
        <>
          {activeTab === 'global' && (
            <GlobalView
              sprint={sprint ?? null}
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
          {activeTab === 'decision' && currentUser.role === 'PM' && (
            <DecisionView risks={risks} issues={issues} />
          )}
        </>
      )}
    </div>
  )
}

import type { PlatformIssue } from '@/types/platform'

// AI 决策视图
function DecisionView({
  risks,
  issues,
}: {
  risks: ReturnType<typeof analyzeRisks>
  issues: PlatformIssue[]
}) {
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
          <div className={styles.statLabel}>完成率</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: 'var(--danger)' }}>{highRisks.length}</div>
          <div className={styles.statLabel}>高危风险</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: 'var(--warning)' }}>{mediumRisks.length}</div>
          <div className={styles.statLabel}>中危风险</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: 'var(--success)' }}>
            {completedIssues.length}/{allIssues.length}
          </div>
          <div className={styles.statLabel}>已完成任务</div>
        </div>
      </div>

      {risks.length > 0 ? (
        <div className={styles.card}>
          <div className={styles.cardTitle}>⚡ 待处理风险</div>
          {risks.slice(0, 5).map(risk => (
            <div key={risk.id} className={`${styles.riskItem} ${styles[risk.level]}`}>
              <span className={styles.riskBadge}>
                {risk.level === 'high' ? '🔴 高危' : risk.level === 'medium' ? '🟡 中危' : '🟢 低危'}
              </span>
              <span className={styles.riskDesc}>{risk.description}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.card} style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
          ✅ 当前无风险
        </div>
      )}
    </div>
  )
}
