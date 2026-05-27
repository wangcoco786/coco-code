import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { useI18n } from '@/context/I18nContext'
import { useTheme } from '@/context/ThemeContext'
import { jiraClient } from '@/lib/jiraClient'
import { getHardcodedExcluded, getStoredExcludedUsers, addExcludedUser, removeExcludedUser } from '@/lib/excludedUsers'
import styles from './Settings.module.css'

// ─── helpers ────────────────────────────────────────────────

type SettingsTab = 'project' | 'jira' | 'notifications' | 'appearance' | 'permissions' | 'excluded'

const LS_NOTIF_HIGH = 'ai_pm_notif_high_risk'
const LS_NOTIF_DAILY = 'ai_pm_notif_daily'
const LS_NOTIF_WEEKLY = 'ai_pm_notif_weekly'

function readBool(key: string, defaultVal = true): boolean {
  try {
    const v = localStorage.getItem(key)
    return v === null ? defaultVal : v === 'true'
  } catch {
    return defaultVal
  }
}

function writeBool(key: string, val: boolean) {
  try {
    localStorage.setItem(key, String(val))
  } catch {
    // ignore
  }
}

// ─── Project Config Tab ──────────────────────────────────────

function ProjectTab() {
  const { currentBoardId, currentProjectKey } = useApp()
  const { t } = useI18n()

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>{t('settings.projectConfig')}</div>
      <div className={styles.formRow}>
        <span className={styles.formLabel}>{t('settings.boardId')}</span>
        <span className={styles.formValueMono}>
          {currentBoardId !== null ? String(currentBoardId) : t('settings.notConfigured')}
        </span>
      </div>
      <div className={styles.formRow}>
        <span className={styles.formLabel}>{t('settings.projectKey')}</span>
        <span className={styles.formValue}>
          {currentProjectKey ?? <span style={{ color: 'var(--text2)' }}>{t('settings.notConfigured')}</span>}
        </span>
      </div>
      <div className={styles.formRow}>
        <span className={styles.formLabel}></span>
        <span className={styles.formValue} style={{ color: 'var(--text2)', fontSize: 13 }}>
          {t('settings.configDesc')}
        </span>
      </div>
    </div>
  )
}

// ─── Jira Integration Tab ────────────────────────────────────

