import { useState, useCallback } from 'react'
import { useI18n } from '@/context/I18nContext'
import { useNotifications } from '@/context/NotificationContext'
import { validateRule, getPresetTemplates } from '@/lib/automationEngine'
import type { AutomationRule, ConditionType, ActionType } from '@/types/platform'

// ─── localStorage helpers ────────────────────────────────────

const STORAGE_KEY = 'ai-pm-automation-rules'

function loadRules(): AutomationRule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRules(rules: AutomationRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  } catch {
    // ignore
  }
}

// ─── Constants ───────────────────────────────────────────────

const CONDITION_TYPES: ConditionType[] = [
  'status_change', 'priority_change', 'timeout_no_update', 'assignee_change', 'scope_change',
]

const ACTION_TYPES: ActionType[] = [
  'send_wecom', 'change_status', 'assign_member', 'add_label', 'generate_report',
]

// ─── Main Component ─────────────────────────────────────────

export default function AutomationRules() {
  const { t } = useI18n()
  const { addNotification } = useNotifications()
  const [rules, setRules] = useState<AutomationRule[]>(loadRules)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formCondition, setFormCondition] = useState<ConditionType>('status_change')
  const [formAction, setFormAction] = useState<ActionType>('send_wecom')

  const presetTemplates = getPresetTemplates()

  const updateRules = useCallback((newRules: AutomationRule[]) => {
    setRules(newRules)
    saveRules(newRules)
  }, [])

  const handleAddRule = () => {
    const newRule: Partial<AutomationRule> = {
      name: formName,
      condition: { type: formCondition, params: {} },
      action: { type: formAction, params: {} },
    }
    const validation = validateRule(newRule)
    if (!validation.valid) {
      addNotification({
        type: 'system',
        title: '规则验证失败',
        message: validation.errors.join('; '),
        priority: 'normal',
      })
      return
    }
    const rule: AutomationRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: formName.trim(),
      enabled: true,
      condition: { type: formCondition, params: {} },
      action: { type: formAction, params: {} },
      createdAt: new Date().toISOString(),
      executionCount: 0,
    }
    updateRules([...rules, rule])
    setShowForm(false)
    setFormName('')
    setFormCondition('status_change')
    setFormAction('send_wecom')
  }

  const handleEnableTemplate = (template: AutomationRule) => {
    // Check if already enabled
    if (rules.some(r => r.id === template.id)) return
    const enabledTemplate = { ...template, enabled: true, createdAt: new Date().toISOString() }
    updateRules([...rules, enabledTemplate])
  }

  const handleToggleRule = (ruleId: string) => {
    updateRules(rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
  }

  const handleDeleteRule = (ruleId: string) => {
    updateRules(rules.filter(r => r.id !== ruleId))
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>{t('automation.title')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '8px 16px', background: 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
          }}
        >
          + {t('automation.addRule')}
        </button>
      </div>

      {/* Add Rule Form */}
      {showForm && (
        <div style={{
          padding: 16, background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 8, marginBottom: 20,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>
                {t('automation.ruleName')}
              </label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder={t('automation.ruleName')}
                style={{
                  width: '100%', padding: '8px 12px', border: '1px solid var(--border)',
                  borderRadius: 6, background: 'var(--bg)', color: 'var(--text)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>
                {t('automation.condition')}
              </label>
              <select
                value={formCondition}
                onChange={e => setFormCondition(e.target.value as ConditionType)}
                style={{
                  width: '100%', padding: '8px 12px', border: '1px solid var(--border)',
                  borderRadius: 6, background: 'var(--bg)', color: 'var(--text)',
                }}
              >
                {CONDITION_TYPES.map(ct => (
                  <option key={ct} value={ct}>{t(`automation.conditionTypes.${ct}` as any)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>
                {t('automation.action')}
              </label>
              <select
                value={formAction}
                onChange={e => setFormAction(e.target.value as ActionType)}
                style={{
                  width: '100%', padding: '8px 12px', border: '1px solid var(--border)',
                  borderRadius: 6, background: 'var(--bg)', color: 'var(--text)',
                }}
              >
                {ACTION_TYPES.map(at => (
                  <option key={at} value={at}>{t(`automation.actionTypes.${at}` as any)}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleAddRule}
            disabled={!formName.trim()}
            style={{
              padding: '8px 20px', background: formName.trim() ? 'var(--primary)' : 'var(--border)',
              color: '#fff', border: 'none', borderRadius: 6, cursor: formName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {t('automation.save')}
          </button>
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)' }}>
          {t('automation.noRules')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {rules.map(rule => (
            <div
              key={rule.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
                opacity: rule.enabled ? 1 : 0.6,
              }}
            >
              <label style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => handleToggleRule(rule.id)}
                  style={{ marginRight: 8 }}
                />
              </label>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{rule.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {t(`automation.conditionTypes.${rule.condition.type}` as any)} → {t(`automation.actionTypes.${rule.action.type}` as any)}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', minWidth: 60, textAlign: 'center' }}>
                {t('automation.execCount')}: {rule.executionCount}
              </div>
              <button
                onClick={() => handleDeleteRule(rule.id)}
                style={{
                  padding: '4px 10px', background: 'none', border: '1px solid var(--danger)',
                  color: 'var(--danger)', borderRadius: 4, cursor: 'pointer', fontSize: 12,
                }}
              >
                {t('automation.deleteRule')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preset Templates */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{t('automation.presetTemplates')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {presetTemplates.map(template => {
            const isEnabled = rules.some(r => r.id === template.id)
            return (
              <div
                key={template.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{template.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    {t(`automation.conditionTypes.${template.condition.type}` as any)} → {t(`automation.actionTypes.${template.action.type}` as any)}
                  </div>
                </div>
                <button
                  onClick={() => handleEnableTemplate(template)}
                  disabled={isEnabled}
                  style={{
                    padding: '6px 14px',
                    background: isEnabled ? 'var(--border)' : 'var(--success)',
                    color: '#fff', border: 'none', borderRadius: 4, cursor: isEnabled ? 'default' : 'pointer',
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  {isEnabled ? '✓' : t('automation.enableTemplate')}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
