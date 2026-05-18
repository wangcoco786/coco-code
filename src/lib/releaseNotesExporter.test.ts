import { describe, it, expect } from 'vitest'
import {
  sanitizeFilename,
  generateExportFilename,
  generateMarkdown,
  generateHTML,
} from './releaseNotesExporter'
import type { ReleaseNotesData, ExportOptions } from '@/types/platform'

// ─── Test Data ──────────────────────────────────────────────

function createTestData(overrides?: Partial<ReleaseNotesData>): ReleaseNotesData {
  return {
    sprintName: 'Sprint 42',
    sprintStartDate: '2025-01-06',
    sprintEndDate: '2025-01-20',
    projectKey: 'DTS',
    summary: {
      totalCount: 10,
      completedCount: 7,
      completionRate: 70,
      hotFixCount: 2,
      baselineCount: 8,
      unplannedCount: 2,
      isCompletionWarning: true,
    },
    categorizedIssues: {
      feature: [
        {
          id: 'DTS-101',
          jiraId: '10001',
          title: 'Add user dashboard',
          status: 'done',
          priority: 'P1',
          assignee: { id: 'u1', name: 'Alice', avatarUrl: '' },
          storyPoints: 5,
          labels: ['feature'],
          isBaseline: true,
          createdAt: '2025-01-05T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
          estimatedHours: 8,
          spentHours: 6,
          category: 'feature',
          isUnplanned: false,
          isStaleStatus: false,
        },
      ],
      bug_fix: [
        {
          id: 'DTS-102',
          jiraId: '10002',
          title: 'Fix login crash',
          status: 'done',
          priority: 'P0',
          assignee: { id: 'u2', name: 'Bob', avatarUrl: '' },
          storyPoints: 2,
          labels: ['bug'],
          isBaseline: true,
          createdAt: '2025-01-04T00:00:00Z',
          updatedAt: '2025-01-10T00:00:00Z',
          estimatedHours: 4,
          spentHours: 3,
          category: 'bug_fix',
          isUnplanned: false,
          isStaleStatus: false,
        },
      ],
      hot_fix: [
        {
          id: 'DTS-103',
          jiraId: '10003',
          title: 'Emergency DB fix',
          status: 'in_progress',
          priority: 'P0',
          assignee: { id: 'u1', name: 'Alice', avatarUrl: '' },
          storyPoints: 3,
          labels: ['hotfix'],
          isBaseline: false,
          createdAt: '2025-01-10T00:00:00Z',
          updatedAt: '2025-01-18T00:00:00Z',
          estimatedHours: 6,
          spentHours: 4,
          category: 'hot_fix',
          isUnplanned: true,
          isStaleStatus: true,
        },
      ],
      improvement: [],
      other: [],
    },
    staleIssues: [
      {
        id: 'DTS-103',
        jiraId: '10003',
        title: 'Emergency DB fix',
        status: 'in_progress',
        priority: 'P0',
        assignee: { id: 'u1', name: 'Alice', avatarUrl: '' },
        storyPoints: 3,
        labels: ['hotfix'],
        isBaseline: false,
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-18T00:00:00Z',
        estimatedHours: 6,
        spentHours: 4,
        category: 'hot_fix',
        isUnplanned: true,
        isStaleStatus: true,
      },
    ],
    generatedAt: '2025-01-19T10:30:00.000Z',
    ...overrides,
  }
}

// ─── sanitizeFilename ───────────────────────────────────────

describe('sanitizeFilename', () => {
  it('should replace spaces with hyphens', () => {
    expect(sanitizeFilename('Sprint 42')).toBe('Sprint-42')
  })

  it('should replace special characters with hyphens', () => {
    expect(sanitizeFilename('Sprint/42@v1.0')).toBe('Sprint-42-v1-0')
  })

  it('should collapse multiple hyphens', () => {
    expect(sanitizeFilename('Sprint---42')).toBe('Sprint-42')
  })

  it('should trim leading and trailing hyphens', () => {
    expect(sanitizeFilename('--Sprint 42--')).toBe('Sprint-42')
  })

  it('should preserve Chinese characters', () => {
    expect(sanitizeFilename('迭代42')).toBe('迭代42')
  })

  it('should handle empty string', () => {
    expect(sanitizeFilename('')).toBe('')
  })
})

// ─── generateExportFilename ─────────────────────────────────

describe('generateExportFilename', () => {
  it('should generate markdown filename', () => {
    const options: ExportOptions = {
      format: 'markdown',
      projectKey: 'DTS',
      sprintName: 'Sprint 42',
    }
    expect(generateExportFilename(options)).toBe('release-notes-DTS-Sprint-42.md')
  })

  it('should generate html filename', () => {
    const options: ExportOptions = {
      format: 'html',
      projectKey: 'DTS',
      sprintName: 'Sprint 42',
    }
    expect(generateExportFilename(options)).toBe('release-notes-DTS-Sprint-42.html')
  })

  it('should sanitize sprint name in filename', () => {
    const options: ExportOptions = {
      format: 'markdown',
      projectKey: 'PRJ',
      sprintName: 'Sprint/v1.0 (test)',
    }
    expect(generateExportFilename(options)).toBe('release-notes-PRJ-Sprint-v1-0-test.md')
  })
})

