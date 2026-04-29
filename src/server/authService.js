/**
 * Auth Service — Token 签发、用户同步、刷新与登出
 *
 * 核心职责:
 * - issuePlatformTokens(user)  签发 Access Token (15min) + Refresh Token (7天)
 * - syncUserFromSSO(iamUser)   根据 IAM sub 查找/创建平台用户
 * - refreshToken(token)        验证 Refresh Token 并签发新 Access Token
 * - logout(refreshToken)       使 Refresh Token 失效
 */

import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const USERS_FILE = path.resolve(__dirname, '../../data/users.json')

// ── helpers ────────────────────────────────────────────────

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未配置')
  }
  return secret
}

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeUsers(users) {
  const dir = path.dirname(USERS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}

// ── In-memory valid refresh tokens ────────────────────────

const validRefreshTokens = new Set()

/** Expose for testing */
export function _getValidRefreshTokens() {
  return validRefreshTokens
}

// ── Token 签发 ─────────────────────────────────────────────

/**
 * 签发平台 Access Token + Refresh Token
 * - Access Token: 15 分钟 (900s), HS256
 * - Refresh Token: 7 天 (604800s), HS256
 * - Payload 仅含 userId, username, role
 *
 * @param {{ id: string, username: string, role: string }} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export function issuePlatformTokens(user) {
  const secret = getJwtSecret()
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  }

  const accessToken = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: '15m',
  })

  const refreshToken = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: '7d',
  })

  // 将 refresh token 加入有效集合
  validRefreshTokens.add(refreshToken)

  return { accessToken, refreshToken }
}

// ── 用户同步 ───────────────────────────────────────────────

/**
 * 根据 IAM 用户信息查找或创建平台用户
 * - 首次登录: 创建新用户，默认角色 PM
 * - 再次登录: 更新 username 和 email
 *
 * @param {{ sub: string, name: string, email: string }} iamUser
 * @returns {Promise<object>} 平台用户记录
 */
export async function syncUserFromSSO(iamUser) {
  const users = readUsers()
  const now = new Date().toISOString()

  const existingIndex = users.findIndex((u) => u.iamSub === iamUser.sub)

  if (existingIndex >= 0) {
    // 已有用户 — 更新 name / email
    users[existingIndex].username = iamUser.name
    users[existingIndex].email = iamUser.email
    users[existingIndex].updatedAt = now
    writeUsers(users)
    return users[existingIndex]
  }

  // 新用户
  const newUser = {
    id: randomUUID(),
    iamSub: iamUser.sub,
    username: iamUser.name,
    email: iamUser.email,
    role: 'PM',
    createdAt: now,
    updatedAt: now,
  }

  users.push(newUser)
  writeUsers(users)
  return newUser
}

// ── Token 刷新 ─────────────────────────────────────────────

/**
 * 验证 Refresh Token 并签发新的 Access Token
 *
 * @param {string} token  Refresh Token
 * @returns {{ accessToken: string }}
 * @throws {{ status: number, error: string }} 验证失败时抛出
 */
export function refreshToken(token) {
  const secret = getJwtSecret()

  // 检查是否在有效集合中
  if (!validRefreshTokens.has(token)) {
    const err = new Error('刷新令牌无效')
    err.status = 401
    throw err
  }

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] })

    const payload = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    }

    const accessToken = jwt.sign(payload, secret, {
      algorithm: 'HS256',
      expiresIn: '15m',
    })

    return { accessToken }
  } catch (jwtErr) {
    // Token 过期或无效 — 从集合中移除
    validRefreshTokens.delete(token)
    const err = new Error('刷新令牌无效')
    err.status = 401
    throw err
  }
}

// ── 登出 ───────────────────────────────────────────────────

/**
 * 使 Refresh Token 失效
 *
 * @param {string} token  要失效的 Refresh Token
 */
export function logout(token) {
  validRefreshTokens.delete(token)
}
