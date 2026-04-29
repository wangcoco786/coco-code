/**
 * OIDC Client — Unit Tests
 *
 * Covers: State Session Store, ssoLoginHandler, ssoCallbackHandler
 * Requirements: 1.2, 1.3, 2.1, 2.3, 2.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jwt from 'jsonwebtoken'

const TEST_SECRET = 'test-jwt-secret-for-oidc-tests'

// Mock environment
function setOIDCEnv() {
  process.env.IAM_CLIENT_ID = 'test-client-id'
  process.env.IAM_CLIENT_SECRET = 'test-client-secret'
  process.env.IAM_ISSUER_URL = 'https://iam.item.com'
  process.env.IAM_REDIRECT_URI = 'https://platform.example.com/api/auth/sso/callback'
  process.env.JWT_SECRET = TEST_SECRET
}

/**
 * Build a fake Express-like response object.
 */
function mockRes() {
  const res = {
    statusCode: null,
    redirectUrl: null,
    body: null,
    status(code) { res.statusCode = code; return res },
    json(data) { res.body = data; return res },
    redirect(url) { res.redirectUrl = url; return res },
  }
  return res
}

/**
 * Build a fake Express-like request object.
 */
function mockReq(query = {}) {
  return {
    query,
    protocol: 'https',
    get(header) {
      if (header === 'host') return 'platform.example.com'
      return undefined
    },
  }
}

