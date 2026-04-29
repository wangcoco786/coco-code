/**
 * Rate Limiter — SSO 回调限流
 *
 * 针对 SSO 回调接口的请求频率限制:
 * - 15 分钟窗口
 * - 每 IP 最多 20 次请求
 * - 超限返回 429 + retryAfter
 *
 * Requirements: 8.1, 8.2
 */

import rateLimit from 'express-rate-limit'

/**
 * SSO callback rate limiter middleware.
 * Limits each IP to 20 requests per 15-minute window.
 */
export const ssoCallbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟窗口
  max: 20,                   // 每 IP 最多 20 次
  standardHeaders: true,     // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,      // Disable `X-RateLimit-*` headers
  message: (req, res) => {
    const retryAfter = res.getHeader('Retry-After') || Math.ceil(15 * 60)
    return {
      error: '请求过于频繁，请稍后再试',
      retryAfter: Number(retryAfter),
    }
  },
})
