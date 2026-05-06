import type { AuditLogEntry, UserRole } from '@/types/platform'

// ─── Constants ──────────────────────────────────────────────

export const SENSITIVE_OPERATIONS = [
  'permission_change',
  'config_modify',
  'bulk_delete',
  'role_change',
  'integration_modify',
] as const

// ─── Core Functions ─────────────────────────────────────────

/**
 * Creates an audit log entry with generated id, timestamp, and priority based on sensitivity.
 */
export function createAuditEntry(operation: {
  type: string
  operator: AuditLogEntry['operator']
  target: AuditLogEntry['target']
  changes: AuditLogEntry['changes']
  metadata?: Record<string, unknown>
}): AuditLogEntry {
  return {
    id: generateAuditId(),
    operationType: operation.type,
    operator: operation.operator,
    timestamp: new Date().toISOString(),
    target: operation.target,
    changes: operation.changes,
    priority: isSensitiveOperation(operation.type) ? 'high' : 'normal',
    metadata: operation.metadata,
  }
}

/**
 * Checks if an operation type is in the sensitive operations list.
 */
export function isSensitiveOperation(operationType: string): boolean {
  return (SENSITIVE_OPERATIONS as readonly string[]).includes(operationType)
}

/**
 * Filters audit logs by time range, operator, and operation type.
 * All specified criteria must match (AND logic).
 */
export function filterAuditLogs(
  logs: AuditLogEntry[],
  filters: {
    timeRange?: { start: string; end: string }
    operator?: string
    operationType?: string
  }
): AuditLogEntry[] {
  return logs.filter((log) => {
    // Time range filter
    if (filters.timeRange) {
      const logTime = new Date(log.timestamp).getTime()
      const startTime = new Date(filters.timeRange.start).getTime()
      const endTime = new Date(filters.timeRange.end).getTime()
      if (logTime < startTime || logTime > endTime) return false
    }

    // Operator filter
    if (filters.operator) {
      if (log.operator.id !== filters.operator && log.operator.name !== filters.operator) {
        return false
      }
    }

    // Operation type filter
    if (filters.operationType) {
      if (log.operationType !== filters.operationType) return false
    }

    return true
  })
}

/**
 * Exports audit log entries to CSV format.
 */
export function exportToCSV(logs: AuditLogEntry[]): string {
  const headers = [
    'id',
    'operationType',
    'operatorId',
    'operatorName',
    'operatorRole',
    'timestamp',
    'targetType',
    'targetId',
    'targetName',
    'changes',
    'priority',
  ]

  const rows = logs.map((log) => {
    const changesJson = JSON.stringify(log.changes).replace(/"/g, '""')
    return [
      log.id,
      log.operationType,
      log.operator.id,
      log.operator.name,
      log.operator.role,
      log.timestamp,
      log.target.type,
      log.target.id,
      log.target.name,
      `"${changesJson}"`,
      log.priority,
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Parses CSV back to audit log entries.
 */
export function parseCSV(csv: string): AuditLogEntry[] {
  const lines = csv.split('\n')
  if (lines.length < 2) return []

  // Skip header line
  const dataLines = lines.slice(1).filter((line) => line.trim().length > 0)

  return dataLines.map((line) => {
    const fields = parseCSVLine(line)
    const changesStr = fields[9] || '[]'
    let changes: AuditLogEntry['changes'] = []
    try {
      changes = JSON.parse(changesStr)
    } catch {
      changes = []
    }

    return {
      id: fields[0] || '',
      operationType: fields[1] || '',
      operator: {
        id: fields[2] || '',
        name: fields[3] || '',
        role: (fields[4] || 'DEV') as UserRole,
      },
      timestamp: fields[5] || '',
      target: {
        type: fields[6] || '',
        id: fields[7] || '',
        name: fields[8] || '',
      },
      changes,
      priority: (fields[10] || 'normal') as 'high' | 'normal',
    }
  })
}

// ─── Helpers ────────────────────────────────────────────────

let auditCounter = 0

function generateAuditId(): string {
  auditCounter++
  return `audit-${Date.now()}-${auditCounter}-${Math.random().toString(36).substring(2, 8)}`
}

/**
 * Parses a single CSV line, handling quoted fields with escaped quotes.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++
        } else {
          // End of quoted field
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        fields.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }
  fields.push(current)

  return fields
}
