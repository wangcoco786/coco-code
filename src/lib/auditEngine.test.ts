import { describe, it, expect } from 'vitest'
import {
  createAuditEntry,
  isSensitiveOperation,
  filterAuditLogs,
  exportToCSV,
  parseCSV,
  SENSITIVE_OPERATIONS,
} from './auditEngine'
import type { AuditLogEntry } from '@/types/platform'

// ─── Helpers ────────────────────────────────────────────────

function makeAuditEntry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: 'audit-1',
    operationType: 'status_change',
    operator: { id: 'user-1', name: 'Alice', role: 'PM' },
    timestamp: '2025-01-15T10:00:00Z',
    target: { type: 'issue', id: 'DTS-1', name: 'Test Issue' },
    changes: [{ field: 'status', oldValue: 'todo', newValue: 'in_progress' }],
    priority: 'normal',
    ...overrides,
  }
}

// ─── createAuditEntry ───────────────────────────────────────

describe('createAuditEntry', () => {
  it('creates entry with all required fields', () => {
    const entry = createAuditEntry({
      type: 'status_change',
      operator: { id: 'user-1', name: 'Alice', role: 'PM' },
      target: { type: 'issue', id: 'DTS-1', name: 'Test Issue' },
      changes: [{ field: 'status', oldValue: 'todo', newValue: 'done' }],
    })
    expect(entry.id).toBeTruthy()
    expect(entry.operationType).toBe('status_change')
    expect(entry.operator.id).toBe('user-1')
    expect(entry.timestamp).toBeTruthy()
    expect(entry.target.id).toBe('DTS-1')
    expect(entry.changes).toHaveLength(1)
  })

  it('marks sensitive operations as high priority', () => {
    const entry = createAuditEntry({
      type: 'permission_change',
      operator: { id: 'user-1', name: 'Alice', role: 'PM' },
      target: { type: 'user', id: 'user-2', name: 'Bob' },
      changes: [{ field: 'role', oldValue: 'DEV', newValue: 'PM' }],
    })
    expect(entry.priority).toBe('high')
  })

  it('marks non-sensitive operations as normal priority', () => {
    const entry = createAuditEntry({
      type: 'status_change',
      operator: { id: 'user-1', name: 'Alice', role: 'PM' },
      target: { type: 'issue', id: 'DTS-1', name: 'Test' },
      changes: [],
    })
    expect(entry.priority).toBe('normal')
  })

  it('generates unique ids', () => {
    const entry1 = createAuditEntry({
      type: 'status_change',
      operator: { id: 'user-1', name: 'Alice', role: 'PM' },
      target: { type: 'issue', id: 'DTS-1', name: 'Test' },
      changes: [],
    })
    const entry2 = createAuditEntry({
      type: 'status_change',
      operator: { id: 'user-1', name: 'Alice', role: 'PM' },
      target: { type: 'issue', id: 'DTS-2', name: 'Test 2' },
      changes: [],
    })
    expect(entry1.id).not.toBe(entry2.id)
  })

  it('includes metadata when provided', () => {
    const entry = createAuditEntry({
      type: 'status_change',
      operator: { id: 'user-1', name: 'Alice', role: 'PM' },
      target: { type: 'issue', id: 'DTS-1', name: 'Test' },
      changes: [],
      metadata: { source: 'api' },
    })
    expect(entry.metadata).toEqual({ source: 'api' })
  })
})

// ─── isSensitiveOperation ───────────────────────────────────

describe('isSensitiveOperation', () => {
  it('returns true for all sensitive operations', () => {
    for (const op of SENSITIVE_OPERATIONS) {
      expect(isSensitiveOperation(op)).toBe(true)
    }
  })

  it('returns false for non-sensitive operations', () => {
    expect(isSensitiveOperation('status_change')).toBe(false)
    expect(isSensitiveOperation('comment_add')).toBe(false)
    expect(isSensitiveOperation('assignee_change')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isSensitiveOperation('')).toBe(false)
  })
})

// ─── filterAuditLogs ────────────────────────────────────────

