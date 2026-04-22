import type { PlatformIssue, CurrentUser } from '@/types/platform'
import { useI18n } from '@/context/I18nContext'
import styles from './Dashboard.module.css'

const JIRA_BASE_URL = import.meta.env.VITE_JIRA_BASE_URL || ''

interface Props {
  issues: PlatformIssue[]
  currentUser: CurrentUser
  isLoading: boolean
}

const PRIORITY_COLOR: Record<string, string> = {
  P0: 'var(--danger)',
  P1: 'var(--warning)',
  P2: 'var(--primary)',
  P3: 'var(--text2)',
}

export default function PersonalView({ issues, currentUser, isLoading }: Props) {
  const { t } = useI18n()
  // 过滤当前用户的任务（按名字匹配，实际应按 accountId）
  const myIssues = issues.filter(
    i => i.assignee?.name === currentUser.name || i.assignee?.name.includes(currentUser.name)
  )

  const myActive = myIssues.filter(i => i.status !== 'done')
  const myDone = myIssues.filter(i => i.status === 'done')
  const myBlocked = myIssues.filter(i => !i.assignee && i.status !== 'done')

  if (isLoading) {
    return (
      <div className={styles.personalGrid}>
        {[1, 2].map(i => (
          <div key={i} className={styles.card}>
            <div className={`${styles.skeleton}`} style={{ height: 200 }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className={styles.personalGrid}>
        {/* 我的任务 */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            {t('dashboard.myTasks')}
            <span className={`${styles.tag} ${styles.tagDefault}`}>{myIssues.length} 条</span>
          </div>
          {myIssues.length > 0 ? (
            <table className={styles.taskTable}>
              <thead>
                <tr>
                  <th>{t('req.priority')}</th>
                  <th>{t('req.id')}</th>
                  <th>{t('req.title2')}</th>
                  <th>{t('req.status')}</th>
                </tr>
              </thead>
              <tbody>
                {myIssues.map(issue => (
                  <tr key={issue.id}>
                    <td>
                      <span style={{ color: PRIORITY_COLOR[issue.priority], fontWeight: 600, fontSize: 12 }}>
                        {issue.priority}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {JIRA_BASE_URL
                        ? <a href={`${JIRA_BASE_URL}/browse/${issue.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>{issue.id}</a>
                        : <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{issue.id}</span>
                      }
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {issue.title}
                    </td>
                    <td>
                      <span className={`${styles.tag} ${issue.status === 'done' ? styles.tagSuccess : issue.status === 'in_progress' ? styles.tagInfo : styles.tagDefault}`}>
                        {issue.status === 'done' ? t('common.completed') : issue.status === 'in_progress' ? t('common.inProgress') : issue.status === 'in_review' ? t('common.inReview') : issue.status === 'in_testing' ? t('common.inTesting') : t('common.todo')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)' }}>
              当前 Sprint 暂无分配给你的任务
            </div>
          )}
        </div>

        {/* 待我处理 */}
        <div>
          <div className={styles.card} style={{ marginBottom: 16 }}>
            <div className={styles.cardTitle}>{t('dashboard.pendingItems')}</div>
            <div style={{ fontSize: 13, lineHeight: 2.2 }}>
              <div>⚡ {t('common.inProgress')} <strong>{myActive.length}</strong> 个</div>
              <div>✅ {t('common.completed')} <strong>{myDone.length}</strong> 个</div>
              <div>📋 {t('common.todo')} <strong>{myIssues.filter(i => i.status === 'todo').length}</strong> 个</div>
              {myBlocked.length > 0 && (
                <div style={{ color: 'var(--danger)' }}>⚠️ {t('common.unassigned')} <strong>{myBlocked.length}</strong> 个</div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>{t('dashboard.myProgress')}</div>
            <div style={{ fontSize: 13 }}>
              本 Sprint 完成率：
              <strong style={{ color: 'var(--primary)' }}>
                {myIssues.length > 0 ? Math.round((myDone.length / myIssues.length) * 100) : 0}%
              </strong>
            </div>
            <div className={styles.progressBar} style={{ marginTop: 8 }}>
              <div
                className={styles.progressFill}
                style={{
                  width: myIssues.length > 0 ? `${(myDone.length / myIssues.length) * 100}%` : '0%'
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
              {myDone.length} / {myIssues.length} 个任务
            </div>
          </div>
        </div>
      </div>

      {/* 所有进行中任务 */}
      {myActive.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>{t('dashboard.activeIssues')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myActive.map(issue => (
              <div key={issue.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px',
                background: issue.priority === 'P0' ? '#fff8f8' : '#fafafa',
                borderRadius: 6,
                borderLeft: `3px solid ${PRIORITY_COLOR[issue.priority]}`,
              }}>
                <div>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12, marginRight: 8 }}>
                    {JIRA_BASE_URL
                      ? <a href={`${JIRA_BASE_URL}/browse/${issue.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{issue.id}</a>
                      : issue.id
                    }
                  </span>
                  <span style={{ fontSize: 13 }}>{issue.title}</span>
                </div>
                <span className={`${styles.tag} ${issue.status === 'in_progress' ? styles.tagInfo : styles.tagDefault}`}>
                  {issue.status === 'in_progress' ? t('common.inProgress') : issue.status === 'in_review' ? t('common.inReview') : issue.status === 'in_testing' ? t('common.inTesting') : t('common.todo')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