function JiraTab() {
  const { showToast } = useToast()
  const { t } = useI18n()
  const [connected, setConnected] = useState<boolean | null>(null)
  const [testing, setTesting] = useState(false)
  const [lastSync, setLastSync] = useState<string>(() => {
    try {
      return localStorage.getItem('ai_pm_last_sync') ?? '—'
    } catch {
      return '—'
    }
  })

  const jiraUrl = import.meta.env.VITE_JIRA_BASE_URL as string | undefined

  async function handleTestConnection() {
    setTesting(true)
    try {
      const ok = await jiraClient.testConnection()
      setConnected(ok)
      if (ok) {
        const now = new Date().toLocaleString('zh-CN')
        try { localStorage.setItem('ai_pm_last_sync', now) } catch { /* ignore */ }
        setLastSync(now)
        showToast({ type: 'success', title: t('toast.connectSuccess'), description: t('toast.connectSuccessDesc') })
      } else {
        showToast({ type: 'error', title: t('toast.connectFail'), description: t('toast.connectFailDesc') })
      }
    } catch (e) {
      setConnected(false)
      showToast({
        type: 'error',
        title: t('toast.connectFail'),
        description: e instanceof Error ? e.message : t('common.error'),
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <>
      {/* 同步状态 Section */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>{t('settings.syncStatus' as any)}</div>
        <div className={styles.formRow}>
          <span className={styles.formLabel}>{t('settings.syncIndicator' as any)}</span>
          {connected === null ? (
            <span className={`${styles.statusBadge}`} style={{ background: '#f5f5f5', color: 'var(--text2)' }}>
              <span className={styles.statusDot} style={{ background: 'var(--text2)' }} />
              {t('settings.notTested')}
            </span>
          ) : connected ? (
            <span className={`${styles.statusBadge} ${styles.statusConnected}`}>
              <span className={styles.statusDot} />
              {t('settings.connected')}
            </span>
          ) : (
            <span className={`${styles.statusBadge} ${styles.statusDisconnected}`}>
              <span className={styles.statusDot} />
              {t('settings.disconnected')}
            </span>
          )}
        </div>
        <div className={styles.formRow}>
          <span className={styles.formLabel}>{t('settings.lastSync')}</span>
          <span className={styles.formValue}>{lastSync}</span>
        </div>
      </div>

      {/* Jira Integration Details */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>{t('settings.jiraIntegration')}</div>
        <div className={styles.formRow}>
          <span className={styles.formLabel}>{t('settings.connectionStatus')}</span>
          {connected === null ? (
            <span className={styles.formValue} style={{ color: 'var(--text2)' }}>{t('settings.notTested')}</span>
          ) : connected ? (
            <span className={`${styles.statusBadge} ${styles.statusConnected}`}>
              <span className={styles.statusDot} />
              {t('settings.connected')}
            </span>
          ) : (
            <span className={`${styles.statusBadge} ${styles.statusDisconnected}`}>
              <span className={styles.statusDot} />
              {t('settings.disconnected')}
            </span>
          )}
        </div>
        <div className={styles.formRow}>
          <span className={styles.formLabel}>{t('settings.jiraUrl')}</span>
          <span className={styles.formValueMono}>
            {jiraUrl ?? <span style={{ color: 'var(--text2)' }}>{t('settings.notConfigured')}（VITE_JIRA_BASE_URL）</span>}
          </span>
        </div>
        <div className={styles.formRow}>
          <span className={styles.formLabel}>{t('settings.lastSync')}</span>
          <span className={styles.formValue}>{lastSync}</span>
        </div>
        <div className={styles.formRow}>
          <span className={styles.formLabel} />
          <button
            className={styles.btnPrimary}
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? t('settings.testing') : t('settings.testConnection')}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Notifications Tab ───────────────────────────────────────

function NotificationsTab() {
  const { t } = useI18n()
  const [highRisk, setHighRisk] = useState(() => readBool(LS_NOTIF_HIGH, true))
  const [daily, setDaily] = useState(() => readBool(LS_NOTIF_DAILY, true))
  const [weekly, setWeekly] = useState(() => readBool(LS_NOTIF_WEEKLY, false))

  useEffect(() => { writeBool(LS_NOTIF_HIGH, highRisk) }, [highRisk])
  useEffect(() => { writeBool(LS_NOTIF_DAILY, daily) }, [daily])
  useEffect(() => { writeBool(LS_NOTIF_WEEKLY, weekly) }, [weekly])

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>{t('settings.notifSettings')}</div>

      <div className={styles.toggleRow}>
        <div className={styles.toggleInfo}>
          <div className={styles.toggleLabel}>{t('settings.highRiskPush')}</div>
          <div className={styles.toggleDesc}>{t('settings.highRiskPushDesc')}</div>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={highRisk}
            onChange={(e) => setHighRisk(e.target.checked)}
          />
          <span className={styles.toggleSlider} />
        </label>
      </div>

      <div className={styles.toggleRow}>
        <div className={styles.toggleInfo}>
          <div className={styles.toggleLabel}>{t('settings.dailyPush')}</div>
          <div className={styles.toggleDesc}>{t('settings.dailyPushDesc')}</div>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={daily}
            onChange={(e) => setDaily(e.target.checked)}
          />
          <span className={styles.toggleSlider} />
        </label>
      </div>

      <div className={styles.toggleRow}>
        <div className={styles.toggleInfo}>
          <div className={styles.toggleLabel}>{t('settings.weeklyPush')}</div>
          <div className={styles.toggleDesc}>{t('settings.weeklyPushDesc')}</div>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={weekly}
            onChange={(e) => setWeekly(e.target.checked)}
          />
          <span className={styles.toggleSlider} />
        </label>
      </div>
    </div>
  )
}

// ─── Appearance Tab ──────────────────────────────────────────

function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()

  const themeOptions: { value: 'light' | 'dark' | 'system'; labelKey: 'settings.themeLight' | 'settings.themeDark' | 'settings.themeSystem'; icon: string }[] = [
    { value: 'light', labelKey: 'settings.themeLight', icon: '☀️' },
    { value: 'dark', labelKey: 'settings.themeDark', icon: '🌙' },
    { value: 'system', labelKey: 'settings.themeSystem', icon: '💻' },
  ]

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>{t('settings.appearance')}</div>
      <div className={styles.formRow}>
        <span className={styles.formLabel}>{t('settings.themeMode')}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {themeOptions.map(opt => (
            <button
              key={opt.value}
              className={theme === opt.value ? styles.btnPrimary : styles.btnDefault}
              onClick={() => setTheme(opt.value)}
              style={{ minWidth: 90 }}
            >
              {opt.icon} {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.formRow}>
        <span className={styles.formLabel} />
        <span className={styles.formValue} style={{ color: 'var(--text2)', fontSize: 13 }}>
          {t('settings.themeDesc')}
        </span>
      </div>
    </div>
  )
}

// ─── Permissions Tab ─────────────────────────────────────────

const PERMISSIONS = [
  { featureKey: 'settings.perm.viewSprint', pm: true, dev: true },
  { featureKey: 'settings.perm.manageSprint', pm: true, dev: false },
  { featureKey: 'settings.perm.viewReqs', pm: true, dev: true },
  { featureKey: 'settings.perm.editReqs', pm: true, dev: false },
  { featureKey: 'settings.perm.viewRisk', pm: true, dev: true },
  { featureKey: 'settings.perm.pushRisk', pm: true, dev: false },
  { featureKey: 'settings.perm.viewReports', pm: true, dev: true },
  { featureKey: 'settings.perm.pushReports', pm: true, dev: false },
  { featureKey: 'settings.perm.editConfig', pm: true, dev: false },
  { featureKey: 'settings.perm.manageJira', pm: true, dev: false },
]

function PermissionsTab() {
  const { t } = useI18n()
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>{t('settings.permManagement')}</div>
      <table className={styles.permTable}>
        <thead>
          <tr>
            <th>{t('settings.feature')}</th>
            <th>{t('settings.pm')}</th>
            <th>{t('settings.dev')}</th>
          </tr>
        </thead>
        <tbody>
          {PERMISSIONS.map((row) => (
            <tr key={row.featureKey}>
              <td>{t(row.featureKey as any)}</td>
              <td>
                {row.pm
                  ? <span className={styles.permCheck}>✓</span>
                  : <span className={styles.permCross}>✗</span>}
              </td>
              <td>
                {row.dev
                  ? <span className={styles.permCheck}>✓</span>
                  : <span className={styles.permCross}>✗</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export default function Settings() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<SettingsTab>('project')

  const settingsTabs: { key: SettingsTab; label: string }[] = [
    { key: 'project', label: t('settings.project') },
    { key: 'jira', label: t('settings.jira') },
    { key: 'notifications', label: t('settings.notifications') },
    { key: 'appearance', label: t('settings.appearance') },
    { key: 'permissions', label: t('settings.permissions') },
    { key: 'excluded', label: '排除人员' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('settings.title')}</h1>
          <div className={styles.subtitle}>{t('settings.subtitle')}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {settingsTabs.map((tab) => (
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
      {activeTab === 'project' && <ProjectTab />}
      {activeTab === 'jira' && <JiraTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'appearance' && <AppearanceTab />}
      {activeTab === 'permissions' && <PermissionsTab />}
      {activeTab === 'excluded' && <ExcludedUsersTab />}
    </div>
  )
}

// ─── Excluded Users Tab ─────────────────────────────────────

function ExcludedUsersTab() {
  const [storedUsers, setStoredUsers] = useState<string[]>(getStoredExcludedUsers())
  const [inputValue, setInputValue] = useState('')
  const hardcoded = getHardcodedExcluded()

  const handleAdd = () => {
    const name = inputValue.trim()
    if (!name) return
    addExcludedUser(name)
    setStoredUsers(getStoredExcludedUsers())
    setInputValue('')
  }

  const handleRemove = (name: string) => {
    removeExcludedUser(name)
    setStoredUsers(getStoredExcludedUsers())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>排除人员管理</div>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
        已排除的人员不会出现在资源视图和绩效页面中。输入人员姓名（与 Jira 显示一致）添加。
      </p>

      {/* 添加输入框 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入要排除的人员姓名..."
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            outline: 'none',
            background: 'var(--bg)',
            color: 'var(--text)',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--primary)',
            color: '#fff',
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            fontSize: 13,
            opacity: inputValue.trim() ? 1 : 0.5,
          }}
        >
          添加
        </button>
      </div>

      {/* 系统默认排除 */}
      {hardcoded.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>系统默认排除</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {hardcoded.map(name => (
              <span key={name} style={{
                padding: '4px 12px',
                borderRadius: 16,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                fontSize: 12,
                color: 'var(--text2)',
              }}>
                {name} <span style={{ opacity: 0.5 }}>(内置)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 用户自定义排除 */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>自定义排除</div>
        {storedUsers.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>暂无自定义排除人员</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {storedUsers.map(name => (
              <span key={name} style={{
                padding: '4px 12px',
                borderRadius: 16,
                background: 'var(--danger-light)',
                border: '1px solid var(--danger-border)',
                fontSize: 12,
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                {name}
                <button
                  onClick={() => handleRemove(name)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: 'var(--danger)',
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title="移除"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
