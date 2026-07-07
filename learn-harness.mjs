/**
 * Day 2 学习：Mini Agent Harness
 * 
 * 这个文件演示了 Harness 的四个核心管控能力：
 * 1. 工具注册表（Tool Registry）
 * 2. 最大循环次数限制（Max Iterations）
 * 3. 每步执行前的日志（Lifecycle Hooks）
 * 4. 错误处理和重试（Error Handling）
 * 
 * 运行方式：node learn-harness.mjs
 */

// ============================================================
// 1. 工具注册表 — 定义 Agent 能用哪些工具
// ============================================================
const TOOL_REGISTRY = {
  // 每个工具有：名称、描述、执行函数
  queryJira: {
    name: 'queryJira',
    description: '查询 Jira 中停滞的 tickets',
    fn: async (params) => {
      // 模拟 Jira 查询
      console.log(`    [工具执行] 查询 Jira: project=${params.project}`)
      return [
        { key: 'RP-100', summary: '用户登录超时', assignee: 'Zhang Wei', daysSinceUpdate: 5 },
        { key: 'RP-101', summary: '报表导出失败', assignee: 'Li Ming', daysSinceUpdate: 3 },
      ]
    }
  },
  analyzeCause: {
    name: 'analyzeCause',
    description: '分析 ticket 停滞原因',
    fn: async (params) => {
      console.log(`    [工具执行] 分析原因: ${params.ticketKey}`)
      // 模拟 LLM 分析
      const reasons = {
        'RP-100': '依赖第三方 API 更新，等待供应商响应',
        'RP-101': '需求变更导致返工，范围扩大了 30%',
      }
      return reasons[params.ticketKey] || '原因未知'
    }
  },
  pushWecom: {
    name: 'pushWecom',
    description: '推送消息到企微群',
    fn: async (params) => {
      console.log(`    [工具执行] 推送企微: ${params.message.substring(0, 50)}...`)
      return { success: true }
    }
  },
  // 这个工具故意设计成会失败的，用于演示错误处理
  deleteFile: {
    name: 'deleteFile',
    description: '删除文件（危险操作）',
    fn: async () => {
      throw new Error('权限不足：Agent 不允许执行删除操作')
    }
  }
}

// ============================================================
// 2. Harness 配置 — 管控规则
// ============================================================
const HARNESS_CONFIG = {
  maxIterations: 5,            // 最大循环次数
  allowedTools: ['queryJira', 'analyzeCause', ],  // 允许的工具（deleteFile 不在里面）
  retryLimit: 2,               // 错误重试次数
  requireApproval: ['pushWecom'],  // 这些工具执行前需要审批
}

// ============================================================
// 3. Lifecycle Hooks — 每步执行前后的钩子
// ============================================================
const hooks = {
  beforeAction: (iteration, toolName, params) => {
    console.log(`  [Hook:Before] 第${iteration}轮 → 准备调用 ${toolName}`)
    
    // 检查工具是否在允许列表中
    if (!HARNESS_CONFIG.allowedTools.includes(toolName)) {
      throw new Error(`[Guardrail] 工具 "${toolName}" 不在允许列表中，已拦截！`)
    }
    
    // 检查是否需要审批
    if (HARNESS_CONFIG.requireApproval.includes(toolName)) {
      console.log(`  [Hook:Before] ⚠️  "${toolName}" 需要审批 → 自动批准（生产环境应等待人工确认）`)
    }
  },
  
  afterAction: (iteration, toolName, result, error) => {
    if (error) {
      console.log(`  [Hook:After] 第${iteration}轮 ← ${toolName} 失败: ${error.message}`)
    } else {
      console.log(`  [Hook:After] 第${iteration}轮 ← ${toolName} 成功`)
    }
  },
  
  onComplete: (totalIterations, finalResult) => {
    console.log(`\n  [Hook:Complete] Agent 完成，共执行 ${totalIterations} 轮`)
  }
}

