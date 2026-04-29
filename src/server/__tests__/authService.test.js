/**
 * Auth Service — Unit Tests
 *
 * Covers: issuePlatformTokens, syncUserFromSSO, refreshToken, logout
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const USERS_FILE = path.resolve(__dirname, '../../../data/users.json')

// We need to set JWT_SECRET before importing authService
const TEST_SECRET = 'test-jwt-secret-for-unit-tests'

describe('authService', () => {
  let authService

  beforeEach(async () => {
    process.env.JWT_SECRET = TEST_SECRET

    // Reset users.json to empty array
    const dir = path.dirname(USERS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(USERS_FILE, '[]', 'utf-8')

    // Dynamic import to pick up env changes; clear module cache
    vi.resetModules()
    authService = await import('../authService.js')

    // Clear the in-memory refresh token set
    authService._getValidRefreshTokens().clear()
  })

  afterEach(() => {
    // Restore users.json
    fs.writeFileSync(USERS_FILE, '[]', 'utf-8')
  })

  // ── issuePlatformTokens ──────────────────────────────────

  describe('issuePlatformTokens', () => {
    it('should return accessToken and refreshToken', () => {
      const user = { id: 'u-1', username: 'alice', role: 'PM' }
      const tokens = authService.issuePlatformTokens(user)

      expect(tokens).toHaveProperty('accessToken')
      expect(tokens).toHaveProperty('refreshToken')
      expect(typeof tokens.accessToken).toBe('string')
      expect(typeof tokens.refreshToken).toBe('string')
    })

    it('should produce tokens with correct payload (userId, username, role only)', () => {
      const user = { id: 'u-2', username: 'bob', role: 'DEV' }
      const { accessToken } = authService.issuePlatformTokens(user)
      const decoded = jwt.verify(accessToken, TEST_SECRET)

      expect(decoded.userId).toBe('u-2')
      expect(decoded.username).toBe('bob')
      expect(decoded.role).toBe('DEV')
      // Should NOT contain sensitive fields
      expect(decoded).not.toHaveProperty('email')
      expect(decoded).not.toHaveProperty('iamSub')
    })

    it('should sign Access Token with 15min expiry (exp - iat = 900)', () => {
      const user = { id: 'u-3', username: 'carol', role: 'PM' }
      const { accessToken } = authService.issuePlatformTokens(user)
      const decoded = jwt.decode(accessToken)

      expect(decoded.exp - decoded.iat).toBe(900)
    })

    it('should sign Refresh Token with 7-day expiry (exp - iat = 604800)', () => {
      const user = { id: 'u-4', username: 'dave', role: 'PM' }
      const { refreshToken } = authService.issuePlatformTokens(user)
      const decoded = jwt.decode(refreshToken)

      expect(decoded.exp - decoded.iat).toBe(604800)
    })

    it('should use HS256 algorithm', () => {
      const user = { id: 'u-5', username: 'eve', role: 'PM' }
      const { accessToken } = authService.issuePlatformTokens(user)
      const header = JSON.parse(
        Buffer.from(accessToken.split('.')[0], 'base64url').toString()
      )
      expect(header.alg).toBe('HS256')
    })

    it('should add refresh token to valid set', () => {
      const user = { id: 'u-6', username: 'frank', role: 'PM' }
      const { refreshToken } = authService.issuePlatformTokens(user)

      expect(authService._getValidRefreshTokens().has(refreshToken)).toBe(true)
    })
  })

  // ── syncUserFromSSO ──────────────────────────────────────

  describe('syncUserFromSSO', () => {
    it('should create a new user on first login', async () => {
      const iamUser = { sub: 'iam-001', name: 'Alice', email: 'alice@item.com' }
      const user = await authService.syncUserFromSSO(iamUser)

      expect(user.iamSub).toBe('iam-001')
      expect(user.username).toBe('Alice')
      expect(user.email).toBe('alice@item.com')
      expect(user.role).toBe('PM')
      expect(user.id).toBeTruthy()
      expect(user.createdAt).toBeTruthy()
    })

    it('should update existing user on repeat login (same sub)', async () => {
      const iamUser = { sub: 'iam-002', name: 'Bob', email: 'bob@item.com' }
      const first = await authService.syncUserFromSSO(iamUser)

      const updated = await authService.syncUserFromSSO({
        sub: 'iam-002',
        name: 'Bob Updated',
        email: 'bob.new@item.com',
      })

      expect(updated.id).toBe(first.id)
      expect(updated.username).toBe('Bob Updated')
      expect(updated.email).toBe('bob.new@item.com')
      expect(updated.role).toBe('PM') // role unchanged
    })

    it('should not create duplicate users for same sub', async () => {
      const iamUser = { sub: 'iam-003', name: 'Carol', email: 'carol@item.com' }
      await authService.syncUserFromSSO(iamUser)
      await authService.syncUserFromSSO(iamUser)

      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
      const matching = users.filter((u) => u.iamSub === 'iam-003')
      expect(matching).toHaveLength(1)
    })

    it('should create different users for different subs', async () => {
      await authService.syncUserFromSSO({ sub: 'iam-a', name: 'A', email: 'a@item.com' })
      await authService.syncUserFromSSO({ sub: 'iam-b', name: 'B', email: 'b@item.com' })

      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
      expect(users).toHaveLength(2)
      expect(users[0].id).not.toBe(users[1].id)
    })
  })

  // ── refreshToken ─────────────────────────────────────────

  describe('refreshToken', () => {
    it('should return a new accessToken for a valid refresh token', () => {
      const user = { id: 'u-r1', username: 'refresh-user', role: 'PM' }
      const { refreshToken: rt } = authService.issuePlatformTokens(user)

      const result = authService.refreshToken(rt)
      expect(result).toHaveProperty('accessToken')

      const decoded = jwt.verify(result.accessToken, TEST_SECRET)
      expect(decoded.userId).toBe('u-r1')
      expect(decoded.username).toBe('refresh-user')
      expect(decoded.role).toBe('PM')
    })

    it('should throw 401 for a token not in the valid set', () => {
      // Craft a valid JWT but don't add it to the set
      const fakeToken = jwt.sign(
        { userId: 'x', username: 'x', role: 'PM' },
        TEST_SECRET,
        { algorithm: 'HS256', expiresIn: '7d' }
      )

      expect(() => authService.refreshToken(fakeToken)).toThrow()
      try {
        authService.refreshToken(fakeToken)
      } catch (err) {
        expect(err.status).toBe(401)
      }
    })

    it('should throw 401 for a completely invalid token string', () => {
      expect(() => authService.refreshToken('not-a-jwt')).toThrow()
    })
  })

  // ── logout ───────────────────────────────────────────────

  describe('logout', () => {
    it('should remove refresh token from valid set', () => {
      const user = { id: 'u-lo', username: 'logout-user', role: 'PM' }
      const { refreshToken: rt } = authService.issuePlatformTokens(user)

      expect(authService._getValidRefreshTokens().has(rt)).toBe(true)
      authService.logout(rt)
      expect(authService._getValidRefreshTokens().has(rt)).toBe(false)
    })

    it('should cause subsequent refresh to fail', () => {
      const user = { id: 'u-lo2', username: 'logout-user2', role: 'PM' }
      const { refreshToken: rt } = authService.issuePlatformTokens(user)

      authService.logout(rt)
      expect(() => authService.refreshToken(rt)).toThrow()
    })
  })
})