describe('oidcClient', () => {
  let oidcClient

  beforeEach(async () => {
    setOIDCEnv()
    vi.resetModules()
    oidcClient = await import('../oidcClient.js')
    oidcClient._getStateStore().clear()
  })

  afterEach(() => {
    oidcClient._getStateStore().clear()
  })

  // ── State Session Store ──────────────────────────────────

  describe('State Session Store', () => {
    it('should store and retrieve state entries', () => {
      const store = oidcClient._getStateStore()
      store.set('test-state', { createdAt: Date.now() })
      expect(store.has('test-state')).toBe(true)
      expect(store.get('test-state')).toHaveProperty('createdAt')
    })

    it('should allow deletion of state entries', () => {
      const store = oidcClient._getStateStore()
      store.set('del-state', { createdAt: Date.now() })
      store.delete('del-state')
      expect(store.has('del-state')).toBe(false)
    })
  })

  // ── ssoLoginHandler ──────────────────────────────────────

  describe('ssoLoginHandler', () => {
    it('should redirect to IAM authorization endpoint', () => {
      const req = mockReq()
      const res = mockRes()

      oidcClient.ssoLoginHandler(req, res)

      expect(res.redirectUrl).toBeTruthy()
      const url = new URL(res.redirectUrl)
      expect(url.origin).toBe('https://iam.item.com')
      expect(url.pathname).toBe('/authorize')
    })

    it('should include all required OIDC parameters', () => {
      const req = mockReq()
      const res = mockRes()

      oidcClient.ssoLoginHandler(req, res)

      const url = new URL(res.redirectUrl)
      expect(url.searchParams.get('client_id')).toBe('test-client-id')
      expect(url.searchParams.get('redirect_uri')).toBe(
        'https://platform.example.com/api/auth/sso/callback'
      )
      expect(url.searchParams.get('response_type')).toBe('code')
      expect(url.searchParams.get('scope')).toContain('openid')
      expect(url.searchParams.get('scope')).toContain('profile')
      expect(url.searchParams.get('scope')).toContain('email')
      expect(url.searchParams.get('state')).toBeTruthy()
    })

    it('should generate unique state for each request', () => {
      const states = new Set()
      for (let i = 0; i < 10; i++) {
        const req = mockReq()
        const res = mockRes()
        oidcClient.ssoLoginHandler(req, res)
        const url = new URL(res.redirectUrl)
        states.add(url.searchParams.get('state'))
      }
      expect(states.size).toBe(10)
    })

    it('should store state in the state store', () => {
      const req = mockReq()
      const res = mockRes()

      oidcClient.ssoLoginHandler(req, res)

      const url = new URL(res.redirectUrl)
      const state = url.searchParams.get('state')
      expect(oidcClient._getStateStore().has(state)).toBe(true)
    })

    it('should return 500 if IAM env vars are missing', () => {
      delete process.env.IAM_CLIENT_ID
      const req = mockReq()
      const res = mockRes()

      oidcClient.ssoLoginHandler(req, res)

      expect(res.statusCode).toBe(500)
      expect(res.body.error).toContain('配置不完整')
    })
  })

  // ── ssoCallbackHandler ───────────────────────────────────

  describe('ssoCallbackHandler', () => {
    it('should return 403 when state is missing', async () => {
      const req = mockReq({ code: 'auth-code' })
      const res = mockRes()

      await oidcClient.ssoCallbackHandler(req, res)

      expect(res.statusCode).toBe(403)
      expect(res.body.error).toContain('CSRF')
    })

    it('should return 403 when state does not match store', async () => {
      const req = mockReq({ code: 'auth-code', state: 'unknown-state' })
      const res = mockRes()

      await oidcClient.ssoCallbackHandler(req, res)

      expect(res.statusCode).toBe(403)
      expect(res.body.error).toContain('CSRF')
    })

    it('should return 403 when state has expired (TTL exceeded)', async () => {
      const store = oidcClient._getStateStore()
      // Set state with a createdAt 6 minutes ago (past 5-min TTL)
      store.set('expired-state', { createdAt: Date.now() - 6 * 60 * 1000 })

      const req = mockReq({ code: 'auth-code', state: 'expired-state' })
      const res = mockRes()

      await oidcClient.ssoCallbackHandler(req, res)

      expect(res.statusCode).toBe(403)
      expect(res.body.error).toContain('CSRF')
      // State should be cleaned up
      expect(store.has('expired-state')).toBe(false)
    })

    it('should consume state after use (one-time use)', async () => {
      const store = oidcClient._getStateStore()
      store.set('one-time-state', { createdAt: Date.now() })

      // Mock fetch for token exchange
      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'iam-at',
          id_token: createFakeIdToken({ sub: 'user-1', name: 'Test', email: 'test@item.com' }),
        }),
      })

      const req = mockReq({ code: 'valid-code', state: 'one-time-state' })
      const res = mockRes()

      await oidcClient.ssoCallbackHandler(req, res)

      // State should be consumed
      expect(store.has('one-time-state')).toBe(false)

      globalThis.fetch = originalFetch
    })

    it('should redirect to /login on missing code (after valid state)', async () => {
      const store = oidcClient._getStateStore()
      store.set('valid-state', { createdAt: Date.now() })

      const req = mockReq({ state: 'valid-state' }) // no code
      const res = mockRes()

      await oidcClient.ssoCallbackHandler(req, res)

      expect(res.redirectUrl).toContain('/login')
      expect(res.redirectUrl).toContain('error=missing_code')
    })

    it('should redirect to /login when token exchange fails', async () => {
      const store = oidcClient._getStateStore()
      store.set('te-state', { createdAt: Date.now() })

      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      })

      const req = mockReq({ code: 'bad-code', state: 'te-state' })
      const res = mockRes()

      await oidcClient.ssoCallbackHandler(req, res)

      expect(res.redirectUrl).toContain('/login')
      expect(res.redirectUrl).toContain('error=token_exchange_failed')

      globalThis.fetch = originalFetch
    })

    it('should redirect to /login when fetch throws (network error)', async () => {
      const store = oidcClient._getStateStore()
      store.set('net-state', { createdAt: Date.now() })

      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const req = mockReq({ code: 'some-code', state: 'net-state' })
      const res = mockRes()

      await oidcClient.ssoCallbackHandler(req, res)

      expect(res.redirectUrl).toContain('/login')
      expect(res.redirectUrl).toContain('error=iam_service_error')

      globalThis.fetch = originalFetch
    })

    it('should redirect to /login when id_token is missing from IAM response', async () => {
      const store = oidcClient._getStateStore()
      store.set('no-id-state', { createdAt: Date.now() })

      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'iam-at' }), // no id_token
      })

      const req = mockReq({ code: 'some-code', state: 'no-id-state' })
      const res = mockRes()

      await oidcClient.ssoCallbackHandler(req, res)

      expect(res.redirectUrl).toContain('/login')
      expect(res.redirectUrl).toContain('error=no_id_token')

      globalThis.fetch = originalFetch
    })

    it('should redirect to frontend /auth/callback with tokens on success', async () => {
      const store = oidcClient._getStateStore()
      store.set('ok-state', { createdAt: Date.now() })

      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'iam-at',
          id_token: createFakeIdToken({ sub: 'sso-user-1', name: 'Alice', email: 'alice@item.com' }),
        }),
      })

      const req = mockReq({ code: 'valid-code', state: 'ok-state' })
      const res = mockRes()

      await oidcClient.ssoCallbackHandler(req, res)

      expect(res.redirectUrl).toContain('/auth/callback')
      expect(res.redirectUrl).toContain('accessToken=')
      expect(res.redirectUrl).toContain('refreshToken=')

      globalThis.fetch = originalFetch
    })
  })
})

// ── Test helpers ───────────────────────────────────────────

/**
 * Create a fake ID Token (unsigned JWT) for testing.
 * The OIDC client decodes without signature verification for intranet use.
 */
function createFakeIdToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = 'fake-signature'
  return `${header}.${body}.${signature}`
}