// ============================================================
// 4. Agent Loop + Harness（核心运行时）
// ============================================================
async function runAgentWithHarness(task) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🤖 Agent 启动 | 任务: ${task}`)
  console.log(`   最大循环: ${HARNESS_CONFIG.maxIterations} | 允许工具: ${HARNESS_CONFIG.allowedTools.join(', ')}`)
  console.log(`${'='.repeat(60)}\n`)

  // Agent 的执行计划（模拟 LLM 的决策）
  const plan = [
    { tool: 'queryJira', params: { project: 'RP' } },
    { tool: 'analyzeCause', params: { ticketKey: 'RP-100' } },
    { tool: 'analyzeCause', params: { ticketKey: 'RP-101' } },
    { tool: 'pushWecom', params: { message: '🚨 停滞预警：RP-100 登录超时(5天) 原因:等供应商; RP-101 报表导出(3天) 原因:需求变更' } },
  ]

  let iteration = 0
  const results = []

  for (const step of plan) {
    iteration++

    // 检查最大循环次数
    if (iteration > HARNESS_CONFIG.maxIterations) {
      console.log(`\n⛔ [Guardrail] 达到最大循环次数 ${HARNESS_CONFIG.maxIterations}，强制停止！`)
      break
    }

    console.log(`\n--- 第 ${iteration} 轮 Loop ---`)

    // Before Hook（权限检查、日志）
    try {
      hooks.beforeAction(iteration, step.tool, step.params)
    } catch (e) {
      console.log(`  ❌ ${e.message}`)
      results.push({ tool: step.tool, error: e.message })
      continue
    }

    // 执行工具（带重试）
    let result = null
    let error = null
    let retries = 0

    while (retries <= HARNESS_CONFIG.retryLimit) {
      try {
        const tool = TOOL_REGISTRY[step.tool]
        result = await tool.fn(step.params)
        break  // 成功则跳出重试循环
      } catch (e) {
        error = e
        retries++
        if (retries <= HARNESS_CONFIG.retryLimit) {
          console.log(`  [重试] 第 ${retries} 次重试...`)
        }
      }
    }

    // After Hook（记录结果）
    hooks.afterAction(iteration, step.tool, result, error)
    results.push({ tool: step.tool, result, error: error?.message })
  }

  hooks.onComplete(iteration, results)
  return results
}

// ============================================================
// 5. 演示：正常任务执行
// ============================================================
console.log('\n\n🎯 演示 1：正常的 Agent Loop + Harness')
await runAgentWithHarness('分析 IDC 项目停滞 tickets 并推送预警')

// ============================================================
// 6. 演示：Guardrail 拦截非法工具
// ============================================================
console.log('\n\n🎯 演示 2：尝试调用未授权工具（被 Harness 拦截）')

async function runDangerousTask() {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🤖 Agent 启动 | 任务: 尝试删除文件`)
  console.log(`${'='.repeat(60)}\n`)

  const step = { tool: 'deleteFile', params: { path: '/important/data' } }
  
  console.log(`--- 第 1 轮 Loop ---`)
  try {
    hooks.beforeAction(1, step.tool, step.params)
  } catch (e) {
    console.log(`  ❌ ${e.message}`)
    console.log(`  ✅ Harness 成功阻止了危险操作！`)
  }
}

await runDangerousTask()

// ============================================================
// 总结
// ============================================================
console.log(`
${'='.repeat(60)}
📝 Day 2 学习总结：Harness 的四个核心能力

1. 工具注册表（Tool Registry）
   → TOOL_REGISTRY 定义了所有可用工具
   → 每个工具有名称、描述、执行函数

2. 最大循环次数限制
   → maxIterations: 5，超过就强制停止
   → 防止 Agent 陷入无限循环

3. 每步执行前的日志/审批（Lifecycle Hooks）
   → beforeAction: 权限检查 + 审批拦截
   → afterAction: 记录执行结果
   → onComplete: 任务完成通知

4. 错误处理和重试
   → retryLimit: 2，失败自动重试
   → 不在允许列表的工具直接拦截

🔑 核心认知：
   Harness = Agent 的"安全笼"
   没有 Harness 的 Agent 就像没有刹车的车
   Loop 决定"做什么"，Harness 决定"能做什么"
${'='.repeat(60)}
`)
