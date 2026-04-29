/**
 * OIDC Client — SSO 登录发起与回调处理
 *
 * 核心职责:
 * - ssoLoginHandler   生成 state、构造 Authorization URL、302 重定向到 IAM
 * - ssoCallbackHandler 验证 state、用 code 换取 IAM Token、提取用户信息、签发平台 Token
 *
 * Requirements: 1.2, 1.3, 2.1, 2.3, 2.4
 */

import { randomUUID } from 'crypto'
import { syncUserFromSSO, issuePlatformTokens } from './authService.js'

// ── State Session Store（内存，5 分钟 TTL）──────────────────

const STATE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/** @type {Map<string, { createdAt: number }>} */
const stateStore = new Map()

/**
 * Periodically clean expired states.
 * Runs every 60 seconds to avoid unbounded memory growth.
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, meta] of stateStore) {
    if (now - meta.createdAt > STATE_TTL_MS) {
      stateStore.delete(key)
    }
  }
}, 60_000)

// Allow the process to exit even if the interval is active
if (cleanupInterval.unref) {
  cleanupInterval.unref()
}

/** Expose for testing */
export function _getStateStore() {
  return stateStore
}

// ── OIDC 配置 helpers ──────────────────────────────────────

function getOIDCConfig() {
  return {
    clientId: process.env.IAM_CLIENT_ID,
    clientSecret: process.env.IAM_CLIENT_SECRET,
    issuerUrl: (process.env.IAM_ISSUER_URL || '').replace(/\/$/, ''),
    redirectUri: process.env.IAM_REDIRECT_URI,
    scopes: 'openid profile email',
  }
}

/**
 * Build the authorization endpoint URL.
 * Uses {issuerUrl}/authorize (can be overridden via discovery in the future).
 */
function getAuthorizationEndpoint(issuerUrl) {
  return `${issuerUrl}/authorize`
}

/**
 * Build the token endpoint URL.
 * Uses {issuerUrl}/oauth/token (can be overridden via discovery in the future).
 */
function getTokenEndpoint(issuerUrl) {
  return `${issuerUrl}/oauth/token`
}

// ── ssoLoginHandler ────────────────────────────────────────

/**
 * GET /api/auth/sso/login
 *
 * 1. Generate a random state value
 * 2. Store state in the in-memory session store (5-min TTL)
 * 3. Construct the Authorization URL with required OIDC params
 * 4. 302 redirect the user to IAM
 */
export function ssoLoginHandler(req, res) {
  const config = getOIDCConfig()

  if (!config.clientId || !config.issuerUrl || !config.redirectUri) {
    console.error('[OIDC] IAM 环境变量未完整配置')
    return res.status(500).json({ error: 'IAM SSO 配置不完整' })
  }

  // Generate unique state for CSRF protection
  const state = randomUUID()
  stateStore.set(state, { createdAt: Date.now() })

  const authUrl = new URL(getAuthorizationEndpoint(config.issuerUrl))
  authUrl.searchParams.set('client_id', config.clientId)
  authUrl.searchParams.set('redirect_uri', config.redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', config.scopes)
  authUrl.searchParams.set('state', state)

  return res.redirect(authUrl.toString())
}

// ── ssoCallbackHandler ─────────────────────────────────────

/**
 * GET /api/auth/sso/callback?code=xxx&state=yyy
 *
 * 1. Validate state against the session store (CSRF protection)
 * 2. Exchange authorization code for IAM tokens (POST to token endpoint)
 * 3. Decode ID Token and extract user info (sub, name, email)
 * 4. Sync user via authService.syncUserFromSSO
 * 5. Issue platform tokens via authService.issuePlatformTokens
 * 6. Redirect to frontend callback route with tokens
 */
export async function ssoCallbackHandler(req, res) {
  const { code, state } = req.query || {}

  // ── 1. Validate state ──
  if (!state || !stateStore.has(state)) {
    return res.status(403).json({ error: 'CSRF 验证失败' })
  }

  // Check TTL
  const stateMeta = stateStore.get(state)
  const now = Date.now()
  if (now - stateMeta.createdAt > STATE_TTL_MS) {
    stateStore.delete(state)
    return res.status(403).json({ error: 'CSRF 验证失败' })
  }

  // Consume the state (one-time use)
  stateStore.delete(state)

  if (!code) {
    return res.redirect('/login?error=missing_code')
  }

  // ── 2. Exchange code for IAM tokens ──
  const config = getOIDCConfig()
  const tokenEndpoint = getTokenEndpoint(config.issuerUrl)

  let iamTokens
  try {
    const tokenRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }).toString(),
    })

    if (!tokenRes.ok) {
      console.error('[OIDC] Token exchange failed:', tokenRes.status)
      return res.redirect('/login?error=token_exchange_failed')
    }

    iamTokens = await tokenRes.json()
  } catch (err) {
    console.error('[OIDC] Token exchange error:', err.message)
    return res.redirect('/login?error=iam_service_error')
  }

  // ── 3. Decode ID Token and extract user info ──
  const idToken = iamTokens.id_token
  if (!idToken) {
    console.error('[OIDC] No id_token in IAM response')
    return res.redirect('/login?error=no_id_token')
  }

  let userInfo
  try {
    userInfo = decodeIdToken(idToken)
  } catch (err) {
    console.error('[OIDC] ID Token decode error:', err.message)
    return res.redirect('/login?error=invalid_id_token')
  }

  // ── 4. Sync user from SSO ──
  let platformUser
  try {
    platformUser = await syncUserFromSSO({
      sub: userInfo.sub,
      name: userInfo.name || userInfo.preferred_username || 'Unknown',
      email: userInfo.email || '',
    })
  } catch (err) {
    console.error('[OIDC] User sync error:', err.message)
    return res.redirect('/login?error=user_sync_failed')
  }

  // ── 5. Issue platform tokens ──
  let tokens
  try {
    tokens = issuePlatformTokens(platformUser)
  } catch (err) {
    console.error('[OIDC] Token issuance error:', err.message)
    return res.redirect('/login?error=token_issue_failed')
  }

  // ── 6. Redirect to frontend with tokens ──
  const callbackUrl = new URL('/auth/callback', getBaseUrl(req))
  callbackUrl.searchParams.set('accessToken', tokens.accessToken)
  callbackUrl.searchParams.set('refreshToken', tokens.refreshToken)

  return res.redirect(callbackUrl.toString())
}

// ── Helpers ────────────────────────────────────────────────

/**
 * Decode an ID Token (JWT) without full signature verification against IAM keys.
 * In production, you should verify the signature using the IAM's JWKS endpoint.
 * For internal/intranet deployments, we decode and extract claims.
 *
 * @param {string} idToken
 * @returns {{ sub: string, name?: string, email?: string, preferred_username?: string }}
 */
function decodeIdToken(idToken) {
  const parts = idToken.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format')
  }

  const payload = JSON.parse(
    Buffer.from(parts[1], 'base64url').toString('utf-8')
  )

  if (!payload.sub) {
    throw new Error('ID Token missing sub claim')
  }

  return payload
}

/**
 * Derive the base URL from the incoming request for building redirect URLs.
 */
function getBaseUrl(req) {
  const protocol = req.protocol || 'http'
  const host = req.get('host') || 'localhost:3000'
  return `${protocol}://${host}`
}

// ── Exports for testing ────────────────────────────────────

export { getOIDCConfig as _getOIDCConfig }
export { decodeIdToken as _decodeIdToken }
export { getAuthorizationEndpoint as _getAuthorizationEndpoint }
export { getTokenEndpoint as _getTokenEndpoint }
