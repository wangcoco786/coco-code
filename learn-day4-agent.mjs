/**
 * Day 4：完整 Headless Agent — 智能停滞分析推送
 * 
 * 三层架构全部串联：
 * - Headless：定时触发，无需人工干预
 * - Harness：工具注册、权限管控、循环限制、日志
 * - Loop：查 Jira → LLM 分析 → 生成报告 → 推送企微
 * 
 * 运行方式：node learn-day4-agent.mjs
 * 
 * 注意：这个 Demo 接真实 Jira API，LLM 用模拟（可替换为真实 API）
 */

import 'dotenv/config'

// ============================================================
// 第一层：工具注册表（Tool Registry）
// ============================================================
const TOOLS = {
  // 工具 1：查询 Jira 停滞 tickets（真实 API）
  queryStaleTickets: {
    name: 'queryStaleTickets',
    description: '查询指定项目中超过3天未更新的活跃 Sprint tickets',
    dangerous: false,
    fn: async ({ project }) => {
      const { JIRA_BASE_URL, JIRA_USERNAME, JIRA_PASSWORD } = process.env
      if (!JIRA_BASE_URL || !JIRA_USERNAME) {
        return { error: 'Jira 未配置', tickets: [] }
      }

      const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD ?? ''}`).toString('base64')
      const jql = `project = ${project} AND sprint in openSprints() AND statusCategory != Done AND updated <= -3d ORDER BY updated ASC`
      const url = `${JIRA_BASE_URL}/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary,assignee,updated,status,customfield_11103,customfield_11000&maxResults=20`

      const res = await fetch(url, {
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      })

      if (!res.ok) return { error: `Jira API ${res.status}`, tickets: [] }

      const data = await res.json()
      const tickets = (data.issues ?? []).map(issue => {
        const dev11000 = issue.fields?.customfield_11000
        const dev11103 = issue.fields?.customfield_11103
        let developer = null
        if (dev11000 && typeof dev11000 === 'object') {
          const d = Array.isArray(dev11000) ? dev11000[0] : dev11000
          if (d?.displayName) developer = d.displayName
        }
        if (!developer && Array.isArray(dev11103) && dev11103[0]?.displayName) {
          developer = dev11103[0].displayName
        }
        const responsible = developer || issue.fields?.assignee?.displayName || '未分配'

        const daysSinceUpdate = Math.floor((Date.now() - new Date(issue.fields?.updated).getTime()) / 86400000)

        return {
          key: issue.key,
          summary: issue.fields?.summary ?? '',
          responsible,
          status: issue.fields?.status?.name ?? '',
          daysSinceUpdate,
        }
      })

      return { error: null, tickets }
    }
  },

  // 工具 2：LLM 分析停滞原因（模拟 — 可替换为真实 LLM API）
  analyzeCauses: {
    name: 'analyzeCauses',
    description: '用 LLM 分析每个 ticket 的停滞原因并给出建议',
    dangerous: false,
    fn: async ({ tickets }) => {
      // 模拟 LLM 推理（实际可接 OpenAI/Claude API）
      // 根据停滞天数和状态做简单推理
      return tickets.map(t => {
        let reason, suggestion, urgency
        if (t.daysSinceUpdate >= 7) {
          reason = '严重停滞，超过一周无进展'
          suggestion = '建议团队 Lead 立即介入，确认是否被阻塞或需要重新评估'
          urgency = '🔴 高'
        } else if (t.daysSinceUpdate >= 5) {
          reason = '中度停滞，可能遇到技术障碍或依赖阻塞'
          suggestion = '建议负责人更新进展说明，如有阻塞请升级处理'
          urgency = '🟡 中'
        } else {
          reason = '轻度停滞，可能在复杂开发中'
          suggestion = '请负责人确认是否正常，更新 Jira 状态'
          urgency = '🟢 低'
        }
        return { ...t, reason, suggestion, urgency }
      })
    }
  },

  // 工具 3：生成智能报告
  generateReport: {
    name: 'generateReport',
    description: '将分析结果组装为结构化的企微 Markdown 消息',
    dangerous: false,
    fn: async ({ project, analyzedTickets, triggerTime }) => {
      if (analyzedTickets.length === 0) {
        return { message: null, summary: '无停滞 tickets' }
      }

      const highCount = analyzedTickets.filter(t => t.daysSinceUpdate >= 7).length
      const midCount = analyzedTickets.filter(t => t.daysSinceUpdate >= 5 && t.daysSinceUpdate < 7).length
      const lowCount = analyzedTickets.filter(t => t.daysSinceUpdate < 5).length

      const lines = [
        `## 🤖 AI-PM Agent · 智能停滞分析`,
        ``,
        `> ${triggerTime} · 项目 ${project} · 共 **${analyzedTickets.length}** 个停滞任务`,
        `> 🔴 高风险 ${highCount} · 🟡 中风险 ${midCount} · 🟢 低风险 ${lowCount}`,
        ``,
      ]

      for (const t of analyzedTickets.slice(0, 8)) {
        lines.push(`### ${t.urgency} ${t.key} — ${t.summary}`)
        lines.push(`> 负责人: **${t.responsible}** · ${t.daysSinceUpdate}天未更新 · ${t.status}`)
        lines.push(`> 📋 原因: ${t.reason}`)
        lines.push(`> 💡 建议: ${t.suggestion}`)
        lines.push(``)
      }

      if (analyzedTickets.length > 8) {
        lines.push(`> ... 还有 ${analyzedTickets.length - 8} 个未列出`)
        lines.push(``)
      }

      lines.push(`---`)
      lines.push(`> 🤖 此报告由 AI-PM Agent 自动生成（Harness + Loop + Headless）`)

      const message = { msgtype: 'markdown', markdown: { content: lines.join('\n') } }
      return { message, summary: `${analyzedTickets.length} tickets 分析完成` }
    }
  },

  // 工具 4：推送企微（标记为 dangerous，需要审批）
  pushToWecom: {
    name: 'pushToWecom',
    description: '推送消息到企微群 Webhook',
    dangerous: true,  // 需要 Harness 审批
    fn: async ({ message, webhookUrl }) => {
      if (!webhookUrl) {
        return { success: false, error: '未配置 Webhook URL' }
      }

      // Demo 模式：不真正发送，只打印
      console.log(`    [真实推送] 目标: ${webhookUrl.substring(0, 50)}...`)
      console.log(`    [真实推送] 内容预览: ${message.markdown.content.substring(0, 100)}...`)
      
      // 如果要真正发送，取消下面注释：
      // const res = await fetch(webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(message),
      // })
      // const result = await res.json()
      // return { success: result.errcode === 0, error: result.errmsg }

      return { success: true, error: null, mode: 'demo（未真正发送）' }
    }
  },
}

