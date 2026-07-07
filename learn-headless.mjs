/**
 * Day 3 学习：Headless Agent
 * 
 * Headless = Agent 在后台自主运行，没有用户界面，不需要人在旁边。
 * 
 * 对比：
 * - 有界面模式：人输入 → Agent 响应 → 人再输入（像聊天）
 * - Headless 模式：触发条件满足 → Agent 自动完成整个任务 → 通知人结果
 * 
 * 这个文件演示三种 Headless 触发方式：
 * 1. 定时触发（Cron）— 每天9点自动执行
 * 2. 事件触发（Event）— Jira 状态变化时自动执行
 * 3. API 触发 — 外部系统调用时执行
 * 
 * 运行方式：node learn-headless.mjs
 */

// ============================================================
// 复用 Day 2 的 Harness 基础设施
// ============================================================
const TOOL_REGISTRY = {
  queryJira: {
    name: 'queryJira',
    fn: async ({ project, daysStale }) => {
      console.log(`    [工具] 查询 ${project} 中超过 ${daysStale} 天未更新的 tickets`)
      // 模拟返回
      return [
        { key: `${project}-200`, summary: '接口超时优化', developer: 'Zhenyan Wang', daysSinceUpdate: daysStale + 1 },
        { key: `${project}-201`, summary: '权限校验异常', developer: 'Peng Li', daysSinceUpdate: daysStale },
      ]
    }
  },
  analyzeWithLLM: {
    name: 'analyzeWithLLM',
    fn: async ({ tickets }) => {
      console.log(`    [工具] LLM 分析 ${tickets.length} 个 tickets 的停滞原因...`)
      // 模拟 LLM 分析
      return tickets.map(t => ({
        ...t,
        aiReason: t.daysSinceUpdate > 4 ? '可能被阻塞，建议 escalate' : '正常开发周期内',
        aiSuggestion: t.daysSinceUpdate > 4 ? '建议团队 lead 介入' : '继续观察',
      }))
    }
  },
  pushNotification: {
    name: 'pushNotification',
    fn: async ({ channel, message }) => {
      console.log(`    [工具] 推送到 ${channel}:`)
      console.log(`           "${message.substring(0, 80)}..."`)
      return { success: true, timestamp: new Date().toISOString() }
    }
  }
}

// Harness 配置
const harness = {
  maxIterations: 10,
  allowedTools: ['queryJira', 'analyzeWithLLM', 'pushNotification'],
  log: (msg) => console.log(`  [Harness] ${msg}`),
}

// Agent Loop 执行器
async function executeAgentLoop(steps) {
  const results = []
  for (let i = 0; i < steps.length && i < harness.maxIterations; i++) {
    const step = steps[i]
    harness.log(`Loop ${i + 1}/${steps.length}: ${step.tool}`)
    const tool = TOOL_REGISTRY[step.tool]
    const result = await tool.fn(step.params)
    results.push({ step: step.tool, result })
  }
  return results
}

// ============================================================
// 1. 定时触发（Cron）— 你的 server.js 每天9点推送就是这个
// ============================================================
async function cronTriggeredAgent() {
  console.log('\n┌─────────────────────────────────────────────────────────┐')
  console.log('│ 触发方式：定时 Cron（模拟每天 9:00 自动执行）            │')
  console.log('│ 特点：无需人工干预，到点就跑                             │')
  console.log('└─────────────────────────────────────────────────────────┘\n')

  const now = new Date()
  console.log(`  ⏰ 触发时间: ${now.toLocaleString('zh-CN')}`)
  console.log(`  🤖 Agent 自动启动，无需人工输入...\n`)

  // Agent 自主决定执行步骤（没有人参与）
  const steps = [
    { tool: 'queryJira', params: { project: 'RP', daysStale: 3 } },
    { tool: 'analyzeWithLLM', params: { tickets: [] } }, // 会被下面覆盖
    { tool: 'pushNotification', params: { channel: '企微群', message: '' } },
  ]

  // Step 1: 查数据
  harness.log('Loop 1/3: queryJira')
  const tickets = await TOOL_REGISTRY.queryJira.fn({ project: 'RP', daysStale: 3 })

  // Step 2: AI 分析
  harness.log('Loop 2/3: analyzeWithLLM')
  const analyzed = await TOOL_REGISTRY.analyzeWithLLM.fn({ tickets })

  // Step 3: 推送结果
  const message = analyzed.map(t => 
    `${t.key} ${t.summary} (${t.developer}, ${t.daysSinceUpdate}天) → ${t.aiSuggestion}`
  ).join('\n')
  harness.log('Loop 3/3: pushNotification')
  await TOOL_REGISTRY.pushNotification.fn({ channel: '企微群', message })

  console.log(`\n  ✅ 定时任务完成，全程无人干预`)
}