// ─── generateMarkdown ───────────────────────────────────────

describe('generateMarkdown', () => {
  it('should include sprint name in header', () => {
    const data = createTestData()
    const md = generateMarkdown(data)
    expect(md).toContain('# Release Notes: Sprint 42')
  })

  it('should include date range', () => {
    const data = createTestData()
    const md = generateMarkdown(data)
    expect(md).toContain('2025-01-06')
    expect(md).toContain('2025-01-20')
  })

  it('should include generation timestamp', () => {
    const data = createTestData()
    const md = generateMarkdown(data)
    expect(md).toContain('2025-01-19T10:30:00.000Z')
  })

  it('should include completion summary stats', () => {
    const data = createTestData()
    const md = generateMarkdown(data)
    expect(md).toContain('10')  // totalCount
    expect(md).toContain('7')   // completedCount
    expect(md).toContain('70%') // completionRate
  })

  it('should include completion warning when rate < 80%', () => {
    const data = createTestData()
    const md = generateMarkdown(data)
    expect(md).toContain('⚠️')
    expect(md).toContain('完成率低于 80%')
  })

  it('should not include completion warning when rate >= 80%', () => {
    const data = createTestData({
      summary: {
        totalCount: 10,
        completedCount: 9,
        completionRate: 90,
        hotFixCount: 0,
        baselineCount: 10,
        unplannedCount: 0,
        isCompletionWarning: false,
      },
    })
    const md = generateMarkdown(data)
    expect(md).not.toContain('完成率低于 80%')
  })

  it('should include categorized issues with issue keys', () => {
    const data = createTestData()
    const md = generateMarkdown(data)
    expect(md).toContain('DTS-101')
    expect(md).toContain('DTS-102')
    expect(md).toContain('DTS-103')
  })

  it('should include category headings for non-empty categories', () => {
    const data = createTestData()
    const md = generateMarkdown(data)
    expect(md).toContain('新功能 (Feature)')
    expect(md).toContain('Bug 修复 (Bug Fix)')
    expect(md).toContain('紧急修复 (Hot Fix)')
  })

  it('should not include category headings for empty categories', () => {
    const data = createTestData()
    const md = generateMarkdown(data)
    expect(md).not.toContain('优化改进 (Improvement)')
    expect(md).not.toContain('其他 (Other)')
  })

  it('should mark unplanned issues', () => {
    const data = createTestData()
    const md = generateMarkdown(data)
    expect(md).toContain('`插队`')
  })

  it('should include stale issues section', () => {
    const data = createTestData()
    const md = generateMarkdown(data)
    expect(md).toContain('状态待更新')
    expect(md).toContain('DTS-103')
  })
})

// ─── generateHTML ───────────────────────────────────────────

describe('generateHTML', () => {
  it('should produce valid HTML document', () => {
    const data = createTestData()
    const html = generateHTML(data)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })

  it('should include sprint name', () => {
    const data = createTestData()
    const html = generateHTML(data)
    expect(html).toContain('Sprint 42')
  })

  it('should include date range', () => {
    const data = createTestData()
    const html = generateHTML(data)
    expect(html).toContain('2025-01-06')
    expect(html).toContain('2025-01-20')
  })

  it('should include generation timestamp', () => {
    const data = createTestData()
    const html = generateHTML(data)
    expect(html).toContain('2025-01-19T10:30:00.000Z')
  })

  it('should include completion summary values', () => {
    const data = createTestData()
    const html = generateHTML(data)
    expect(html).toContain('>10<')   // totalCount
    expect(html).toContain('>7<')    // completedCount
    expect(html).toContain('>70%<')  // completionRate
  })

  it('should include issue keys', () => {
    const data = createTestData()
    const html = generateHTML(data)
    expect(html).toContain('DTS-101')
    expect(html).toContain('DTS-102')
    expect(html).toContain('DTS-103')
  })

  it('should include category sections', () => {
    const data = createTestData()
    const html = generateHTML(data)
    expect(html).toContain('新功能 (Feature)')
    expect(html).toContain('Bug 修复 (Bug Fix)')
    expect(html).toContain('紧急修复 (Hot Fix)')
  })

  it('should include styled CSS', () => {
    const data = createTestData()
    const html = generateHTML(data)
    expect(html).toContain('<style>')
    expect(html).toContain('linear-gradient')
  })

  it('should escape HTML special characters in content', () => {
    const data = createTestData({
      sprintName: 'Sprint <script>alert("xss")</script>',
    })
    const html = generateHTML(data)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('should include unplanned badge for unplanned issues', () => {
    const data = createTestData()
    const html = generateHTML(data)
    expect(html).toContain('badge-unplanned')
    expect(html).toContain('插队')
  })

  it('should include stale section when stale issues exist', () => {
    const data = createTestData()
    const html = generateHTML(data)
    expect(html).toContain('stale-section')
    expect(html).toContain('状态待更新')
  })

  it('should not include stale section when no stale issues', () => {
    const data = createTestData({ staleIssues: [] })
    const html = generateHTML(data)
    // The CSS class definition will still be in the style block,
    // but the actual section element should not be rendered
    expect(html).not.toContain('<div class="section stale-section">')
  })
})
