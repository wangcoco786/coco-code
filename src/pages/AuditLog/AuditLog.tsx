import { useState, useMemo, useEffect } from 'react'
import { useI18n } from '@/context/I18nContext'
import { filterAuditLogs, exportToCSV } from '@/lib/auditEngine'
import type { AuditLogEntry } from '@/types/platform'
import styles from './AuditLog.module.css'

// ─── localStorage persistence ───────────────────────────────

const AUDIT_STORAGE_KEY = 'ai-pm-audit-logs'

function loadAuditLogs(): AuditLogEntry[] {
  try {
    const stored = localStorage.getItem(AUDIT_STORAGE_KEY)
    if (stored) {
      const logs = JSON.parse(stored) as AuditLogEntry[]
      // Remove legacy seed data (IDs starting with 'audit-00')
      const cleaned = logs.filter(l => !l.id.startsWith('audit-00'))
      if (cleaned.length !== logs.length) {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(cleaned))
      }
      return cleaned
    }
  } catch { /* ignore parse errors */ }
  return []
}

function saveAuditLogs(logs: AuditLogEntry[]): void {
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs))
}

// ─── Operation type labels ──────────────────────────────────

const OPERATION_TYPES = [
  'config_modify',
  'permission_change',
  'status_change',
  'assignee_change',
  'bulk_delete',
  'role_change',
  'integration_modify',
] as const

export default function AuditLog() {
  const { t } = useI18n()
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [operatorFilter, setOperatorFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Load from localStorage on mount
  useEffect(() => {
    setAuditLogs(loadAuditLogs())
  }, [])

  // Persist whenever logs change (after initial load)
  useEffect(() => {
    if (auditLogs.length > 0) {
      saveAuditLogs(auditLogs)
    }
  }, [auditLogs])

  const filteredLogs = useMemo(() => {
    const filters: Parameters<typeof filterAuditLogs>[1] = {}
    if (startDate && endDate) {
      filters.timeRange = { start: startDate, end: endDate }
    }
    if (operatorFilter) {
      filters.operator = operatorFilter
    }
    if (typeFilter) {
      filters.operationType = typeFilter
    }
    return filterAuditLogs(auditLogs, filters)
  }, [auditLogs, startDate, endDate, operatorFilter, typeFilter])

  // Extract unique operators for filter dropdown
  const operators = useMemo(() => {
    const names = new Set<string>()
    auditLogs.forEach(log => names.add(log.operator.name))
    return Array.from(names)
  }, [auditLogs])

  function handleExportCSV() {
    const csv = exportToCSV(filteredLogs)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function resetFilters() {
    setStartDate('')
    setEndDate('')
    setOperatorFilter('')
    setTypeFilter('')
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('audit.title' as any)}</h1>
          <div className={styles.subtitle}>{t('audit.subtitle' as any)}</div>
        </div>
        <button className={styles.btnPrimary} onClick={handleExportCSV}>
          📥 {t('audit.exportCsv' as any)}
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t('audit.timeRange' as any)}</label>
          <input
            type="date"
            className={styles.dateInput}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className={styles.filterSep}>~</span>
          <input
            type="date"
            className={styles.dateInput}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t('audit.operator' as any)}</label>
          <select
            className={styles.select}
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
          >
            <option value="">{t('common.all')}</option>
            {operators.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t('audit.operationType' as any)}</label>
          <select
            className={styles.select}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">{t('common.all')}</option>
            {OPERATION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <button className={styles.btnReset} onClick={resetFilters}>
          {t('common.reset')}
        </button>
      </div>

      {/* Results count */}
      <div className={styles.resultCount}>
        {t('audit.totalRecords' as any)}: {filteredLogs.length}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('audit.time' as any)}</th>
              <th>{t('audit.operator' as any)}</th>
              <th>{t('audit.operationType' as any)}</th>
              <th>{t('audit.target' as any)}</th>
              <th>{t('audit.changes' as any)}</th>
              <th>{t('audit.priority' as any)}</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className={styles.timeCell}>
                    {new Date(log.timestamp).toLocaleString('zh-CN')}
                  </td>
                  <td>
                    <span className={styles.operatorBadge}>
                      {log.operator.name}
                      <span className={styles.roleBadge}>{log.operator.role}</span>
                    </span>
                  </td>
                  <td>{log.operationType}</td>
                  <td>
                    <span className={styles.targetInfo}>
                      [{log.target.type}] {log.target.name}
                    </span>
                  </td>
                  <td>
                    {log.changes.map((c, i) => (
                      <div key={i} className={styles.changeItem}>
                        <span className={styles.changeField}>{c.field}:</span>
                        <span className={styles.changeOld}>{String(c.oldValue)}</span>
                        <span className={styles.changeArrow}>→</span>
                        <span className={styles.changeNew}>{String(c.newValue)}</span>
                      </div>
                    ))}
                  </td>
                  <td>
                    <span className={`${styles.priorityBadge} ${log.priority === 'high' ? styles.priorityHigh : styles.priorityNormal}`}>
                      {log.priority === 'high' ? '🔴' : '🟢'} {log.priority}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