// ============================================================
// 第二层：Harness 管控配置
// ============================================================
const HARNESS = {
  name: 'AI-PM StaleAlert Agent',
  version: '1.0.0',
  maxIterations: 10,
  allowedTools: ['queryStaleTickets', 'analyzeCauses', 'generateReport', 'pushToWecom'],
  requireApproval: ['pushToWecom'],  // 推送需要审批
  retryLimit: 2,
  
  // 执行日志
  logs: [],
  
  log(level, msg) {
    const entry = { time: new Date().toISOString(), level, msg }
    this.logs.push(entry)
    const icon = level === 'info' ? '📋' : level === 'warn' ? '⚠️' : level === 'error' ? '❌' : '✅'
    console.log(`  ${icon} [${level.toUpperCase()}] ${msg}`)
  },

  // Before Hook：权限检查 + 审批
  async beforeAction(toolName) {
    if (!this.allowedTools.includes(toolName)) {
      this.log('error', `工具 "${toolName}" 不在允许列表，已拦截`)
      throw new Error(`Guardrail: ${toolName} blocked`)
    }
    if (this.requireApproval.includes(toolName)) {
      this.log('warn', `"${toolName}" 需要审批 → Demo 模式自动批准`)
    }
    this.log('info', `执行工具: ${toolName}`)
  },

  // After Hook：记录结果
  afterAction(toolName, success) {
    this.log(success ? 'success' : 'error', `${toolName} ${success ? '成功' : '失败'}`)
  },
}

