// ============================================================
// 企业微信 Webhook 消息类型
// ============================================================

// 文本消息
export interface WecomTextMessage {
  msgtype: 'text'
  text: {
    content: string
    mentioned_list?: string[] // @成员列表（userid）
    mentioned_mobile_list?: string[] // @成员列表（手机号）
  }
}

// Markdown 消息
export interface WecomMarkdownMessage {
  msgtype: 'markdown'
  markdown: {
    content: string
  }
}

export type WecomMessage = WecomTextMessage | WecomMarkdownMessage

// 企业微信 API 响应
export interface WecomResponse {
  errcode: number // 0 表示成功
  errmsg: string // "ok" 表示成功
}

// 推送请求体（发送给后端代理）
export interface WecomSendRequest {
  message: WecomMessage
}
