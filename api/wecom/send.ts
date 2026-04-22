import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * 企业微信 Webhook 推送代理
 *
 * 将消息转发至企业微信 Webhook，避免前端直接暴露 Webhook URL。
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  // 仅允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 检查环境变量
  const { WECOM_WEBHOOK_URL } = process.env
  if (!WECOM_WEBHOOK_URL) {
    return res.status(500).json({
      error: 'WeCom configuration missing',
      detail:
        'WECOM_WEBHOOK_URL environment variable is required. Please configure it in Vercel dashboard.',
    })
  }

  // 获取消息体
  const { message } = req.body ?? {}
  if (!message) {
    return res.status(400).json({ error: 'Missing message in request body' })
  }

  try {
    const wecomResponse = await fetch(WECOM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    const data = await wecomResponse.json()

    // 企业微信返回 errcode !== 0 表示失败
    if (data.errcode !== 0) {
      return res.status(400).json({
        error: `WeCom API error: ${data.errmsg}`,
        errcode: data.errcode,
      })
    }

    return res.status(200).json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(502).json({
      error: 'Failed to reach WeCom webhook',
      detail: message,
    })
  }
}
