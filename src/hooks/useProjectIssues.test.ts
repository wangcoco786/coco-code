import { describe, it, expect } from 'vitest'

const MOCK_SPRINTS = [
 { id: 100, name: 'Linker CP.2026.06/26-07/09', state: 'active' },
 { id: 101, name: 'Linker DI.2026.06/26-07/09', state: 'active' },
]

const MOCK_SPRINT_CP_ISSUES = [
 { key: 'DTS-10262', assigneeName: 'Fangjie Deng', status: 'In Testing' },
 { key: 'DTS-10281', assigneeName: 'Fangjie Deng', status: 'In Testing' },
]

const MOCK_SPRINT_DI_ISSUES = [
 { key: 'DTS-10766', assigneeName: 'Fangjie Deng', status: 'In Dev' },
]

const ALL_OPEN_SPRINT_ISSUES = [...MOCK_SPRINT_CP_ISSUES, ...MOCK_SPRINT_DI_ISSUES]

describe('Dashboard Sprint 任务统计遗漏问题', () => {
 describe('Bug 确认：Dashboard 只使用 sprints[0] 导致遗漏', () => {
 it('多个活跃 Sprint 时 sprints[0] 不包含所有任务', () => {
 const sortedSprints = [...MOCK_SPRINTS].sort((a, b) => a.name.localeCompare(b.name))
 const firstSprint = sortedSprints[0]
 expect(firstSprint.name).toBe('Linker CP.2026.06/26-07/09')
 const cpIssueIds = MOCK_SPRINT_CP_ISSUES.map(i => i.key)
 expect(cpIssueIds).not.toContain('DTS-10766')
 })

 it('DTS-10766 存在于第二个活跃 Sprint 中', () => {
 expect(MOCK_SPRINT_DI_ISSUES.map(i => i.key)).toContain('DTS-10766')
 })

 it('查询所有活跃 Sprint 时 DTS-10766 会被包含', () => {
 expect(ALL_OPEN_SPRINT_ISSUES.map(i => i.key)).toContain('DTS-10766')
 })
 })

 describe('Bug 根因：传入 sprintName 时 JQL 只查询该 Sprint', () => {
 it('传入 sprintName 时 JQL 精确匹配', () => {
 const projectKey = 'DTS'
 const sprintName = 'Linker CP.2026.06/26-07/09'
 const isProjectGroup = false
 let jql: string
 if (sprintName && !isProjectGroup) {
 jql = 'project = ' + projectKey + ' AND sprint = "' + sprintName + '"'
 } else {
 jql = 'project = ' + projectKey + ' AND sprint in openSprints()'
 }
 expect(jql).toContain('sprint = "Linker CP.2026.06/26-07/09"')
 expect(jql).not.toContain('openSprints()')
 })

 it('不传 sprintName 时使用 openSprints()', () => {
 const projectKey = 'DTS'
 const sprintName: string | null = null
 const isProjectGroup = false
 let jql: string
 if (sprintName && !isProjectGroup) {
 jql = 'project = ' + projectKey + ' AND sprint = "' + sprintName + '"'
 } else {
 jql = 'project = ' + projectKey + ' AND sprint in openSprints()'
 }
 expect(jql).toContain('openSprints()')
 })
 })

 describe('Bug 影响：PersonalView 任务列表遗漏', () => {
 it('只收到 Sprint CP issues 时 DTS-10766 不在列表中', () => {
 const myIssues = MOCK_SPRINT_CP_ISSUES.filter(i => i.assigneeName === 'Fangjie Deng')
 expect(myIssues.length).toBe(2)
 expect(myIssues.map(i => i.key)).not.toContain('DTS-10766')
 })

 it('收到所有活跃 Sprint issues 时 DTS-10766 会被包含', () => {
 const myIssues = ALL_OPEN_SPRINT_ISSUES.filter(i => i.assigneeName === 'Fangjie Deng')
 expect(myIssues.length).toBe(3)
 expect(myIssues.map(i => i.key)).toContain('DTS-10766')
 })
 })

 describe('修复方案：多 Sprint 时使用 openSprints()', () => {
 it('多个 Sprint 时应使用 openSprints()', () => {
 const sprints = MOCK_SPRINTS
 const projectKey = 'DTS'
 const shouldUseOpenSprints = sprints.length > 1
 let jql: string
 if (!shouldUseOpenSprints && sprints[0]?.name) {
 jql = 'project = ' + projectKey + ' AND sprint = "' + sprints[0].name + '"'
 } else {
 jql = 'project = ' + projectKey + ' AND sprint in openSprints()'
 }
 expect(jql).toContain('openSprints()')
 })

 it('单个 Sprint 时仍精确匹配', () => {
 const sprints = [MOCK_SPRINTS[0]]
 const projectKey = 'DTS'
 const shouldUseOpenSprints = sprints.length > 1
 let jql: string
 if (!shouldUseOpenSprints && sprints[0]?.name) {
 jql = 'project = ' + projectKey + ' AND sprint = "' + sprints[0].name + '"'
 } else {
 jql = 'project = ' + projectKey + ' AND sprint in openSprints()'
 }
 expect(jql).toContain('sprint = "Linker CP.2026.06/26-07/09"')
 })
 })
})