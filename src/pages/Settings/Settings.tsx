import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { useI18n } from '@/context/I18nContext'
import { jiraClient } from '@/lib/jiraClient'
import styles from './Settings.module.css'

// ─── helpers ────────────────────────────────────────────────

type SettingsTab = 'project' | 'jira' | 'notifications' | 'permissions'

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
  const [lastSync] = useState<string>(() => {
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
    { key: 'permissions', label: t('settings.permissions') },
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
      {activeTab === 'permissions' && <PermissionsTab />}
    </div>
  )
}