describe('filterAuditLogs', () => {
  const logs: AuditLogEntry[] = [
    makeAuditEntry({ id: 'a1', operationType: 'status_change', timestamp: '2025-01-10T10:00:00Z', operator: { id: 'user-1', name: 'Alice', role: 'PM' } }),
    makeAuditEntry({ id: 'a2', operationType: 'permission_change', timestamp: '2025-01-12T10:00:00Z', operator: { id: 'user-2', name: 'Bob', role: 'DEV' } }),
    makeAuditEntry({ id: 'a3', operationType: 'status_change', timestamp: '2025-01-15T10:00:00Z', operator: { id: 'user-1', name: 'Alice', role: 'PM' } }),
    makeAuditEntry({ id: 'a4', operationType: 'bulk_delete', timestamp: '2025-01-20T10:00:00Z', operator: { id: 'user-2', name: 'Bob', role: 'DEV' } }),
  ]

  it('returns all logs when no filters specified', () => {
    const result = filterAuditLogs(logs, {})
    expect(result).toHaveLength(4)
  })

  it('filters by time range', () => {
    const result = filterAuditLogs(logs, {
      timeRange: { start: '2025-01-11T00:00:00Z', end: '2025-01-16T00:00:00Z' },
    })
    expect(result).toHaveLength(2)
    expect(result.map((l) => l.id)).toEqual(['a2', 'a3'])
  })

  it('filters by operator id', () => {
    const result = filterAuditLogs(logs, { operator: 'user-1' })
    expect(result).toHaveLength(2)
    expect(result.every((l) => l.operator.id === 'user-1')).toBe(true)
  })

  it('filters by operator name', () => {
    const result = filterAuditLogs(logs, { operator: 'Bob' })
    expect(result).toHaveLength(2)
    expect(result.every((l) => l.operator.name === 'Bob')).toBe(true)
  })

  it('filters by operation type', () => {
    const result = filterAuditLogs(logs, { operationType: 'status_change' })
    expect(result).toHaveLength(2)
    expect(result.every((l) => l.operationType === 'status_change')).toBe(true)
  })

  it('applies all filters simultaneously (AND logic)', () => {
    const result = filterAuditLogs(logs, {
      timeRange: { start: '2025-01-09T00:00:00Z', end: '2025-01-16T00:00:00Z' },
      operator: 'user-1',
      operationType: 'status_change',
    })
    expect(result).toHaveLength(2)
  })

  it('returns empty when no logs match', () => {
    const result = filterAuditLogs(logs, { operationType: 'nonexistent' })
    expect(result).toHaveLength(0)
  })

  it('handles empty logs array', () => {
    const result = filterAuditLogs([], { operationType: 'status_change' })
    expect(result).toHaveLength(0)
  })
})

// ─── exportToCSV / parseCSV ─────────────────────────────────

describe('exportToCSV and parseCSV', () => {
  it('exports logs to CSV with correct headers', () => {
    const logs = [makeAuditEntry()]
    const csv = exportToCSV(logs)
    const lines = csv.split('\n')
    expect(lines[0]).toContain('id')
    expect(lines[0]).toContain('operationType')
    expect(lines[0]).toContain('timestamp')
    expect(lines[0]).toContain('priority')
  })

  it('round-trips: export then parse produces equivalent data', () => {
    const logs = [
      makeAuditEntry({ id: 'a1', operationType: 'status_change', priority: 'normal' }),
      makeAuditEntry({ id: 'a2', operationType: 'permission_change', priority: 'high' }),
    ]
    const csv = exportToCSV(logs)
    const parsed = parseCSV(csv)

    expect(parsed).toHaveLength(2)
    expect(parsed[0].id).toBe('a1')
    expect(parsed[0].operationType).toBe('status_change')
    expect(parsed[0].priority).toBe('normal')
    expect(parsed[1].id).toBe('a2')
    expect(parsed[1].operationType).toBe('permission_change')
    expect(parsed[1].priority).toBe('high')
  })

  it('preserves operator information through round-trip', () => {
    const logs = [makeAuditEntry({ operator: { id: 'u1', name: 'Alice', role: 'PM' } })]
    const csv = exportToCSV(logs)
    const parsed = parseCSV(csv)
    expect(parsed[0].operator.id).toBe('u1')
    expect(parsed[0].operator.name).toBe('Alice')
    expect(parsed[0].operator.role).toBe('PM')
  })

  it('preserves target information through round-trip', () => {
    const logs = [makeAuditEntry({ target: { type: 'issue', id: 'DTS-5', name: 'My Issue' } })]
    const csv = exportToCSV(logs)
    const parsed = parseCSV(csv)
    expect(parsed[0].target.type).toBe('issue')
    expect(parsed[0].target.id).toBe('DTS-5')
    expect(parsed[0].target.name).toBe('My Issue')
  })

  it('preserves changes through round-trip', () => {
    const changes = [
      { field: 'status', oldValue: 'todo', newValue: 'done' },
      { field: 'priority', oldValue: 'P2', newValue: 'P0' },
    ]
    const logs = [makeAuditEntry({ changes })]
    const csv = exportToCSV(logs)
    const parsed = parseCSV(csv)
    expect(parsed[0].changes).toHaveLength(2)
    expect(parsed[0].changes[0].field).toBe('status')
    expect(parsed[0].changes[1].field).toBe('priority')
  })

  it('handles empty logs array', () => {
    const csv = exportToCSV([])
    const parsed = parseCSV(csv)
    expect(parsed).toHaveLength(0)
  })

  it('parseCSV returns empty for header-only CSV', () => {
    const csv = 'id,operationType,operatorId,operatorName,operatorRole,timestamp,targetType,targetId,targetName,changes,priority'
    const parsed = parseCSV(csv)
    expect(parsed).toHaveLength(0)
  })
})
