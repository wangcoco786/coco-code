// ============================================================
// 排除人员名单 — 已离职或不参与考核的人员
// 可在此处手动添加，或通过 Settings 页面管理（存 localStorage）
// ============================================================

const HARDCODED_EXCLUDED: string[] = [
  'Peiyi Duan',
  'Yuanhai Zhao',
]

const LOCAL_STORAGE_KEY = 'ai-pm-excluded-users'

/**
 * 获取所有排除的用户名（小写 Set，用于匹配）
 */
export function getExcludedUsers(): Set<string> {
  const result = new Set<string>()

  // 硬编码的排除名单
  for (const name of HARDCODED_EXCLUDED) {
    result.add(name.toLowerCase())
  }

  // 从 localStorage 读取用户配置的排除名单
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      const names: string[] = JSON.parse(stored)
      for (const name of names) {
        if (name) result.add(name.toLowerCase())
      }
    }
  } catch {
    // ignore parse errors
  }

  return result
}

/**
 * 添加排除用户
 */
export function addExcludedUser(name: string): void {
  const current = getStoredExcludedUsers()
  if (!current.includes(name)) {
    current.push(name)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current))
  }
}

/**
 * 移除排除用户
 */
export function removeExcludedUser(name: string): void {
  const current = getStoredExcludedUsers().filter(n => n !== name)
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current))
}

/**
 * 获取 localStorage 中存储的排除用户列表（原始格式）
 */
export function getStoredExcludedUsers(): string[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * 获取硬编码的排除名单
 */
export function getHardcodedExcluded(): string[] {
  return [...HARDCODED_EXCLUDED]
}
