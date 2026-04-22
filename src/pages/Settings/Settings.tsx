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

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>项目配置</div>
      <div className={styles.formRow}>
        <span className={styles.formLabel}>Board ID</span>
        <span className={styles.formValueMono}>
          {currentBoardId !== null ? String(currentBoardId) : '未配置'}
        </span>
      </div>
      <div className={styles.formRow}>
        <span className={styles.formLabel}>项目 Key</span>
        <span className={styles.formValue}>
          {currentProjectKey ?? <span style={{ color: 'var(--text2)' }}>未配置</span>}
        </span>
      </div>
      <div className={styles.formRow}>
        <span className={styles.formLabel}>说明</span>
        <span className={styles.formValue} style={{ color: 'var(--text2)', fontSize: 13 }}>
          Board ID 和项目 Key 通过环境变量 VITE_DEFAULT_BOARD_ID 配置
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
        showToast({ type: 'success', title: '✅ 连接成功', description: 'Jira 服务器连接正常' })
      } else {
        showToast({ type: 'error', title: '❌ 连接失败', description: '请检查 Jira 地址和认证配置' })
      }
    } catch (e) {
      setConnected(false)
      showToast({
        type: 'error',
        title: '❌ 连接失败',
        description: e instanceof Error ? e.message : '未知错误',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Jira 集成</div>
      <div className={styles.formRow}>
        <span className={styles.formLabel}>连接状态</span>
        {connected === null ? (
          <span className={styles.formValue} style={{ color: 'var(--text2)' }}>未检测</span>
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
        <span className={styles.formLabel}>Jira 地址</span>
        <span className={styles.formValueMono}>
          {jiraUrl ?? <span style={{ color: 'var(--text2)' }}>未配置（VITE_JIRA_BASE_URL）</span>}
        </span>
      </div>
      <div className={styles.formRow}>
        <span className={styles.formLabel}>最后同步</span>
        <span className={styles.formValue}>{lastSync}</span>
      </div>
      <div className={styles.formRow}>
        <span className={styles.formLabel} />
        <button
          className={styles.btnPrimary}
          onClick={handleTestConnection}
          disabled={testing}
        >
          {testing ? '测试中…' : t('settings.testConnection')}
        </button>
      </div>
    </div>
  )
}

// ─── Notifications Tab ───────────────────────────────────────

function NotificationsTab() {
  const [highRisk, setHighRisk] = useState(() => readBool(LS_NOTIF_HIGH, true))
  const [daily, setDaily] = useState(() => readBool(LS_NOTIF_DAILY, true))
  const [weekly, setWeekly] = useState(() => readBool(LS_NOTIF_WEEKLY, false))

  useEffect(() => { writeBool(LS_NOTIF_HIGH, highRisk) }, [highRisk])
  useEffect(() => { writeBool(LS_NOTIF_DAILY, daily) }, [daily])
  useEffect(() => { writeBool(LS_NOTIF_WEEKLY, weekly) }, [weekly])

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>通知设置</div>

      <div className={styles.toggleRow}>
        <div className={styles.toggleInfo}>
          <div className={styles.toggleLabel}>高危风险推送</div>
          <div className={styles.toggleDesc}>检测到高危风险时自动推送企业微信</div>
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
          <div className={styles.toggleLabel}>日报推送</div>
          <div className={styles.toggleDesc}>每天下班前自动推送日报至企业微信</div>
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
          <div className={styles.toggleLabel}>周报推送</div>
          <div className={styles.toggleDesc}>每周五下午自动推送周报至企业微信</div>
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
  { feature: '查看 Sprint 看板', pm: true, dev: true },
  { feature: '管理 Sprint（创建/关闭）', pm: true, dev: false },
  { feature: '查看需求列表', pm: true, dev: true },
  { feature: '创建/编辑需求', pm: true, dev: false },
  { feature: '查看风险看板', pm: true, dev: true },
  { feature: '推送风险通知', pm: true, dev: false },
  { feature: '查看报告', pm: true, dev: true },
  { feature: '推送报告', pm: true, dev: false },
  { feature: '修改项目配置', pm: true, dev: false },
  { feature: '管理 Jira 集成', pm: true, dev: false },
]

function PermissionsTab() {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>权限管理</div>
      <table className={styles.permTable}>
        <thead>
          <tr>
            <th>功能</th>
            <th>PM</th>
            <th>DEV</th>
          </tr>
        </thead>
        <tbody>
          {PERMISSIONS.map((row) => (
            <tr key={row.feature}>
              <td>{row.feature}</td>
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
          <div className={styles.subtitle}>项目配置与集成管理</div>
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
