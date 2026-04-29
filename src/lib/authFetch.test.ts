import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authFetch } from './authFetch'
import * as tokenManager from './tokenManager'

// Mock tokenManager
vi.mock('./tokenManager', () => ({
  getAccessToken: vi.fn(),
  refreshAccessToken: vi.fn(),
  clearTokens: vi.fn(),
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Capture window.location.href assignments
const locationHrefSpy = vi.fn()
const originalLocation = window.location
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, href: '' },
    writable: true,
    configurable: true,
  })
  Object.defineProperty(window.location, 'href', {
    set: locationHrefSpy,
    get: () => '',
    configurable: true,
  })
})

beforeEach(() => {
  vi.clearAllMocks()
})

function makeResponse(status: number, headers: Record<string, string> = {}): Response {
  return new Response(null, { status, headers })
}

describe('authFetch', () => {
  it('injects Authorization header with Bearer token', async () => {
    vi.mocked(tokenManager.getAccessToken).mockReturnValue('my-token')
    mockFetch.mockResolvedValue(makeResponse(200))

    await authFetch('/api/data')

    const [, opts] = mockFetch.mock.calls[0]
    const headers = new Headers(opts.headers)
    expect(headers.get('Authorization')).toBe('Bearer my-token')
  })

  it('sends request without Authorization when no token', async () => {
    vi.mocked(tokenManager.getAccessToken).mockReturnValue(null)
    mockFetch.mockResolvedValue(makeResponse(200))

    await authFetch('/api/data')

    const [, opts] = mockFetch.mock.calls[0]
    const headers = new Headers(opts.headers)
    expect(headers.get('Authorization')).toBeNull()
  })

  it('returns response directly on success', async () => {
    vi.mocked(tokenManager.getAccessToken).mockReturnValue('tok')
    const okResponse = makeResponse(200)
    mockFetch.mockResolvedValue(okResponse)

    const result = await authFetch('/api/data')
    expect(result.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('returns 401 directly when X-Token-Expired is not set', async () => {
    vi.mocked(tokenManager.getAccessToken).mockReturnValue('tok')
    mockFetch.mockResolvedValue(makeResponse(401))

    const result = await authFetch('/api/data')
    expect(result.status).toBe(401)
    expect(tokenManager.refreshAccessToken).not.toHaveBeenCalled()
  })

  it('refreshes token and retries on 401 + X-Token-Expired', async () => {
    vi.mocked(tokenManager.getAccessToken)
      .mockReturnValueOnce('old-token')
      .mockReturnValueOnce('new-token')
    vi.mocked(tokenManager.refreshAccessToken).mockResolvedValue('new-token')

    const expiredResponse = makeResponse(401, { 'X-Token-Expired': 'true' })
    const okResponse = makeResponse(200)
    mockFetch.mockResolvedValueOnce(expiredResponse).mockResolvedValueOnce(okResponse)

    const result = await authFetch('/api/data')

    expect(tokenManager.refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result.status).toBe(200)
  })

  it('clears tokens and redirects to /login when refresh fails', async () => {
    vi.mocked(tokenManager.getAccessToken).mockReturnValue('old-token')
    vi.mocked(tokenManager.refreshAccessToken).mockRejectedValue(new Error('fail'))

    const expiredResponse = makeResponse(401, { 'X-Token-Expired': 'true' })
    mockFetch.mockResolvedValue(expiredResponse)

    await authFetch('/api/data')

    expect(tokenManager.clearTokens).toHaveBeenCalledTimes(1)
    expect(locationHrefSpy).toHaveBeenCalledWith('/login')
    // Should NOT retry after failed refresh
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('preserves custom headers from caller', async () => {
    vi.mocked(tokenManager.getAccessToken).mockReturnValue('tok')
    mockFetch.mockResolvedValue(makeResponse(200))

    await authFetch('/api/data', {
      headers: { 'Content-Type': 'application/json' },
    })

    const [, opts] = mockFetch.mock.calls[0]
    const headers = new Headers(opts.headers)
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('Authorization')).toBe('Bearer tok')
  })

  it('preserves request method and body', async () => {
    vi.mocked(tokenManager.getAccessToken).mockReturnValue('tok')
    mockFetch.mockResolvedValue(makeResponse(200))

    await authFetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
    })

    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/data')
    expect(opts.method).toBe('POST')
    expect(opts.body).toBe('{"key":"value"}')
  })
})
