import type { Risk, Report } from '@/types/platform'
import type {
  WecomMessage,
  WecomMarkdownMessage,
  WecomResponse,
  WecomTextMessage,
} from '@/types/wecom'

// ============================================================
// 企业微信推送客户端
// ============================================================

const RISK_LEVEL_EMOJI: Record<string, string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
}

const RISK_LEVEL_LABEL: Record<string, string> = {
  high: '高危',
  medium: '中危',
  low: '低危',
}

// 发送消息（通过 Vercel Serverless 代理）
async function sendMessage(message: WecomMessage): Promise<WecomResponse> {
  const response = await fetch('/api/wecom/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(
      errorBody.error ?? `企业微信推送失败: HTTP ${response.status}`
    )
  }

  return response.json() as Promise<WecomResponse>
}

// ============================================================
// 构建风险通知消息（文本格式）
// ============================================================
export function buildRiskNotification(risk: Risk): WecomTextMessage {
  const emoji = RISK_LEVEL_EMOJI[risk.level] ?? '⚠️'
  const levelLabel = RISK_LEVEL_LABEL[risk.level] ?? risk.level

  const lines = [
    `${emoji} [${levelLabel}风险] ${risk.description}`,
  ]

  if (risk.relatedIssueId) {
    lines.push(`关联任务: ${risk.relatedIssueId}`)
  }

  if (risk.assignee) {
    lines.push(`负责人: ${risk.assignee}`)
  }

  lines.push(`检测时间: ${new Date(risk.detectedAt).toLocaleString('zh-CN')}`)
  lines.push('请及时处理，避免影响 Sprint 交付。')

  return {
    msgtype: 'text',
    text: {
      content: lines.join('\n'),
    },
  }
}

// ============================================================
// 构建报告推送消息（Markdown 格式）
// ============================================================
export function buildReportMessage(report: Report): WecomMarkdownMessage {
  const typeLabel: Record<string, string> = {
    daily: '日报',
    weekly: '周报',
    sprint_review: 'Sprint 复盘报告',
  }

  const label = typeLabel[report.type] ?? report.type

  const content = [
    `## 📋 AI-PM Platform · ${label}`,
    '',
    `**${report.title}**（${report.date}）`,
    '',
    report.content,
    '',
    '---',
    '> 报告由 AI-PM 平台自动生成并推送',
  ].join('\n')

  return {
    msgtype: 'markdown',
    markdown: { content },
  }
}

// ============================================================
// 构建批量风险预警消息（Markdown 格式）
// ============================================================
export function buildRiskAlertMessage(risks: Risk[]): WecomMarkdownMessage {
  const highRisks = risks.filter((r) => r.level === 'high')
  const mediumRisks = risks.filter((r) => r.level === 'medium')

  const lines = [
    '## 🚨 AI-PM Platform · 风险自动预警',
    '',
    `当前存在 **${highRisks.length}** 个高危风险，**${mediumRisks.length}** 个中危风险，请及时处理：`,
    '',
  ]

  for (const risk of risks.slice(0, 5)) {
    // 最多展示 5 条
    const emoji = RISK_LEVEL_EMOJI[risk.level] ?? '⚠️'
    lines.push(`> ${emoji} ${risk.description}`)
    if (risk.assignee) {
      lines.push(`> 负责人: ${risk.assignee}`)
    }
    lines.push('')
  }

  lines.push('---')
  lines.push('> 本消息由系统自动推送')

  return {
    msgtype: 'markdown',
    markdown: { content: lines.join('\n') },
  }
}

// ============================================================
// 导出客户端对象
// ============================================================
export const wecomClient = {
  send: sendMessage,
  buildRiskNotification,
  buildReportMessage,
  buildRiskAlertMessage,
}
