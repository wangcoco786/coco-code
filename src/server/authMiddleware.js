/**
 * Auth Middleware — API 请求鉴权
 *
 * 核心职责:
 * - 从 Authorization: Bearer <token> 提取 Token
 * - 验证平台 JWT（HS256），通过则注入 req.user（userId, username, role）
 * - Token 过期返回 401 + X-Token-Expired: true
 * - Token 无效/缺失返回 401
 * - 排除路径: /api/auth/sso/login, /api/auth/sso/callback, /api/auth/refresh
 */

import jwt from 'jsonwebtoken'

const EXCLUDED_PATHS = [
  '/api/auth/sso/login',
  '/api/auth/sso/callback',
  '/api/auth/refresh',
]

/**
 * Express middleware that protects /api/ routes with JWT verification.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function authMiddleware(req, res, next) {
  // Allow excluded paths through without token check
  if (EXCLUDED_PATHS.includes(req.path)) {
    return next()
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' })
  }

  const token = authHeader.slice(7) // strip "Bearer "

  const secret = process.env.JWT_SECRET
  if (!secret) {
    return res.status(401).json({ error: '未授权访问' })
  }

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] })

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    }

    return next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.set('X-Token-Expired', 'true')
      return res.status(401).json({ error: '令牌已过期' })
    }

    return res.status(401).json({ error: '未授权访问' })
  }
}
