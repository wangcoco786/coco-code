/**
 * 项目组配置
 * 将多个 Jira 项目合并为一个虚拟项目组，在选择器和绩效中作为整体展示。
 */

export interface ProjectGroup {
  /** 组 key，用于标识（如 IDC, EAG） */
  key: string
  /** 显示名称 */
  name: string
  /** 包含的 Jira 项目 key 列表 */
  projects: string[]
}

/**
 * Sprint 分组配置
 * 对于单个 Jira 项目中有多个并行 Sprint 的情况，
 * 按 Sprint 名称前缀将其分为多个子组独立展示。
 */
export interface SprintGroup {
  /** 子组标识（如 OB, OMS, DI, CP） */
  key: string
  /** 显示名称 */
  name: string
  /** Sprint 名称前缀匹配规则（不区分大小写） */
  prefix: string
}

export interface ProjectWithSprintGroups {
  /** 项目 key（如 DTS） */
  projectKey: string
  /** Sprint 分组 */
  sprintGroups: SprintGroup[]
}

/** 已定义的项目组 */
export const PROJECT_GROUPS: ProjectGroup[] = [
  {
    key: 'IDC',
    name: 'IDC',
    projects: ['RP', 'TRF', 'APS'],
  },
  {
    key: 'EAG',
    name: 'EAG',
    projects: ['BP', 'CRMC', 'VRM', 'OW', 'RE'],
  },
]

/** 已定义的 Sprint 分组（同一项目内多组并行 Sprint） */
export const SPRINT_GROUPS: ProjectWithSprintGroups[] = [
  {
    projectKey: 'DTS',
    sprintGroups: [
      { key: 'OB', name: 'OB', prefix: 'OB' },
      { key: 'OMS', name: 'OMS', prefix: 'OMS' },
      { key: 'DI', name: 'DI', prefix: 'DI' },
      { key: 'CP', name: 'CP', prefix: 'CP' },
    ],
  },
]

/** 判断一个 key 是否是项目组 */
export function isProjectGroup(key: string | null): boolean {
  if (!key) return false
  return PROJECT_GROUPS.some(g => g.key === key)
}

/** 根据组 key 获取包含的项目列表；如果不是组则返回 [key] */
export function resolveProjectKeys(key: string | null): string[] {
  if (!key) return []
  const group = PROJECT_GROUPS.find(g => g.key === key)
  if (group) return group.projects
  return [key]
}

/** 获取项目组信息 */
export function getProjectGroup(key: string): ProjectGroup | undefined {
  return PROJECT_GROUPS.find(g => g.key === key)
}

/** 判断某个 Jira 项目 key 是否已被某个组包含 */
export function isProjectInGroup(projectKey: string): boolean {
  return PROJECT_GROUPS.some(g => g.projects.includes(projectKey))
}

/** 判断某个项目是否有 Sprint 分组配置 */
export function hasSprintGroups(projectKey: string | null): boolean {
  if (!projectKey) return false
  return SPRINT_GROUPS.some(sg => sg.projectKey === projectKey)
}

/** 获取项目的 Sprint 分组配置 */
export function getSprintGroups(projectKey: string | null): SprintGroup[] {
  if (!projectKey) return []
  return SPRINT_GROUPS.find(sg => sg.projectKey === projectKey)?.sprintGroups ?? []
}

/** 根据 Sprint 名称匹配它属于哪个组（返回组 key，无匹配返回 null） */
export function matchSprintGroup(projectKey: string, sprintName: string): string | null {
  const groups = getSprintGroups(projectKey)
  if (groups.length === 0) return null
  const nameLower = sprintName.toLowerCase().trim()
  for (const g of groups) {
    if (nameLower.startsWith(g.prefix.toLowerCase())) return g.key
  }
  return null
}