// ============================================================
// 第三层：Agent Loop — 核心执行逻辑
// ============================================================
async function agentLoop(task) {
  const { project, webhookUrl } = task
  let iteration = 0
  const context = {}

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`🤖 ${HARNESS.name} v${HARNESS.version}`)
  console.log(`   任务: 分析 ${project} 项目停滞 tickets`)
  console.log(`   限制: 最大 ${HARNESS.maxIterations} 轮 Loop`)
  console.log(`${'═'.repeat(60)}\n`)

  // --- Loop 第 1 轮：查询 Jira ---
  iteration++
  console.log(`\n--- Loop ${iteration}: 查询停滞 Tickets ---`)
  await HARNESS.beforeAction('queryStaleTickets')
  const { tickets, error } = await TOOLS.queryStaleTickets.fn({ project })
  HARNESS.afterAction('queryStaleTickets', !error)

  if (error) {
    HARNESS.log('error', `查询失败: ${error}，Agent 终止`)
    return { success: false, error }
  }
  if (tickets.length === 0) {
    HARNESS.log('success', `${project} 无停滞 tickets，Agent 完成`)
    return { success: true, message: '无停滞任务' }
  }
  context.tickets = tickets
  console.log(`    → 找到 ${tickets.length} 个停滞 tickets`)

  // --- Loop 第 2 轮：LLM 分析 ---
  iteration++
  console.log(`\n--- Loop ${iteration}: AI 分析停滞原因 ---`)
  await HARNESS.beforeAction('analyzeCauses')
  const analyzed = await TOOLS.analyzeCauses.fn({ tickets: context.tickets })
  HARNESS.afterAction('analyzeCauses', true)
  context.analyzed = analyzed
  console.log(`    → 分析完成，高风险 ${analyzed.filter(t => t.daysSinceUpdate >= 7).length} 个`)

  // --- Loop 第 3 轮：生成报告 ---
  iteration++
  console.log(`\n--- Loop ${iteration}: 生成智能报告 ---`)
  await HARNESS.beforeAction('generateReport')
  const { message, summary } = await TOOLS.generateReport.fn({
    project,
    analyzedTickets: context.analyzed,
    triggerTime: new Date().toLocaleString('zh-CN'),
  })
  HARNESS.afterAction('generateReport', true)
  context.message = message
  console.log(`    → ${summary}`)

  // --- Loop 第 4 轮：推送企微 ---
  if (message) {
    iteration++
    console.log(`\n--- Loop ${iteration}: 推送企微群 ---`)
    await HARNESS.beforeAction('pushToWecom')
    const pushResult = await TOOLS.pushToWecom.fn({ message, webhookUrl })
    HARNESS.afterAction('pushToWecom', pushResult.success)
    console.log(`    → 推送${pushResult.success ? '成功' : '失败'} (${pushResult.mode || ''})`)
  }

  // --- 完成 ---
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`✅ Agent 完成 | 共 ${iteration} 轮 Loop | ${tickets.length} tickets 分析并推送`)
  console.log(`${'═'.repeat(60)}`)

  // 打印完整报告预览
  if (message) {
    console.log(`\n📄 报告预览：`)
    console.log('─'.repeat(50))
    console.log(message.markdown.content)
    console.log('─'.repeat(50))
  }

  return { success: true, iterations: iteration, ticketCount: tickets.length }
}

// ============================================================
// Headless 触发层 — 模拟定时触发
// ============================================================
console.log(`
╔══════════════════════════════════════════════════════════╗
║  Day 4：完整 Headless Agent 实战                        ║
║  Headless（定时触发）+ Harness（管控）+ Loop（执行）     ║
╚══════════════════════════════════════════════════════════╝

  模拟场景：每天 9:00 自动触发，分析 RP 项目停滞 tickets
  触发方式：Cron（Headless，无需人工干预）
`)

// 模拟 Headless 定时触发
const triggerTime = new Date()
console.log(`⏰ [Headless] 定时触发: ${triggerTime.toLocaleString('zh-CN')}`)
console.log(`   无需人工输入，Agent 自主启动...\n`)

// 执行 Agent
const result = await agentLoop({
  project: 'RP',
  webhookUrl: process.env.DAILY_PUSH_WEBHOOK_URL || 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=demo',
})

// 打印执行日志
console.log(`\n📊 Harness 执行日志 (共 ${HARNESS.logs.length} 条):`)
for (const log of HARNESS.logs) {
  console.log(`   ${log.time.slice(11, 19)} [${log.level}] ${log.msg}`)
}

console.log(`
╔══════════════════════════════════════════════════════════╗
║  Day 4 总结                                             ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  你刚才看到的就是完整的三层架构：                         ║
║                                                          ║
║  1. Headless — 定时触发，无人值守                        ║
║     → 模拟每天9点 Cron 自动启动                          ║
║                                                          ║
║  2. Harness — 管控每一步                                 ║
║     → 工具注册: 4个工具（query/analyze/report/push）     ║
║     → 权限管控: pushToWecom 标记为 dangerous             ║
║     → 日志记录: 每步 before/after 都有记录               ║
║     → 循环限制: maxIterations = 10                       ║
║                                                          ║
║  3. Loop — 自主执行4轮                                   ║
║     → 查 Jira → AI分析 → 生报告 → 推企微                ║
║     → 每轮有明确的输入输出                               ║
║                                                          ║
║  对比你现有的 server.js 每日推送：                        ║
║  - 现在：查数据 → 直接推列表（无 AI，无管控）            ║
║  - Agent：查数据 → AI分析原因 → 生成建议 → 管控推送     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`)
