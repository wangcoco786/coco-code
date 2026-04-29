/**
 * Auth Middleware — Unit Tests
 *
 * Covers: JWT verification, token extraction, excluded paths,
 *         expired token handling, invalid/missing token rejection,
 *         user info injection into req.user
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import jwt from 'jsonwebtoken'

const TEST_SECRET = 'test-middleware-secret'

/** Helper: create a mock Express request */
function mockReq({ path = '/api/data', authorization } = {}) {
  return {
    path,
    headers: {
      ...(authorization !== undefined ? { authorization } : {}),
    },
  }
}

/** Helper: create a mock Express response */
function mockRes() {
  const res = {
    _status: null,
    _json: null,
    _headers: {},
    status(code) {
      res._status = code
      return res
    },
    json(body) {
      res._json = body
      return res
    },
    set(key, value) {
      res._headers[key] = value
      return res
    },
  }
  return res
}

describe('authMiddleware', () => {
  let authMiddleware

  beforeEach(async () => {
    process.env.JWT_SECRET = TEST_SECRET
    vi.resetModules()
    const mod = await import('../authMiddleware.js')
    authMiddleware = mod.authMiddleware
  })

  // ── Excluded paths ───────────────────────────────────────

  describe('excluded paths', () => {
    it('should pass through /api/auth/sso/login without token', () => {
      const req = mockReq({ path: '/api/auth/sso/login' })
      const res = mockRes()
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res._status).toBeNull()
    })

    it('should pass through /api/auth/sso/callback without token', () => {
      const req = mockReq({ path: '/api/auth/sso/callback' })
      const res = mockRes()
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res._status).toBeNull()
    })

    it('should pass through /api/auth/refresh without token', () => {
      const req = mockReq({ path: '/api/auth/refresh' })
      const res = mockRes()
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res._status).toBeNull()
    })
  })

  // ── Missing / malformed token ────────────────────────────

  describe('missing or invalid token', () => {
    it('should return 401 when Authorization header is missing', () => {
      const req = mockReq({ authorization: undefined })
      // Remove the authorization key entirely
      delete req.headers.authorization
      const res = mockRes()
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res._status).toBe(401)
    })

    it('should return 401 when Authorization header has no Bearer prefix', () => {
      const req = mockReq({ authorization: 'Basic abc123' })
      const res = mockRes()
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res._status).toBe(401)
    })

    it('should return 401 for a completely invalid JWT string', () => {
      const req = mockReq({ authorization: 'Bearer not-a-jwt' })
      const res = mockRes()
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res._status).toBe(401)
    })

    it('should return 401 for a token signed with wrong secret', () => {
      const token = jwt.sign(
        { userId: 'u-1', username: 'alice', role: 'PM' },
        'wrong-secret',
        { algorithm: 'HS256', expiresIn: '15m' }
      )
      const req = mockReq({ authorization: `Bearer ${token}` })
      const res = mockRes()
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res._status).toBe(401)
    })
  })

  // ── Expired token ────────────────────────────────────────

  describe('expired token', () => {
    it('should return 401 with X-Token-Expired header for expired token', () => {
      // Sign a token that is already expired
      const token = jwt.sign(
        { userId: 'u-exp', username: 'expired-user', role: 'PM' },
        TEST_SECRET,
        { algorithm: 'HS256', expiresIn: '0s' }
      )

      const req = mockReq({ authorization: `Bearer ${token}` })
      const res = mockRes()
      const next = vi.fn()

      // Small delay to ensure token is expired
      authMiddleware(req, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res._status).toBe(401)
      expect(res._headers['X-Token-Expired']).toBe('true')
      expect(res._json.error).toBe('令牌已过期')
    })
  })

  // ── Valid token ──────────────────────────────────────────

  describe('valid token', () => {
    it('should call next() and inject req.user for a valid token', () => {
      const payload = { userId: 'u-ok', username: 'valid-user', role: 'DEV' }
      const token = jwt.sign(payload, TEST_SECRET, {
        algorithm: 'HS256',
        expiresIn: '15m',
      })

      const req = mockReq({ authorization: `Bearer ${token}` })
      const res = mockRes()
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res._status).toBeNull()
      expect(req.user).toEqual({
        userId: 'u-ok',
        username: 'valid-user',
        role: 'DEV',
      })
    })

    it('should inject only userId, username, role into req.user', () => {
      const token = jwt.sign(
        { userId: 'u-sec', username: 'secure', role: 'PM', email: 'x@y.com' },
        TEST_SECRET,
        { algorithm: 'HS256', expiresIn: '15m' }
      )

      const req = mockReq({ authorization: `Bearer ${token}` })
      const res = mockRes()
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.user).toEqual({
        userId: 'u-sec',
        username: 'secure',
        role: 'PM',
      })
      // Should NOT leak extra fields
      expect(req.user).not.toHaveProperty('email')
    })

    it('should protect non-excluded /api/ paths', () => {
      const req = mockReq({ path: '/api/jira/issues' })
      delete req.headers.authorization
      const res = mockRes()
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res._status).toBe(401)
    })
  })
})
