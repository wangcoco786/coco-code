import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Jira Server API 代理
 *
 * 将 /api/jira/rest/api/2/... 的请求转发至 Jira Server，
 * 注入 PAT 鉴权头，避免前端直接暴露凭证和 CORS 问题。
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  // 仅允许 GET 和 POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 检查环境变量（支持 Basic Auth：用户名+密码，或 PAT）
  const { JIRA_BASE_URL, JIRA_USERNAME, JIRA_PASSWORD, JIRA_PAT } = process.env
  if (!JIRA_BASE_URL) {
    return res.status(500).json({
      error: 'Jira configuration missing',
      detail: 'JIRA_BASE_URL environment variable is required.',
    })
  }
  if (!JIRA_USERNAME && !JIRA_PAT) {
    return res.status(500).json({
      error: 'Jira auth configuration missing',
      detail: 'Either JIRA_USERNAME + JIRA_PASSWORD (Basic Auth) or JIRA_PAT (Bearer) is required.',
    })
  }

  // 构建鉴权头：优先 Basic Auth，其次 PAT
  const authHeader = JIRA_USERNAME
    ? `Basic ${Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD ?? ''}`).toString('base64')}`
    : `Bearer ${JIRA_PAT}`

  // 构建目标 URL
  // req.query.path 是通配路由捕获的路径段数组
  const pathSegments = req.query.path
  const pathStr = Array.isArray(pathSegments)
    ? pathSegments.join('/')
    : (pathSegments ?? '')

  // 保留查询字符串（去掉 path 参数本身）
  const queryParams = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue
    if (Array.isArray(value)) {
      value.forEach((v) => queryParams.append(key, v))
    } else if (value) {
      queryParams.set(key, value)
    }
  }

  const queryString = queryParams.toString()
  const targetUrl = `${JIRA_BASE_URL.replace(/\/$/, '')}/${pathStr}${queryString ? `?${queryString}` : ''}`

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    // POST 请求转发请求体
    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body)
    }

    const jiraResponse = await fetch(targetUrl, fetchOptions)

    // 透传非 2xx 状态码
    if (!jiraResponse.ok) {
      let errorBody: unknown
      try {
        errorBody = await jiraResponse.json()
      } catch {
        errorBody = { error: `Jira returned HTTP ${jiraResponse.status}` }
      }
      return res.status(jiraResponse.status).json(errorBody)
    }

    // 返回成功响应
    const data = await jiraResponse.json()
    return res.status(200).json(data)
  } catch (err) {
    // 网络错误（无法连接到 Jira Server）
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(502).json({
      error: 'Failed to reach Jira Server',
      detail: message,
    })
  }
}