// ============================================================
// 2. 事件触发（Event）— Jira Webhook 触发
// ============================================================
async function eventTriggeredAgent(event) {
  console.log('\n┌─────────────────────────────────────────────────────────┐')
  console.log('│ 触发方式：事件 Event（Jira Webhook 推送）                │')
  console.log('│ 特点：实时响应，状态变化立刻分析                         │')
  console.log('└─────────────────────────────────────────────────────────┘\n')

  console.log(`  📨 收到事件: ${event.type}`)
  console.log(`     Ticket: ${event.issueKey}`)
  console.log(`     变更: ${event.from} → ${event.to}`)
  console.log(`  🤖 Agent 自动响应...\n`)

  // Agent 根据事件类型自主决定要做什么
  if (event.type === 'status_change' && event.to === 'Blocked') {
    harness.log('检测到 Blocked 状态，启动风险分析...')
    
    const analyzed = await TOOL_REGISTRY.analyzeWithLLM.fn({
      tickets: [{ key: event.issueKey, summary: event.summary, daysSinceUpdate: 0 }]
    })

    const message = `⚠️ ${event.issueKey} 被标记为 Blocked！\n原因分析: ${analyzed[0].aiReason}\n建议: ${analyzed[0].aiSuggestion}`
    await TOOL_REGISTRY.pushNotification.fn({ channel: '企微群-紧急', message })

    console.log(`\n  ✅ 事件处理完成，从收到事件到推送通知全程自动`)
  }
}

// ============================================================
// 3. API 触发 — 外部系统调用
// ============================================================
async function apiTriggeredAgent(request) {
  console.log('\n┌─────────────────────────────────────────────────────────┐')
  console.log('│ 触发方式：API 调用（POST /api/agent/analyze）            │')
  console.log('│ 特点：按需调用，其他系统可以触发                         │')
  console.log('└─────────────────────────────────────────────────────────┘\n')

  console.log(`  📡 收到 API 请求: POST /api/agent/analyze`)
  console.log(`     参数: project=${request.project}`)
  console.log(`  🤖 Agent 执行分析...\n`)

  // 完整执行 Loop
  const tickets = await TOOL_REGISTRY.queryJira.fn({ project: request.project, daysStale: 2 })
  const analyzed = await TOOL_REGISTRY.analyzeWithLLM.fn({ tickets })

  // API 模式：返回结构化结果（不推送，由调用方决定怎么用）
  const response = {
    status: 'success',
    project: request.project,
    analyzedAt: new Date().toISOString(),
    results: analyzed,
  }

  console.log(`\n  ✅ API 响应:`)
  console.log(`     ${JSON.stringify(response, null, 2).split('\n').join('\n     ')}`)
  
  return response
}

// ============================================================
// 运行三个演示
// ============================================================
console.log('═'.repeat(60))
console.log('🎓 Day 3：Headless Agent — 三种触发方式')
console.log('═'.repeat(60))
console.log(`
  Headless 的核心：Agent 不需要用户界面，后台自主运行。
  区别只在于"谁触发了它"：
  
  1. ⏰ 定时触发 → 你的 server.js 每天9点推送
  2. 📨 事件触发 → Jira Webhook、企微消息
  3. 📡 API 触发  → 其他系统按需调用
`)

// 演示 1：定时触发
await cronTriggeredAgent()

// 演示 2：事件触发（模拟收到 Jira Webhook）
await eventTriggeredAgent({
  type: 'status_change',
  issueKey: 'RP-300',
  summary: '支付接口重构',
  from: 'In Progress',
  to: 'Blocked',
})

// 演示 3：API 触发
await apiTriggeredAgent({ project: 'APS' })

// 总结
console.log(`
${'═'.repeat(60)}
📝 Day 3 学习总结：Headless Agent

核心区别：
┌─────────────┬──────────────────────────────────────┐
│ 传统模式     │ 人坐在电脑前 → 输入问题 → 等回复      │
│ Headless    │ 触发条件满足 → Agent 自动跑 → 通知人   │
└─────────────┴──────────────────────────────────────┘

三种触发方式：
  ⏰ Cron    — 定时执行（每天9点、每小时等）
  📨 Event   — 事件驱动（Webhook、消息队列）
  📡 API     — 按需调用（REST API、CLI）

你的 AI-PM 平台现状：
  ✅ 已有 Cron 触发（每天9点停滞推送）
  ❌ 缺 Event 触发（应接 Jira Webhook 实时响应）
  ❌ 缺 API 触发（应暴露 /api/agent/analyze 端点）
  ❌ 缺 LLM 分析（现在只是查数据+推送，没有 AI 推理）

下一步升级路径：
  定时推送 + LLM 分析 = 智能日报
  Jira Webhook + Agent = 实时风险响应
  API 端点 + Agent = 其他系统可调用的 AI 能力

🔑 核心认知：
  Headless 不是新技术，是部署模式。
  你的 server.js 定时推送已经是 Headless 的雏形，
  加上 LLM 推理能力就变成了真正的 Headless Agent。
${'═'.repeat(60)}
`)
