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
