// ============================================================
// AI-PM Platform — 多语言支持
// 支持：中文(zh) / English(en) / 日本語(ja) / Español(es)
// ============================================================

export type Locale = 'zh' | 'en' | 'ja' | 'es'

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

export type TranslationKey =
  // 导航
  | 'nav.dashboard' | 'nav.requirements' | 'nav.sprint'
  | 'nav.risk' | 'nav.reports' | 'nav.settings'
  // 通用
  | 'common.loading' | 'common.sync' | 'common.reset'
  | 'common.search' | 'common.all' | 'common.save'
  | 'common.cancel' | 'common.confirm' | 'common.close'
  | 'common.noData' | 'common.selectProject' | 'common.error'
  | 'common.notify' | 'common.push' | 'common.edit' | 'common.view'
  | 'common.unassigned' | 'common.completed' | 'common.inProgress'
  | 'common.todo' | 'common.inReview' | 'common.inTesting'
  // Dashboard
  | 'dashboard.title' | 'dashboard.globalView' | 'dashboard.personalView'
  | 'dashboard.aiDecision' | 'dashboard.completionRate' | 'dashboard.riskAlert'
  | 'dashboard.unassigned' | 'dashboard.totalTasks' | 'dashboard.burndown'
  | 'dashboard.teamLoad' | 'dashboard.riskList' | 'dashboard.statusDist'
  | 'dashboard.noActiveSprint' | 'dashboard.selectProjectHint'
  | 'dashboard.inProgress' | 'dashboard.todo' | 'dashboard.done'
  | 'dashboard.inReview' | 'dashboard.inTesting'
  | 'dashboard.myTasks' | 'dashboard.myProgress' | 'dashboard.pendingItems'
  | 'dashboard.activeIssues'
  // Sprint
  | 'sprint.title' | 'sprint.board' | 'sprint.resource'
  | 'sprint.change' | 'sprint.plan' | 'sprint.completed'
  | 'sprint.noActiveSprint' | 'sprint.syncNow'
  | 'sprint.todo' | 'sprint.inProgress' | 'sprint.inReview'
  | 'sprint.inTesting' | 'sprint.done' | 'sprint.unassigned'
  | 'sprint.filterPriority' | 'sprint.filterAssignee'
  | 'sprint.filterKeyword' | 'sprint.resetFilter'
  // Requirements
  | 'req.title' | 'req.total' | 'req.list' | 'req.kanban'
  | 'req.allStatus' | 'req.allPriority' | 'req.allAssignee'
  | 'req.searchPlaceholder' | 'req.syncJira'
  | 'req.id' | 'req.title2' | 'req.status' | 'req.priority'
  | 'req.assignee' | 'req.labels'
  // Risk
  | 'risk.title' | 'risk.board' | 'risk.collab' | 'risk.deps'
  | 'risk.high' | 'risk.medium' | 'risk.low'
  | 'risk.highRisk' | 'risk.mediumRisk' | 'risk.lowRisk'
  | 'risk.allLevel' | 'risk.allType' | 'risk.autoPush'
  | 'risk.unassigned' | 'risk.overtime' | 'risk.scopeCreep' | 'risk.dependency'
  | 'risk.identified' | 'risk.evaluating' | 'risk.handling' | 'risk.closed'
  // Reports
  | 'reports.title' | 'reports.daily' | 'reports.weekly'
  | 'reports.sprint' | 'reports.draft' | 'reports.pushed'
  | 'reports.pushWecom' | 'reports.generate' | 'reports.preview'
  // Settings
  | 'settings.title' | 'settings.project' | 'settings.jira'
  | 'settings.notifications' | 'settings.permissions'
  | 'settings.testConnection' | 'settings.connected' | 'settings.disconnected'
  // Layout
  | 'layout.devBanner'
  // Topbar
  | 'topbar.selectBoard' | 'topbar.search' | 'topbar.switchRole'
  | 'topbar.pm' | 'topbar.dev' | 'topbar.logout'
  // Roadmap
  | 'nav.roadmap'
  | 'roadmap.title' | 'roadmap.addMilestone' | 'roadmap.addNode'
  | 'roadmap.selectTemplate' | 'roadmap.syncJira' | 'roadmap.emptyState'
  | 'roadmap.deleteMilestoneConfirm' | 'roadmap.deleteNodeConfirm'
  | 'roadmap.replaceConfirm' | 'roadmap.overdue' | 'roadmap.today'
  | 'roadmap.noVersions' | 'roadmap.syncSuccess' | 'roadmap.storageWarning'
  | 'roadmap.template.agileSprint.name' | 'roadmap.template.agileSprint.description'
  | 'roadmap.template.quarterly.name' | 'roadmap.template.quarterly.description'
  | 'roadmap.template.productLaunch.name' | 'roadmap.template.productLaunch.description'
  | 'roadmap.template.customBlank.name' | 'roadmap.template.customBlank.description'
  // Resource tab
  | 'resource.totalTasks' | 'resource.assigned' | 'resource.unassigned'
  | 'resource.avgLoad' | 'resource.overloaded' | 'resource.balanced'
  | 'resource.underloaded' | 'resource.load' | 'resource.noTasks'
  | 'resource.noData' | 'resource.developer'
  | 'resource.collapse' | 'resource.expandMore'
  | 'resource.sortBy' | 'resource.sortLoad' | 'resource.sortTaskCount' | 'resource.sortName'
  | 'resource.detailAll' | 'resource.detailAssigned' | 'resource.detailUnassigned'
  | 'resource.detailOverloaded' | 'resource.detailBalanced' | 'resource.detailUnderloaded'
  | 'resource.unassignedBanner'
  // Common: select project hint
  | 'common.selectProjectFirst' | 'common.selectProjectHint'
  // Requirements kanban columns
  | 'req.draft' | 'req.pendingReview' | 'req.confirmed' | 'req.inDev' | 'req.done'
  | 'req.noMatch'
  // Milestone dialog
  | 'milestone.planned' | 'milestone.inProgress' | 'milestone.completed' | 'milestone.delayed'
  | 'milestone.editTitle' | 'milestone.name' | 'milestone.startDate' | 'milestone.endDate'
  | 'milestone.status' | 'milestone.description' | 'milestone.namePlaceholder'
  | 'milestone.descPlaceholder' | 'milestone.nameRequired' | 'milestone.startRequired'
  | 'milestone.endRequired' | 'milestone.dateError' | 'milestone.delete'
  // Roadmap toolbar
  | 'roadmap.selectProjectTooltip' | 'roadmap.clearAll'
  // Reports page
  | 'reports.subtitle' | 'reports.monthly' | 'reports.collaboration'
  | 'reports.dailyDesc' | 'reports.weeklyDesc' | 'reports.sprintDesc'
  | 'reports.monthlyDesc' | 'reports.collaborationDesc'
  | 'reports.reportList' | 'reports.allTypes' | 'reports.allStatus'
  | 'reports.type' | 'reports.reportTitle' | 'reports.date' | 'reports.status'
  | 'reports.actions' | 'reports.pushing' | 'reports.previewEmpty'
  // Dashboard
  | 'dashboard.subtitle.sprints' | 'dashboard.subtitle.tasks'
  | 'dashboard.subtitle.activeSprints'
  | 'dashboard.completionRateLabel' | 'dashboard.highRisk' | 'dashboard.mediumRisk'
  | 'dashboard.completedTasks' | 'dashboard.pendingRisks' | 'dashboard.noRisks'
  | 'dashboard.viewAll' | 'dashboard.level' | 'dashboard.riskType'
  | 'dashboard.description' | 'dashboard.assignee' | 'dashboard.riskStatus'
  | 'dashboard.totalCount' | 'dashboard.showFirst50'
  | 'dashboard.idealLine' | 'dashboard.actualLine' | 'dashboard.taskCount'
  | 'dashboard.needAssign' | 'dashboard.allAssigned'
  | 'dashboard.clickDetail' | 'dashboard.noTasksForYou'
  | 'dashboard.items' | 'dashboard.sprintCompletionRate'
  | 'dashboard.errorLoad'
  // Sprint
  | 'sprint.syncing' | 'sprint.errorLoad'
  | 'sprint.planBannerTitle' | 'sprint.planBannerDesc'
  | 'sprint.currentSprint' | 'sprint.backlogCandidates' | 'sprint.selected'
  | 'sprint.backlogTitle' | 'sprint.selectTop10'
  | 'sprint.thId' | 'sprint.thTitle' | 'sprint.thPriority'
  | 'sprint.thAssignee' | 'sprint.thAiScore'
  | 'sprint.aiPlanSuggestion' | 'sprint.selectedTasks'
  | 'sprint.clearSelection' | 'sprint.copyPlan'
  | 'sprint.copiedAlert' | 'sprint.noBacklog'
  | 'sprint.sizeOk' | 'sprint.sizeTooMany' | 'sprint.selectHint'
  // Risk
  | 'risk.subtitle' | 'risk.errorLoad'
  | 'risk.assigneeLabel' | 'risk.noMatchRisk'
  | 'risk.noCollabTasks' | 'risk.collabDesc'
  | 'risk.collabDetected' | 'risk.collabWith' | 'risk.collabTasks'
  | 'risk.collabDone' | 'risk.collabInProgress'
  | 'risk.completionRate' | 'risk.moreIssues'
  | 'risk.unassignedHighPriority' | 'risk.overtimeLabel'
  | 'risk.noUpdateDays' | 'risk.noDepsRisk'
  | 'risk.daysNoUpdate' | 'risk.exceed'
  // Requirements
  | 'req.subtitle' | 'req.reqs' | 'req.filtered'
  | 'req.lastYear' | 'req.syncing'
  | 'req.statusDraft' | 'req.statusReview' | 'req.statusDev'
  | 'req.statusTest' | 'req.statusDone'
  | 'req.p0Urgent' | 'req.p1High' | 'req.p2Medium' | 'req.p3Low'
  | 'req.errorLoad'
  // Settings
  | 'settings.subtitle' | 'settings.projectConfig'
  | 'settings.boardId' | 'settings.projectKey' | 'settings.notConfigured'
  | 'settings.configDesc'
  | 'settings.jiraIntegration' | 'settings.connectionStatus'
  | 'settings.notTested' | 'settings.jiraUrl' | 'settings.lastSync'
  | 'settings.testing'
  | 'settings.notifSettings' | 'settings.highRiskPush' | 'settings.highRiskPushDesc'
  | 'settings.dailyPush' | 'settings.dailyPushDesc'
  | 'settings.weeklyPush' | 'settings.weeklyPushDesc'
  | 'settings.permManagement' | 'settings.feature' | 'settings.pm' | 'settings.dev'
  // Settings permissions
  | 'settings.perm.viewSprint' | 'settings.perm.manageSprint'
  | 'settings.perm.viewReqs' | 'settings.perm.editReqs'
  | 'settings.perm.viewRisk' | 'settings.perm.pushRisk'
  | 'settings.perm.viewReports' | 'settings.perm.pushReports'
  | 'settings.perm.editConfig' | 'settings.perm.manageJira'
  // AI Insight
  | 'ai.insight' | 'ai.generate' | 'ai.regenerate' | 'ai.analyzing'
  | 'ai.collapse' | 'ai.expand' | 'ai.retry' | 'ai.cached'
  // Change tab
  | 'change.priorityChange' | 'change.newAddition' | 'change.scopeChange'
  | 'change.statusRegression' | 'change.totalChanges'
  | 'change.affectedTasks' | 'change.highImpact' | 'change.mediumImpact'
  | 'change.lowImpact' | 'change.baselineVsCurrent'
  | 'change.reqCount' | 'change.changeTasks'
  | 'change.detection' | 'change.scopeCreepAnalysis'
  | 'change.scopeCreepWarning' | 'change.scopeGrowth'
  | 'change.baselineReqs' | 'change.currentReqs' | 'change.addedReqs'
  | 'change.addedTasks' | 'change.newReqTimeline'
  | 'change.aiAnalysis' | 'change.aiAnalyzeBtn' | 'change.aiAnalyzing'
  | 'change.noSprintDate' | 'change.noChanges'
  | 'change.severityHigh' | 'change.severityMedium' | 'change.severityLow'
  // Global search
  | 'search.pages' | 'search.tasks' | 'search.noResults'
  | 'search.navigate' | 'search.jump' | 'search.close'
  // Toast / errors
  | 'toast.pushSuccess' | 'toast.pushSuccessDesc'
  | 'toast.pushFail' | 'toast.pushFailDesc'
  | 'toast.connectSuccess' | 'toast.connectSuccessDesc'
  | 'toast.connectFail' | 'toast.connectFailDesc'
  | 'error.aiTimeout'
  // Roadmap templates (milestone names for product launch)
  | 'roadmap.template.reqAnalysis' | 'roadmap.template.design'
  | 'roadmap.template.development' | 'roadmap.template.testing'
  | 'roadmap.template.release'

type Translations = Record<TranslationKey, string>

const zh: Translations = {
  'nav.dashboard': 'Dashboard', 'nav.requirements': '需求管理',
  'nav.sprint': 'Sprint 管理', 'nav.risk': '风险与协作',
  'nav.reports': '报告中心', 'nav.settings': '设置',
  'common.loading': '加载中...', 'common.sync': '立即同步',
  'common.reset': '重置筛选', 'common.search': '搜索',
  'common.all': '全部', 'common.save': '保存',
  'common.cancel': '取消', 'common.confirm': '确认',
  'common.close': '关闭', 'common.noData': '暂无数据',
  'common.selectProject': '选择项目...', 'common.error': '加载失败',
  'common.notify': '通知', 'common.push': '推送企微',
  'common.edit': '编辑', 'common.view': '查看',
  'dashboard.title': '项目驾驶舱', 'dashboard.globalView': '全局视图',
  'dashboard.personalView': '个人视图', 'dashboard.aiDecision': '🧠 AI 决策',
  'dashboard.completionRate': 'Sprint 完成率', 'dashboard.riskAlert': '风险预警',
  'dashboard.unassigned': '未分配任务', 'dashboard.totalTasks': '任务总数',
  'dashboard.burndown': '燃尽图', 'dashboard.teamLoad': '团队任务分布',
  'dashboard.riskList': '风险预警列表', 'dashboard.statusDist': '任务状态分布',
  'dashboard.noActiveSprint': '暂无活跃 Sprint',
  'dashboard.selectProjectHint': '请先在顶部选择项目',
  'dashboard.inProgress': '进行中', 'dashboard.todo': '待办',
  'dashboard.done': '已完成', 'dashboard.inReview': '评审中',
  'dashboard.inTesting': '测试中',
  'sprint.title': 'Sprint 管理', 'sprint.board': '执行（看板）',
  'sprint.resource': '资源', 'sprint.change': '变更', 'sprint.plan': '规划',
  'sprint.completed': '已完成', 'sprint.noActiveSprint': '暂无活跃 Sprint',
  'sprint.syncNow': '立即同步', 'sprint.todo': '待办',
  'sprint.inProgress': '进行中', 'sprint.inReview': '评审中',
  'sprint.inTesting': '测试中', 'sprint.done': '已完成',
  'sprint.unassigned': '未分配',
  'req.title': '需求管理', 'req.total': '条需求',
  'req.list': '列表', 'req.kanban': '看板',
  'req.allStatus': '全部状态', 'req.allPriority': '全部优先级',
  'req.allAssignee': '全部负责人', 'req.searchPlaceholder': '搜索需求标题...',
  'req.syncJira': '从 Jira 同步',
  'risk.title': '风险与协作', 'risk.board': '风险看板',
  'risk.collab': '跨团队协作', 'risk.deps': '依赖管理',
  'risk.high': '高危', 'risk.medium': '中危', 'risk.low': '低危',
  'risk.highRisk': '高危风险', 'risk.mediumRisk': '中危风险', 'risk.lowRisk': '低危风险',
  'risk.allLevel': '全部等级', 'risk.allType': '全部类型',
  'risk.autoPush': '企微自动推送',
  'risk.unassigned': '未分配', 'risk.overtime': '超时',
  'risk.scopeCreep': '蔓延', 'risk.dependency': '依赖',
  'risk.identified': '已识别', 'risk.evaluating': '评估中',
  'risk.handling': '应对中', 'risk.closed': '已关闭',
  'reports.title': '报告中心', 'reports.daily': '日报',
  'reports.weekly': '周报', 'reports.sprint': 'Sprint 报告',
  'reports.draft': '草稿', 'reports.pushed': '已推送',
  'reports.pushWecom': '推送企微', 'reports.generate': '生成报告',
  'reports.preview': '报告预览',
  'settings.title': '设置', 'settings.project': '项目配置',
  'settings.jira': 'Jira 集成', 'settings.notifications': '通知设置',
  'settings.permissions': '权限管理', 'settings.testConnection': '测试连接',
  'settings.connected': '已连接', 'settings.disconnected': '未连接',
  'topbar.selectBoard': '选择项目 Board...', 'topbar.search': '搜索任务、需求、人员...',
  'topbar.switchRole': '切换角色', 'topbar.pm': 'PM', 'topbar.dev': 'DEV',
  'topbar.logout': '退出登录',
  'common.unassigned': '未分配', 'common.completed': '已完成',
  'common.inProgress': '进行中', 'common.todo': '待办',
  'common.inReview': '评审中', 'common.inTesting': '测试中',
  'dashboard.myTasks': '我的任务', 'dashboard.myProgress': '我的进度',
  'dashboard.pendingItems': '待我处理', 'dashboard.activeIssues': '进行中的任务',
  'req.id': 'ID', 'req.title2': '标题', 'req.status': '状态',
  'req.priority': '优先级', 'req.assignee': '负责人', 'req.labels': '标签',
  'sprint.filterPriority': '优先级', 'sprint.filterAssignee': '负责人',
  'sprint.filterKeyword': '搜索 ID 或标题...',
  'sprint.resetFilter': '重置筛选',
  'layout.devBanner': '开发人员视角 · 你的任务已高亮',
  'nav.roadmap': '项目路线图',
  'roadmap.title': '项目路线图',
  'roadmap.addMilestone': '添加里程碑',
  'roadmap.addNode': '添加关键节点',
  'roadmap.selectTemplate': '选择模板',
  'roadmap.syncJira': '同步 Jira',
  'roadmap.emptyState': '暂无路线图数据，请添加里程碑或选择模板',
  'roadmap.deleteMilestoneConfirm': '确定删除此里程碑？',
  'roadmap.deleteNodeConfirm': '确定删除此关键节点？',
  'roadmap.replaceConfirm': '应用模板将替换现有数据，确定继续？',
  'roadmap.overdue': '已逾期',
  'roadmap.today': '今天',
  'roadmap.noVersions': '该项目暂无 Fix Version',
  'roadmap.syncSuccess': '同步成功',
  'roadmap.storageWarning': '数据将不会持久化',
  'roadmap.template.agileSprint.name': 'Agile Sprint 模板',
  'roadmap.template.agileSprint.description': '6 个 2 周 Sprint，含评审和发布节点',
  'roadmap.template.quarterly.name': '季度规划模板',
  'roadmap.template.quarterly.description': '4 个季度里程碑，含季度评审',
  'roadmap.template.productLaunch.name': '产品发布模板',
  'roadmap.template.productLaunch.description': '需求→设计→开发→测试→发布 5 阶段',
  'roadmap.template.customBlank.name': '自定义空白',
  'roadmap.template.customBlank.description': '从零开始创建路线图',
  // Resource tab
  'resource.totalTasks': '总任务', 'resource.assigned': '已分配',
  'resource.unassigned': '未分配', 'resource.avgLoad': '平均负载',
  'resource.overloaded': '过载', 'resource.balanced': '均衡',
  'resource.underloaded': '空闲', 'resource.load': '负载',
  'resource.noTasks': '暂无任务', 'resource.noData': '暂无数据',
  'resource.developer': '开发者',
  'resource.collapse': '收起', 'resource.expandMore': '展开更多',
  'resource.sortBy': '排序：', 'resource.sortLoad': '负载',
  'resource.sortTaskCount': '任务数', 'resource.sortName': '姓名',
  'resource.detailAll': '全部任务', 'resource.detailAssigned': '已分配任务',
  'resource.detailUnassigned': '未分配任务', 'resource.detailOverloaded': '过载开发者的任务',
  'resource.detailBalanced': '均衡开发者的任务', 'resource.detailUnderloaded': '空闲开发者的任务',
  'resource.unassignedBanner': '个任务未分配负责人',
  // Common
  'common.selectProjectFirst': '请先选择项目',
  'common.selectProjectHint': '请在顶部导航栏选择一个项目',
  // Requirements kanban
  'req.draft': '草稿', 'req.pendingReview': '待评审 / 评审中',
  'req.confirmed': '已确认', 'req.inDev': '开发中', 'req.done': '已完成',
  'req.noMatch': '暂无匹配的需求',
  // Milestone dialog
  'milestone.planned': '计划中', 'milestone.inProgress': '进行中',
  'milestone.completed': '已完成', 'milestone.delayed': '已延期',
  'milestone.editTitle': '编辑里程碑', 'milestone.name': '名称',
  'milestone.startDate': '开始日期', 'milestone.endDate': '结束日期',
  'milestone.status': '状态', 'milestone.description': '描述',
  'milestone.namePlaceholder': '里程碑名称', 'milestone.descPlaceholder': '可选描述',
  'milestone.nameRequired': '名称不能为空', 'milestone.startRequired': '请选择开始日期',
  'milestone.endRequired': '请选择结束日期', 'milestone.dateError': '开始日期不能晚于结束日期',
  'milestone.delete': '删除',
  // Roadmap toolbar
  'roadmap.selectProjectTooltip': '请先选择项目', 'roadmap.clearAll': '清空',
  // Reports page
  'reports.subtitle': '自动生成并推送项目报告',
  'reports.monthly': '月报', 'reports.collaboration': '协作报告',
  'reports.dailyDesc': '每日进展', 'reports.weeklyDesc': '本周总结',
  'reports.sprintDesc': '复盘总结', 'reports.monthlyDesc': '月度汇总',
  'reports.collaborationDesc': '跨团队',
  'reports.reportList': '报告列表', 'reports.allTypes': '全部类型',
  'reports.allStatus': '全部状态',
  'reports.type': '类型', 'reports.reportTitle': '标题',
  'reports.date': '日期', 'reports.status': '状态',
  'reports.actions': '操作', 'reports.pushing': '推送中…',
  'reports.previewEmpty': '← 点击左侧报告查看详情',
  // Dashboard
  'dashboard.subtitle.sprints': '个活跃 Sprint',
  'dashboard.subtitle.tasks': '个任务',
  'dashboard.subtitle.activeSprints': '个活跃 Sprint',
  'dashboard.completionRateLabel': '完成率',
  'dashboard.highRisk': '高危风险', 'dashboard.mediumRisk': '中危风险',
  'dashboard.completedTasks': '已完成任务', 'dashboard.pendingRisks': '待处理风险',
  'dashboard.noRisks': '当前无风险',
  'dashboard.viewAll': '查看全部', 'dashboard.level': '等级',
  'dashboard.riskType': '类型', 'dashboard.description': '描述',
  'dashboard.assignee': '负责人', 'dashboard.riskStatus': '状态',
  'dashboard.totalCount': '共', 'dashboard.showFirst50': '仅显示前 50 条',
  'dashboard.idealLine': '理想线', 'dashboard.actualLine': '实际',
  'dashboard.taskCount': '任务数',
  'dashboard.needAssign': '需要分配负责人', 'dashboard.allAssigned': '全部已分配',
  'dashboard.clickDetail': '点击查看明细',
  'dashboard.noTasksForYou': '当前 Sprint 暂无分配给你的任务',
  'dashboard.items': '条', 'dashboard.sprintCompletionRate': '本 Sprint 完成率',
  'dashboard.errorLoad': '数据加载失败',
  // Sprint
  'sprint.syncing': '同步中…', 'sprint.errorLoad': '数据加载失败',
  'sprint.planBannerTitle': '📋 Sprint 规划助手',
  'sprint.planBannerDesc': 'AI 已从 Backlog 中筛选候选任务，按优先级和紧急度排序。勾选任务后可导出规划清单。',
  'sprint.currentSprint': '当前 Sprint', 'sprint.backlogCandidates': 'Backlog 候选',
  'sprint.selected': '已选',
  'sprint.backlogTitle': '📥 Backlog 候选任务（AI 已排序）',
  'sprint.selectTop10': '一键选前10',
  'sprint.thId': 'ID', 'sprint.thTitle': '标题', 'sprint.thPriority': '优先级',
  'sprint.thAssignee': '负责人', 'sprint.thAiScore': 'AI评分',
  'sprint.aiPlanSuggestion': '🧠 AI 规划建议',
  'sprint.selectedTasks': '已选任务',
  'sprint.clearSelection': '清空', 'sprint.copyPlan': '📋 复制规划清单',
  'sprint.copiedAlert': '已复制任务到剪贴板',
  'sprint.noBacklog': 'Backlog 暂无候选任务',
  'sprint.sizeOk': '任务，规模合理',
  'sprint.sizeTooMany': '个任务，建议控制在 10 个以内',
  'sprint.selectHint': '请从左侧选择要加入下个 Sprint 的任务',
  // Risk
  'risk.subtitle': '基于当前 Sprint 数据自动识别风险',
  'risk.errorLoad': '数据加载失败',
  'risk.assigneeLabel': '负责人', 'risk.noMatchRisk': '无匹配风险',
  'risk.noCollabTasks': '当前 Sprint 暂无跨团队协作任务',
  'risk.collabDesc': '系统通过识别 Issue 标题中的项目前缀（如 CP|TMS|OMS）来发现跨团队协作',
  'risk.collabDetected': '个跨团队协作项目',
  'risk.collabWith': '与', 'risk.collabTasks': '个任务',
  'risk.collabDone': '完成', 'risk.collabInProgress': '进行中',
  'risk.completionRate': '完成率', 'risk.moreIssues': '个任务...',
  'risk.unassignedHighPriority': '未分配高优任务（需立即处理）',
  'risk.overtimeLabel': '超预估工时任务',
  'risk.noUpdateDays': '进行中但 3 天无更新',
  'risk.noDepsRisk': '当前暂无依赖风险',
  'risk.daysNoUpdate': '天未更新', 'risk.exceed': '超出',
  // Requirements
  'req.subtitle': '需求', 'req.reqs': '条需求', 'req.filtered': '筛选后',
  'req.lastYear': '近一年', 'req.syncing': '同步中…',
  'req.statusDraft': '待办/草稿', 'req.statusReview': '评审中',
  'req.statusDev': '开发中', 'req.statusTest': '测试中', 'req.statusDone': '已完成',
  'req.p0Urgent': 'P0 紧急', 'req.p1High': 'P1 高',
  'req.p2Medium': 'P2 中', 'req.p3Low': 'P3 低',
  'req.errorLoad': '数据加载失败',
  // Settings
  'settings.subtitle': '项目配置与集成管理',
  'settings.projectConfig': '项目配置',
  'settings.boardId': 'Board ID', 'settings.projectKey': '项目 Key',
  'settings.notConfigured': '未配置',
  'settings.configDesc': 'Board ID 和项目 Key 通过环境变量 VITE_DEFAULT_BOARD_ID 配置',
  'settings.jiraIntegration': 'Jira 集成',
  'settings.connectionStatus': '连接状态',
  'settings.notTested': '未检测', 'settings.jiraUrl': 'Jira 地址',
  'settings.lastSync': '最后同步', 'settings.testing': '测试中…',
  'settings.notifSettings': '通知设置',
  'settings.highRiskPush': '高危风险推送',
  'settings.highRiskPushDesc': '检测到高危风险时自动推送企业微信',
  'settings.dailyPush': '日报推送',
  'settings.dailyPushDesc': '每天下班前自动推送日报至企业微信',
  'settings.weeklyPush': '周报推送',
  'settings.weeklyPushDesc': '每周五下午自动推送周报至企业微信',
  'settings.permManagement': '权限管理',
  'settings.feature': '功能', 'settings.pm': 'PM', 'settings.dev': 'DEV',
  'settings.perm.viewSprint': '查看 Sprint 看板',
  'settings.perm.manageSprint': '管理 Sprint（创建/关闭）',
  'settings.perm.viewReqs': '查看需求列表',
  'settings.perm.editReqs': '创建/编辑需求',
  'settings.perm.viewRisk': '查看风险看板',
  'settings.perm.pushRisk': '推送风险通知',
  'settings.perm.viewReports': '查看报告',
  'settings.perm.pushReports': '推送报告',
  'settings.perm.editConfig': '修改项目配置',
  'settings.perm.manageJira': '管理 Jira 集成',
  // AI Insight
  'ai.insight': 'AI 智能分析', 'ai.generate': '✨ 生成分析',
  'ai.regenerate': '🔄 重新分析', 'ai.analyzing': 'AI 正在分析',
  'ai.collapse': '收起', 'ai.expand': '展开',
  'ai.retry': '重试', 'ai.cached': '已缓存',
  // Change tab
  'change.priorityChange': '优先级变更', 'change.newAddition': '新增需求',
  'change.scopeChange': '范围变更', 'change.statusRegression': '状态回退',
  'change.totalChanges': '总变更数',
  'change.affectedTasks': '受影响任务数',
  'change.highImpact': '高影响', 'change.mediumImpact': '中影响',
  'change.lowImpact': '低影响',
  'change.baselineVsCurrent': '基线 vs 当前',
  'change.reqCount': '需求数', 'change.changeTasks': '变更任务',
  'change.detection': '变更检测',
  'change.scopeCreepAnalysis': '范围蔓延分析',
  'change.scopeCreepWarning': '范围蔓延警告',
  'change.scopeGrowth': '范围增长',
  'change.baselineReqs': '基线需求数', 'change.currentReqs': '当前需求数',
  'change.addedReqs': '新增需求', 'change.addedTasks': '新增任务数',
  'change.newReqTimeline': '新增需求时间线',
  'change.aiAnalysis': 'AI 变更分析', 'change.aiAnalyzeBtn': 'AI 变更分析',
  'change.aiAnalyzing': 'AI 正在分析变更',
  'change.noSprintDate': 'Sprint 开始日期不可用，无法进行变更检测',
  'change.noChanges': '未检测到需求变更',
  'change.severityHigh': '高', 'change.severityMedium': '中', 'change.severityLow': '低',
  // Global search
  'search.pages': '页面', 'search.tasks': '任务',
  'search.noResults': '未找到相关内容',
  'search.navigate': '↑↓ 导航', 'search.jump': 'Enter 跳转', 'search.close': 'Esc 关闭',
  // Toast / errors
  'toast.pushSuccess': '✅ 推送成功', 'toast.pushSuccessDesc': '消息已发送至企业微信群',
  'toast.pushFail': '❌ 推送失败', 'toast.pushFailDesc': '请检查企业微信 Webhook 配置',
  'toast.connectSuccess': '✅ 连接成功', 'toast.connectSuccessDesc': 'Jira 服务器连接正常',
  'toast.connectFail': '❌ 连接失败', 'toast.connectFailDesc': '请检查 Jira 地址和认证配置',
  'error.aiTimeout': 'AI response timeout, please retry',
  // Roadmap templates
  'roadmap.template.reqAnalysis': '需求分析', 'roadmap.template.design': '设计',
  'roadmap.template.development': '开发', 'roadmap.template.testing': '测试',
  'roadmap.template.release': '发布',
}

const en: Translations = {
  'nav.dashboard': 'Dashboard', 'nav.requirements': 'Requirements',
  'nav.sprint': 'Sprint', 'nav.risk': 'Risk & Collab',
  'nav.reports': 'Reports', 'nav.settings': 'Settings',
  'common.loading': 'Loading...', 'common.sync': 'Sync Now',
  'common.reset': 'Reset Filters', 'common.search': 'Search',
  'common.all': 'All', 'common.save': 'Save',
  'common.cancel': 'Cancel', 'common.confirm': 'Confirm',
  'common.close': 'Close', 'common.noData': 'No data',
  'common.selectProject': 'Select project...', 'common.error': 'Load failed',
  'common.notify': 'Notify', 'common.push': 'Push to WeCom',
  'common.edit': 'Edit', 'common.view': 'View',
  'dashboard.title': 'Project Dashboard', 'dashboard.globalView': 'Global View',
  'dashboard.personalView': 'My View', 'dashboard.aiDecision': '🧠 AI Decision',
  'dashboard.completionRate': 'Sprint Completion', 'dashboard.riskAlert': 'Risk Alerts',
  'dashboard.unassigned': 'Unassigned', 'dashboard.totalTasks': 'Total Tasks',
  'dashboard.burndown': 'Burndown Chart', 'dashboard.teamLoad': 'Team Workload',
  'dashboard.riskList': 'Risk Alert List', 'dashboard.statusDist': 'Status Distribution',
  'dashboard.noActiveSprint': 'No active sprint',
  'dashboard.selectProjectHint': 'Please select a project above',
  'dashboard.inProgress': 'In Progress', 'dashboard.todo': 'To Do',
  'dashboard.done': 'Done', 'dashboard.inReview': 'In Review',
  'dashboard.inTesting': 'In Testing',
  'sprint.title': 'Sprint Management', 'sprint.board': 'Board',
  'sprint.resource': 'Resources', 'sprint.change': 'Changes', 'sprint.plan': 'Planning',
  'sprint.completed': 'Completed', 'sprint.noActiveSprint': 'No active sprint',
  'sprint.syncNow': 'Sync Now', 'sprint.todo': 'To Do',
  'sprint.inProgress': 'In Progress', 'sprint.inReview': 'In Review',
  'sprint.inTesting': 'In Testing', 'sprint.done': 'Done',
  'sprint.unassigned': 'Unassigned',
  'req.title': 'Requirements', 'req.total': 'requirements',
  'req.list': 'List', 'req.kanban': 'Kanban',
  'req.allStatus': 'All Status', 'req.allPriority': 'All Priority',
  'req.allAssignee': 'All Assignees', 'req.searchPlaceholder': 'Search requirements...',
  'req.syncJira': 'Sync from Jira',
  'risk.title': 'Risk & Collaboration', 'risk.board': 'Risk Board',
  'risk.collab': 'Cross-team Collab', 'risk.deps': 'Dependencies',
  'risk.high': 'High', 'risk.medium': 'Medium', 'risk.low': 'Low',
  'risk.highRisk': 'High Risk', 'risk.mediumRisk': 'Medium Risk', 'risk.lowRisk': 'Low Risk',
  'risk.allLevel': 'All Levels', 'risk.allType': 'All Types',
  'risk.autoPush': 'Auto Push to WeCom',
  'risk.unassigned': 'Unassigned', 'risk.overtime': 'Overtime',
  'risk.scopeCreep': 'Scope Creep', 'risk.dependency': 'Dependency',
  'risk.identified': 'Identified', 'risk.evaluating': 'Evaluating',
  'risk.handling': 'Handling', 'risk.closed': 'Closed',
  'reports.title': 'Reports', 'reports.daily': 'Daily',
  'reports.weekly': 'Weekly', 'reports.sprint': 'Sprint Review',
  'reports.draft': 'Draft', 'reports.pushed': 'Pushed',
  'reports.pushWecom': 'Push to WeCom', 'reports.generate': 'Generate',
  'reports.preview': 'Preview',
  'settings.title': 'Settings', 'settings.project': 'Project Config',
  'settings.jira': 'Jira Integration', 'settings.notifications': 'Notifications',
  'settings.permissions': 'Permissions', 'settings.testConnection': 'Test Connection',
  'settings.connected': 'Connected', 'settings.disconnected': 'Disconnected',
  'topbar.selectBoard': 'Select project...', 'topbar.search': 'Search tasks, requirements...',
  'topbar.switchRole': 'Switch Role', 'topbar.pm': 'PM', 'topbar.dev': 'DEV',
  'topbar.logout': 'Logout',
  'common.unassigned': 'Unassigned', 'common.completed': 'Completed',
  'common.inProgress': 'In Progress', 'common.todo': 'To Do',
  'common.inReview': 'In Review', 'common.inTesting': 'In Testing',
  'dashboard.myTasks': 'My Tasks', 'dashboard.myProgress': 'My Progress',
  'dashboard.pendingItems': 'Pending Items', 'dashboard.activeIssues': 'Active Issues',
  'req.id': 'ID', 'req.title2': 'Title', 'req.status': 'Status',
  'req.priority': 'Priority', 'req.assignee': 'Assignee', 'req.labels': 'Labels',
  'sprint.filterPriority': 'Priority', 'sprint.filterAssignee': 'Assignee',
  'sprint.filterKeyword': 'Search ID or title...',
  'sprint.resetFilter': 'Reset Filters',
  'layout.devBanner': 'Developer View · Your tasks highlighted',
  'nav.roadmap': 'Project Roadmap',
  'roadmap.title': 'Project Roadmap',
  'roadmap.addMilestone': 'Add Milestone',
  'roadmap.addNode': 'Add Key Node',
  'roadmap.selectTemplate': 'Select Template',
  'roadmap.syncJira': 'Sync from Jira',
  'roadmap.emptyState': 'No roadmap data yet. Add milestones or select a template.',
  'roadmap.deleteMilestoneConfirm': 'Delete this milestone?',
  'roadmap.deleteNodeConfirm': 'Delete this key node?',
  'roadmap.replaceConfirm': 'Applying a template will replace existing data. Continue?',
  'roadmap.overdue': 'Overdue',
  'roadmap.today': 'Today',
  'roadmap.noVersions': 'No Fix Versions found',
  'roadmap.syncSuccess': 'Sync successful',
  'roadmap.storageWarning': 'Data will not be persisted',
  'roadmap.template.agileSprint.name': 'Agile Sprint Template',
  'roadmap.template.agileSprint.description': '6 two-week sprints with reviews and release',
  'roadmap.template.quarterly.name': 'Quarterly Planning Template',
  'roadmap.template.quarterly.description': '4 quarterly milestones with reviews',
  'roadmap.template.productLaunch.name': 'Product Launch Template',
  'roadmap.template.productLaunch.description': 'Requirements → Design → Dev → Test → Launch',
  'roadmap.template.customBlank.name': 'Custom Blank',
  'roadmap.template.customBlank.description': 'Start from scratch',
  // Resource tab
  'resource.totalTasks': 'Total Tasks', 'resource.assigned': 'Assigned',
  'resource.unassigned': 'Unassigned', 'resource.avgLoad': 'Avg Load',
  'resource.overloaded': 'Overloaded', 'resource.balanced': 'Balanced',
  'resource.underloaded': 'Idle', 'resource.load': 'Load',
  'resource.noTasks': 'No tasks', 'resource.noData': 'No data',
  'resource.developer': 'Developer',
  'resource.collapse': 'Collapse', 'resource.expandMore': 'Show more',
  'resource.sortBy': 'Sort: ', 'resource.sortLoad': 'Load',
  'resource.sortTaskCount': 'Tasks', 'resource.sortName': 'Name',
  'resource.detailAll': 'All Tasks', 'resource.detailAssigned': 'Assigned Tasks',
  'resource.detailUnassigned': 'Unassigned Tasks', 'resource.detailOverloaded': 'Overloaded Dev Tasks',
  'resource.detailBalanced': 'Balanced Dev Tasks', 'resource.detailUnderloaded': 'Idle Dev Tasks',
  'resource.unassignedBanner': 'tasks have no assignee',
  // Common
  'common.selectProjectFirst': 'Please select a project',
  'common.selectProjectHint': 'Please select a project from the top navigation',
  // Requirements kanban
  'req.draft': 'Draft', 'req.pendingReview': 'Pending / In Review',
  'req.confirmed': 'Confirmed', 'req.inDev': 'In Development', 'req.done': 'Done',
  'req.noMatch': 'No matching requirements',
  // Milestone dialog
  'milestone.planned': 'Planned', 'milestone.inProgress': 'In Progress',
  'milestone.completed': 'Completed', 'milestone.delayed': 'Delayed',
  'milestone.editTitle': 'Edit Milestone', 'milestone.name': 'Name',
  'milestone.startDate': 'Start Date', 'milestone.endDate': 'End Date',
  'milestone.status': 'Status', 'milestone.description': 'Description',
  'milestone.namePlaceholder': 'Milestone name', 'milestone.descPlaceholder': 'Optional description',
  'milestone.nameRequired': 'Name is required', 'milestone.startRequired': 'Start date is required',
  'milestone.endRequired': 'End date is required', 'milestone.dateError': 'Start date cannot be after end date',
  'milestone.delete': 'Delete',
  // Roadmap toolbar
  'roadmap.selectProjectTooltip': 'Please select a project first', 'roadmap.clearAll': 'Clear All',
  // Reports page
  'reports.subtitle': 'Auto-generate and push project reports',
  'reports.monthly': 'Monthly', 'reports.collaboration': 'Collaboration',
  'reports.dailyDesc': 'Daily progress', 'reports.weeklyDesc': 'Weekly summary',
  'reports.sprintDesc': 'Sprint review', 'reports.monthlyDesc': 'Monthly summary',
  'reports.collaborationDesc': 'Cross-team',
  'reports.reportList': 'Report List', 'reports.allTypes': 'All Types',
  'reports.allStatus': 'All Status',
  'reports.type': 'Type', 'reports.reportTitle': 'Title',
  'reports.date': 'Date', 'reports.status': 'Status',
  'reports.actions': 'Actions', 'reports.pushing': 'Pushing…',
  'reports.previewEmpty': '← Click a report on the left to preview',
  // Dashboard
  'dashboard.subtitle.sprints': 'active sprint(s)',
  'dashboard.subtitle.tasks': 'task(s)',
  'dashboard.subtitle.activeSprints': 'active sprint(s)',
  'dashboard.completionRateLabel': 'Completion Rate',
  'dashboard.highRisk': 'High Risk', 'dashboard.mediumRisk': 'Medium Risk',
  'dashboard.completedTasks': 'Completed Tasks', 'dashboard.pendingRisks': 'Pending Risks',
  'dashboard.noRisks': 'No risks',
  'dashboard.viewAll': 'View All', 'dashboard.level': 'Level',
  'dashboard.riskType': 'Type', 'dashboard.description': 'Description',
  'dashboard.assignee': 'Assignee', 'dashboard.riskStatus': 'Status',
  'dashboard.totalCount': 'Total', 'dashboard.showFirst50': 'Showing first 50 of',
  'dashboard.idealLine': 'Ideal', 'dashboard.actualLine': 'Actual',
  'dashboard.taskCount': 'Tasks',
  'dashboard.needAssign': 'Need assignment', 'dashboard.allAssigned': 'All assigned',
  'dashboard.clickDetail': 'Click for details',
  'dashboard.noTasksForYou': 'No tasks assigned to you in this Sprint',
  'dashboard.items': 'items', 'dashboard.sprintCompletionRate': 'Sprint Completion Rate',
  'dashboard.errorLoad': 'Failed to load data',
  // Sprint
  'sprint.syncing': 'Syncing…', 'sprint.errorLoad': 'Failed to load data',
  'sprint.planBannerTitle': '📋 Sprint Planning Assistant',
  'sprint.planBannerDesc': 'AI has filtered backlog candidates by priority and urgency. Select tasks to export a planning list.',
  'sprint.currentSprint': 'Current Sprint', 'sprint.backlogCandidates': 'Backlog Candidates',
  'sprint.selected': 'Selected',
  'sprint.backlogTitle': '📥 Backlog Candidates (AI sorted)',
  'sprint.selectTop10': 'Select Top 10',
  'sprint.thId': 'ID', 'sprint.thTitle': 'Title', 'sprint.thPriority': 'Priority',
  'sprint.thAssignee': 'Assignee', 'sprint.thAiScore': 'AI Score',
  'sprint.aiPlanSuggestion': '🧠 AI Planning Suggestion',
  'sprint.selectedTasks': 'Selected Tasks',
  'sprint.clearSelection': 'Clear', 'sprint.copyPlan': '📋 Copy Plan',
  'sprint.copiedAlert': 'Tasks copied to clipboard',
  'sprint.noBacklog': 'No backlog candidates',
  'sprint.sizeOk': 'tasks, size is reasonable',
  'sprint.sizeTooMany': 'tasks, recommend keeping under 10',
  'sprint.selectHint': 'Select tasks from the left to add to next Sprint',
  // Risk
  'risk.subtitle': 'Auto-detect risks based on current Sprint data',
  'risk.errorLoad': 'Failed to load data',
  'risk.assigneeLabel': 'Assignee', 'risk.noMatchRisk': 'No matching risks',
  'risk.noCollabTasks': 'No cross-team collaboration tasks in this Sprint',
  'risk.collabDesc': 'The system detects cross-team collaboration by identifying project prefixes in issue titles (e.g. CP|TMS|OMS)',
  'risk.collabDetected': 'cross-team collaboration project(s)',
  'risk.collabWith': 'with', 'risk.collabTasks': 'task(s)',
  'risk.collabDone': 'Done', 'risk.collabInProgress': 'In Progress',
  'risk.completionRate': 'Completion Rate', 'risk.moreIssues': 'more task(s)...',
  'risk.unassignedHighPriority': 'Unassigned High Priority Tasks (Immediate Action Required)',
  'risk.overtimeLabel': 'Over-estimated Tasks',
  'risk.noUpdateDays': 'In Progress but No Update for 3 Days',
  'risk.noDepsRisk': 'No dependency risks detected',
  'risk.daysNoUpdate': 'days without update', 'risk.exceed': 'Exceeded',
  // Requirements
  'req.subtitle': 'requirements', 'req.reqs': 'requirements', 'req.filtered': 'filtered',
  'req.lastYear': 'last year', 'req.syncing': 'Syncing…',
  'req.statusDraft': 'Draft/To Do', 'req.statusReview': 'In Review',
  'req.statusDev': 'In Development', 'req.statusTest': 'In Testing', 'req.statusDone': 'Done',
  'req.p0Urgent': 'P0 Urgent', 'req.p1High': 'P1 High',
  'req.p2Medium': 'P2 Medium', 'req.p3Low': 'P3 Low',
  'req.errorLoad': 'Failed to load data',
  // Settings
  'settings.subtitle': 'Project configuration and integration management',
  'settings.projectConfig': 'Project Config',
  'settings.boardId': 'Board ID', 'settings.projectKey': 'Project Key',
  'settings.notConfigured': 'Not configured',
  'settings.configDesc': 'Board ID and Project Key are configured via VITE_DEFAULT_BOARD_ID environment variable',
  'settings.jiraIntegration': 'Jira Integration',
  'settings.connectionStatus': 'Connection Status',
  'settings.notTested': 'Not tested', 'settings.jiraUrl': 'Jira URL',
  'settings.lastSync': 'Last Sync', 'settings.testing': 'Testing…',
  'settings.notifSettings': 'Notification Settings',
  'settings.highRiskPush': 'High Risk Push',
  'settings.highRiskPushDesc': 'Auto-push to WeCom when high risks are detected',
  'settings.dailyPush': 'Daily Report Push',
  'settings.dailyPushDesc': 'Auto-push daily report to WeCom before end of day',
  'settings.weeklyPush': 'Weekly Report Push',
  'settings.weeklyPushDesc': 'Auto-push weekly report to WeCom on Friday afternoon',
  'settings.permManagement': 'Permission Management',
  'settings.feature': 'Feature', 'settings.pm': 'PM', 'settings.dev': 'DEV',
  'settings.perm.viewSprint': 'View Sprint Board',
  'settings.perm.manageSprint': 'Manage Sprint (Create/Close)',
  'settings.perm.viewReqs': 'View Requirements',
  'settings.perm.editReqs': 'Create/Edit Requirements',
  'settings.perm.viewRisk': 'View Risk Board',
  'settings.perm.pushRisk': 'Push Risk Notifications',
  'settings.perm.viewReports': 'View Reports',
  'settings.perm.pushReports': 'Push Reports',
  'settings.perm.editConfig': 'Edit Project Config',
  'settings.perm.manageJira': 'Manage Jira Integration',
  // AI Insight
  'ai.insight': 'AI Insight', 'ai.generate': '✨ Generate Analysis',
  'ai.regenerate': '🔄 Regenerate', 'ai.analyzing': 'AI is analyzing',
  'ai.collapse': 'Collapse', 'ai.expand': 'Expand',
  'ai.retry': 'Retry', 'ai.cached': 'Cached',
  // Change tab
  'change.priorityChange': 'Priority Change', 'change.newAddition': 'New Addition',
  'change.scopeChange': 'Scope Change', 'change.statusRegression': 'Status Regression',
  'change.totalChanges': 'Total Changes',
  'change.affectedTasks': 'Affected Tasks',
  'change.highImpact': 'High Impact', 'change.mediumImpact': 'Medium Impact',
  'change.lowImpact': 'Low Impact',
  'change.baselineVsCurrent': 'Baseline vs Current',
  'change.reqCount': 'Requirements', 'change.changeTasks': 'Changed Tasks',
  'change.detection': 'Change Detection',
  'change.scopeCreepAnalysis': 'Scope Creep Analysis',
  'change.scopeCreepWarning': 'Scope Creep Warning',
  'change.scopeGrowth': 'Scope Growth',
  'change.baselineReqs': 'Baseline Requirements', 'change.currentReqs': 'Current Requirements',
  'change.addedReqs': 'Added Requirements', 'change.addedTasks': 'Added Tasks',
  'change.newReqTimeline': 'New Requirements Timeline',
  'change.aiAnalysis': 'AI Change Analysis', 'change.aiAnalyzeBtn': 'AI Change Analysis',
  'change.aiAnalyzing': 'AI is analyzing changes',
  'change.noSprintDate': 'Sprint start date unavailable, cannot perform change detection',
  'change.noChanges': 'No requirement changes detected',
  'change.severityHigh': 'High', 'change.severityMedium': 'Medium', 'change.severityLow': 'Low',
  // Global search
  'search.pages': 'Pages', 'search.tasks': 'Tasks',
  'search.noResults': 'No results found',
  'search.navigate': '↑↓ Navigate', 'search.jump': 'Enter to jump', 'search.close': 'Esc to close',
  // Toast / errors
  'toast.pushSuccess': '✅ Push Successful', 'toast.pushSuccessDesc': 'Message sent to WeCom group',
  'toast.pushFail': '❌ Push Failed', 'toast.pushFailDesc': 'Please check WeCom Webhook configuration',
  'toast.connectSuccess': '✅ Connection Successful', 'toast.connectSuccessDesc': 'Jira server connection is normal',
  'toast.connectFail': '❌ Connection Failed', 'toast.connectFailDesc': 'Please check Jira URL and authentication configuration',
  'error.aiTimeout': 'AI response timeout, please retry',
  // Roadmap templates
  'roadmap.template.reqAnalysis': 'Requirements Analysis', 'roadmap.template.design': 'Design',
  'roadmap.template.development': 'Development', 'roadmap.template.testing': 'Testing',
  'roadmap.template.release': 'Release',
}

const ja: Translations = {
  'nav.dashboard': 'ダッシュボード', 'nav.requirements': '要件管理',
  'nav.sprint': 'スプリント', 'nav.risk': 'リスク・協力',
  'nav.reports': 'レポート', 'nav.settings': '設定',
  'common.loading': '読み込み中...', 'common.sync': '今すぐ同期',
  'common.reset': 'フィルターリセット', 'common.search': '検索',
  'common.all': 'すべて', 'common.save': '保存',
  'common.cancel': 'キャンセル', 'common.confirm': '確認',
  'common.close': '閉じる', 'common.noData': 'データなし',
  'common.selectProject': 'プロジェクトを選択...', 'common.error': '読み込み失敗',
  'common.notify': '通知', 'common.push': 'WeCom送信',
  'common.edit': '編集', 'common.view': '表示',
  'dashboard.title': 'プロジェクト概要', 'dashboard.globalView': 'グローバル',
  'dashboard.personalView': '個人', 'dashboard.aiDecision': '🧠 AI判断',
  'dashboard.completionRate': 'スプリント完了率', 'dashboard.riskAlert': 'リスク警告',
  'dashboard.unassigned': '未割当', 'dashboard.totalTasks': '総タスク数',
  'dashboard.burndown': 'バーンダウン', 'dashboard.teamLoad': 'チーム負荷',
  'dashboard.riskList': 'リスク一覧', 'dashboard.statusDist': 'ステータス分布',
  'dashboard.noActiveSprint': 'アクティブスプリントなし',
  'dashboard.selectProjectHint': 'プロジェクトを選択してください',
  'dashboard.inProgress': '進行中', 'dashboard.todo': '未着手',
  'dashboard.done': '完了', 'dashboard.inReview': 'レビュー中',
  'dashboard.inTesting': 'テスト中',
  'sprint.title': 'スプリント管理', 'sprint.board': 'ボード',
  'sprint.resource': 'リソース', 'sprint.change': '変更', 'sprint.plan': '計画',
  'sprint.completed': '完了', 'sprint.noActiveSprint': 'アクティブスプリントなし',
  'sprint.syncNow': '今すぐ同期', 'sprint.todo': '未着手',
  'sprint.inProgress': '進行中', 'sprint.inReview': 'レビュー中',
  'sprint.inTesting': 'テスト中', 'sprint.done': '完了',
  'sprint.unassigned': '未割当',
  'req.title': '要件管理', 'req.total': '件',
  'req.list': 'リスト', 'req.kanban': 'かんばん',
  'req.allStatus': '全ステータス', 'req.allPriority': '全優先度',
  'req.allAssignee': '全担当者', 'req.searchPlaceholder': '要件を検索...',
  'req.syncJira': 'Jiraから同期',
  'risk.title': 'リスク・協力', 'risk.board': 'リスクボード',
  'risk.collab': 'チーム間協力', 'risk.deps': '依存関係',
  'risk.high': '高', 'risk.medium': '中', 'risk.low': '低',
  'risk.highRisk': '高リスク', 'risk.mediumRisk': '中リスク', 'risk.lowRisk': '低リスク',
  'risk.allLevel': '全レベル', 'risk.allType': '全タイプ',
  'risk.autoPush': 'WeCom自動送信',
  'risk.unassigned': '未割当', 'risk.overtime': '超過',
  'risk.scopeCreep': 'スコープ拡大', 'risk.dependency': '依存',
  'risk.identified': '識別済', 'risk.evaluating': '評価中',
  'risk.handling': '対応中', 'risk.closed': '完了',
  'reports.title': 'レポート', 'reports.daily': '日報',
  'reports.weekly': '週報', 'reports.sprint': 'スプリントレビュー',
  'reports.draft': '下書き', 'reports.pushed': '送信済',
  'reports.pushWecom': 'WeComに送信', 'reports.generate': '生成',
  'reports.preview': 'プレビュー',
  'settings.title': '設定', 'settings.project': 'プロジェクト設定',
  'settings.jira': 'Jira連携', 'settings.notifications': '通知設定',
  'settings.permissions': '権限管理', 'settings.testConnection': '接続テスト',
  'settings.connected': '接続済', 'settings.disconnected': '未接続',
  'topbar.selectBoard': 'プロジェクトを選択...', 'topbar.search': 'タスク・要件を検索...',
  'topbar.switchRole': 'ロール切替', 'topbar.pm': 'PM', 'topbar.dev': 'DEV',
  'topbar.logout': 'ログアウト',
  'common.unassigned': '未割当', 'common.completed': '完了',
  'common.inProgress': '進行中', 'common.todo': '未着手',
  'common.inReview': 'レビュー中', 'common.inTesting': 'テスト中',
  'dashboard.myTasks': '私のタスク', 'dashboard.myProgress': '私の進捗',
  'dashboard.pendingItems': '対応待ち', 'dashboard.activeIssues': '進行中タスク',
  'req.id': 'ID', 'req.title2': 'タイトル', 'req.status': 'ステータス',
  'req.priority': '優先度', 'req.assignee': '担当者', 'req.labels': 'ラベル',
  'sprint.filterPriority': '優先度', 'sprint.filterAssignee': '担当者',
  'sprint.filterKeyword': 'IDまたはタイトルを検索...',
  'sprint.resetFilter': 'フィルターリセット',
  'layout.devBanner': '開発者ビュー · あなたのタスクをハイライト',
  'nav.roadmap': 'プロジェクトロードマップ',
  'roadmap.title': 'プロジェクトロードマップ',
  'roadmap.addMilestone': 'マイルストーンを追加',
  'roadmap.addNode': 'キーノードを追加',
  'roadmap.selectTemplate': 'テンプレートを選択',
  'roadmap.syncJira': 'Jira から同期',
  'roadmap.emptyState': 'ロードマップデータがありません。マイルストーンを追加するかテンプレートを選択してください。',
  'roadmap.deleteMilestoneConfirm': 'このマイルストーンを削除しますか？',
  'roadmap.deleteNodeConfirm': 'このキーノードを削除しますか？',
  'roadmap.replaceConfirm': 'テンプレートを適用すると既存データが置き換えられます。続行しますか？',
  'roadmap.overdue': '期限超過',
  'roadmap.today': '今日',
  'roadmap.noVersions': 'Fix Version が見つかりません',
  'roadmap.syncSuccess': '同期成功',
  'roadmap.storageWarning': 'データは永続化されません',
  'roadmap.template.agileSprint.name': 'Agile Sprint テンプレート',
  'roadmap.template.agileSprint.description': '6つの2週間スプリント、レビューとリリースノード付き',
  'roadmap.template.quarterly.name': '四半期計画テンプレート',
  'roadmap.template.quarterly.description': '4つの四半期マイルストーン、四半期レビュー付き',
  'roadmap.template.productLaunch.name': '製品リリーステンプレート',
  'roadmap.template.productLaunch.description': '要件→設計→開発→テスト→リリースの5段階',
  'roadmap.template.customBlank.name': 'カスタム空白',
  'roadmap.template.customBlank.description': 'ゼロから作成',
  // Resource tab
  'resource.totalTasks': '総タスク', 'resource.assigned': '割当済',
  'resource.unassigned': '未割当', 'resource.avgLoad': '平均負荷',
  'resource.overloaded': '過負荷', 'resource.balanced': 'バランス',
  'resource.underloaded': '余裕あり', 'resource.load': '負荷',
  'resource.noTasks': 'タスクなし', 'resource.noData': 'データなし',
  'resource.developer': '開発者',
  'resource.collapse': '折りたたむ', 'resource.expandMore': 'もっと見る',
  'resource.sortBy': 'ソート：', 'resource.sortLoad': '負荷',
  'resource.sortTaskCount': 'タスク数', 'resource.sortName': '名前',
  'resource.detailAll': '全タスク', 'resource.detailAssigned': '割当済タスク',
  'resource.detailUnassigned': '未割当タスク', 'resource.detailOverloaded': '過負荷開発者のタスク',
  'resource.detailBalanced': 'バランス開発者のタスク', 'resource.detailUnderloaded': '余裕開発者のタスク',
  'resource.unassignedBanner': '件のタスクが未割当です',
  // Common
  'common.selectProjectFirst': 'プロジェクトを選択してください',
  'common.selectProjectHint': '上部のナビゲーションからプロジェクトを選択してください',
  // Requirements kanban
  'req.draft': '下書き', 'req.pendingReview': 'レビュー待ち / レビュー中',
  'req.confirmed': '確認済', 'req.inDev': '開発中', 'req.done': '完了',
  'req.noMatch': '一致する要件がありません',
  // Milestone dialog
  'milestone.planned': '計画中', 'milestone.inProgress': '進行中',
  'milestone.completed': '完了', 'milestone.delayed': '遅延',
  'milestone.editTitle': 'マイルストーンを編集', 'milestone.name': '名前',
  'milestone.startDate': '開始日', 'milestone.endDate': '終了日',
  'milestone.status': 'ステータス', 'milestone.description': '説明',
  'milestone.namePlaceholder': 'マイルストーン名', 'milestone.descPlaceholder': '任意の説明',
  'milestone.nameRequired': '名前は必須です', 'milestone.startRequired': '開始日を選択してください',
  'milestone.endRequired': '終了日を選択してください', 'milestone.dateError': '開始日は終了日より前にしてください',
  'milestone.delete': '削除',
  // Roadmap toolbar
  'roadmap.selectProjectTooltip': 'プロジェクトを選択してください', 'roadmap.clearAll': 'クリア',
  // Reports page
  'reports.subtitle': 'プロジェクトレポートの自動生成と送信',
  'reports.monthly': '月報', 'reports.collaboration': 'コラボレーション',
  'reports.dailyDesc': '日次進捗', 'reports.weeklyDesc': '週次まとめ',
  'reports.sprintDesc': 'スプリント振り返り', 'reports.monthlyDesc': '月次まとめ',
  'reports.collaborationDesc': 'チーム間',
  'reports.reportList': 'レポート一覧', 'reports.allTypes': '全タイプ',
  'reports.allStatus': '全ステータス',
  'reports.type': 'タイプ', 'reports.reportTitle': 'タイトル',
  'reports.date': '日付', 'reports.status': 'ステータス',
  'reports.actions': '操作', 'reports.pushing': '送信中…',
  'reports.previewEmpty': '← 左のレポートをクリックして詳細を表示',
  // Dashboard
  'dashboard.subtitle.sprints': 'アクティブスプリント',
  'dashboard.subtitle.tasks': 'タスク',
  'dashboard.subtitle.activeSprints': 'アクティブスプリント',
  'dashboard.completionRateLabel': '完了率',
  'dashboard.highRisk': '高リスク', 'dashboard.mediumRisk': '中リスク',
  'dashboard.completedTasks': '完了タスク', 'dashboard.pendingRisks': '対応待ちリスク',
  'dashboard.noRisks': 'リスクなし',
  'dashboard.viewAll': 'すべて表示', 'dashboard.level': 'レベル',
  'dashboard.riskType': 'タイプ', 'dashboard.description': '説明',
  'dashboard.assignee': '担当者', 'dashboard.riskStatus': 'ステータス',
  'dashboard.totalCount': '合計', 'dashboard.showFirst50': '最初の50件のみ表示',
  'dashboard.idealLine': '理想線', 'dashboard.actualLine': '実績',
  'dashboard.taskCount': 'タスク数',
  'dashboard.needAssign': '担当者の割り当てが必要', 'dashboard.allAssigned': 'すべて割当済',
  'dashboard.clickDetail': 'クリックして詳細を表示',
  'dashboard.noTasksForYou': 'このスプリントにあなたに割り当てられたタスクはありません',
  'dashboard.items': '件', 'dashboard.sprintCompletionRate': 'スプリント完了率',
  'dashboard.errorLoad': 'データの読み込みに失敗しました',
  // Sprint
  'sprint.syncing': '同期中…', 'sprint.errorLoad': 'データの読み込みに失敗しました',
  'sprint.planBannerTitle': '📋 スプリント計画アシスタント',
  'sprint.planBannerDesc': 'AIがバックログから候補タスクを優先度と緊急度で並べ替えました。タスクを選択して計画リストをエクスポートできます。',
  'sprint.currentSprint': '現在のスプリント', 'sprint.backlogCandidates': 'バックログ候補',
  'sprint.selected': '選択済',
  'sprint.backlogTitle': '📥 バックログ候補（AI並べ替え済）',
  'sprint.selectTop10': 'トップ10を選択',
  'sprint.thId': 'ID', 'sprint.thTitle': 'タイトル', 'sprint.thPriority': '優先度',
  'sprint.thAssignee': '担当者', 'sprint.thAiScore': 'AIスコア',
  'sprint.aiPlanSuggestion': '🧠 AI計画提案',
  'sprint.selectedTasks': '選択済タスク',
  'sprint.clearSelection': 'クリア', 'sprint.copyPlan': '📋 計画をコピー',
  'sprint.copiedAlert': 'タスクをクリップボードにコピーしました',
  'sprint.noBacklog': 'バックログに候補タスクがありません',
  'sprint.sizeOk': 'タスク、適切な規模です',
  'sprint.sizeTooMany': 'タスク、10個以内を推奨',
  'sprint.selectHint': '左から次のスプリントに追加するタスクを選択してください',
  // Risk
  'risk.subtitle': '現在のスプリントデータに基づくリスク自動検出',
  'risk.errorLoad': 'データの読み込みに失敗しました',
  'risk.assigneeLabel': '担当者', 'risk.noMatchRisk': '一致するリスクなし',
  'risk.noCollabTasks': 'このスプリントにチーム間協力タスクはありません',
  'risk.collabDesc': 'システムはIssueタイトルのプロジェクトプレフィックス（例：CP|TMS|OMS）を識別してチーム間協力を検出します',
  'risk.collabDetected': 'チーム間協力プロジェクト',
  'risk.collabWith': 'と', 'risk.collabTasks': 'タスク',
  'risk.collabDone': '完了', 'risk.collabInProgress': '進行中',
  'risk.completionRate': '完了率', 'risk.moreIssues': 'タスク...',
  'risk.unassignedHighPriority': '未割当の高優先度タスク（即時対応が必要）',
  'risk.overtimeLabel': '見積超過タスク',
  'risk.noUpdateDays': '進行中だが3日間更新なし',
  'risk.noDepsRisk': '依存リスクは検出されませんでした',
  'risk.daysNoUpdate': '日間更新なし', 'risk.exceed': '超過',
  // Requirements
  'req.subtitle': '要件', 'req.reqs': '件の要件', 'req.filtered': 'フィルター後',
  'req.lastYear': '過去1年', 'req.syncing': '同期中…',
  'req.statusDraft': '下書き/未着手', 'req.statusReview': 'レビュー中',
  'req.statusDev': '開発中', 'req.statusTest': 'テスト中', 'req.statusDone': '完了',
  'req.p0Urgent': 'P0 緊急', 'req.p1High': 'P1 高',
  'req.p2Medium': 'P2 中', 'req.p3Low': 'P3 低',
  'req.errorLoad': 'データの読み込みに失敗しました',
  // Settings
  'settings.subtitle': 'プロジェクト設定と連携管理',
  'settings.projectConfig': 'プロジェクト設定',
  'settings.boardId': 'ボードID', 'settings.projectKey': 'プロジェクトキー',
  'settings.notConfigured': '未設定',
  'settings.configDesc': 'ボードIDとプロジェクトキーは環境変数 VITE_DEFAULT_BOARD_ID で設定します',
  'settings.jiraIntegration': 'Jira連携',
  'settings.connectionStatus': '接続状態',
  'settings.notTested': '未テスト', 'settings.jiraUrl': 'Jira URL',
  'settings.lastSync': '最終同期', 'settings.testing': 'テスト中…',
  'settings.notifSettings': '通知設定',
  'settings.highRiskPush': '高リスク通知',
  'settings.highRiskPushDesc': '高リスク検出時にWeComに自動送信',
  'settings.dailyPush': '日報送信',
  'settings.dailyPushDesc': '毎日退勤前にWeComに日報を自動送信',
  'settings.weeklyPush': '週報送信',
  'settings.weeklyPushDesc': '毎週金曜午後にWeComに週報を自動送信',
  'settings.permManagement': '権限管理',
  'settings.feature': '機能', 'settings.pm': 'PM', 'settings.dev': 'DEV',
  'settings.perm.viewSprint': 'スプリントボードの表示',
  'settings.perm.manageSprint': 'スプリントの管理（作成/終了）',
  'settings.perm.viewReqs': '要件一覧の表示',
  'settings.perm.editReqs': '要件の作成/編集',
  'settings.perm.viewRisk': 'リスクボードの表示',
  'settings.perm.pushRisk': 'リスク通知の送信',
  'settings.perm.viewReports': 'レポートの表示',
  'settings.perm.pushReports': 'レポートの送信',
  'settings.perm.editConfig': 'プロジェクト設定の編集',
  'settings.perm.manageJira': 'Jira連携の管理',
  // AI Insight
  'ai.insight': 'AIインサイト', 'ai.generate': '✨ 分析を生成',
  'ai.regenerate': '🔄 再分析', 'ai.analyzing': 'AI分析中',
  'ai.collapse': '折りたたむ', 'ai.expand': '展開',
  'ai.retry': '再試行', 'ai.cached': 'キャッシュ済',
  // Change tab
  'change.priorityChange': '優先度変更', 'change.newAddition': '新規追加',
  'change.scopeChange': 'スコープ変更', 'change.statusRegression': 'ステータス後退',
  'change.totalChanges': '総変更数',
  'change.affectedTasks': '影響タスク数',
  'change.highImpact': '高影響', 'change.mediumImpact': '中影響',
  'change.lowImpact': '低影響',
  'change.baselineVsCurrent': 'ベースライン vs 現在',
  'change.reqCount': '要件数', 'change.changeTasks': '変更タスク',
  'change.detection': '変更検出',
  'change.scopeCreepAnalysis': 'スコープ拡大分析',
  'change.scopeCreepWarning': 'スコープ拡大警告',
  'change.scopeGrowth': 'スコープ増加',
  'change.baselineReqs': 'ベースライン要件数', 'change.currentReqs': '現在の要件数',
  'change.addedReqs': '追加要件', 'change.addedTasks': '追加タスク数',
  'change.newReqTimeline': '新規要件タイムライン',
  'change.aiAnalysis': 'AI変更分析', 'change.aiAnalyzeBtn': 'AI変更分析',
  'change.aiAnalyzing': 'AIが変更を分析中',
  'change.noSprintDate': 'スプリント開始日が利用できないため、変更検出を実行できません',
  'change.noChanges': '要件変更は検出されませんでした',
  'change.severityHigh': '高', 'change.severityMedium': '中', 'change.severityLow': '低',
  // Global search
  'search.pages': 'ページ', 'search.tasks': 'タスク',
  'search.noResults': '結果が見つかりません',
  'search.navigate': '↑↓ ナビゲーション', 'search.jump': 'Enter ジャンプ', 'search.close': 'Esc 閉じる',
  // Toast / errors
  'toast.pushSuccess': '✅ 送信成功', 'toast.pushSuccessDesc': 'WeComグループにメッセージを送信しました',
  'toast.pushFail': '❌ 送信失敗', 'toast.pushFailDesc': 'WeCom Webhook設定を確認してください',
  'toast.connectSuccess': '✅ 接続成功', 'toast.connectSuccessDesc': 'Jiraサーバー接続は正常です',
  'toast.connectFail': '❌ 接続失敗', 'toast.connectFailDesc': 'Jira URLと認証設定を確認してください',
  'error.aiTimeout': 'AI response timeout, please retry',
  // Roadmap templates
  'roadmap.template.reqAnalysis': '要件分析', 'roadmap.template.design': '設計',
  'roadmap.template.development': '開発', 'roadmap.template.testing': 'テスト',
  'roadmap.template.release': 'リリース',
}

const es: Translations = {
  'nav.dashboard': 'Panel', 'nav.requirements': 'Requisitos',
  'nav.sprint': 'Sprint', 'nav.risk': 'Riesgos',
  'nav.reports': 'Informes', 'nav.settings': 'Configuración',
  'common.loading': 'Cargando...', 'common.sync': 'Sincronizar',
  'common.reset': 'Restablecer', 'common.search': 'Buscar',
  'common.all': 'Todos', 'common.save': 'Guardar',
  'common.cancel': 'Cancelar', 'common.confirm': 'Confirmar',
  'common.close': 'Cerrar', 'common.noData': 'Sin datos',
  'common.selectProject': 'Seleccionar proyecto...', 'common.error': 'Error al cargar',
  'common.notify': 'Notificar', 'common.push': 'Enviar a WeCom',
  'common.edit': 'Editar', 'common.view': 'Ver',
  'dashboard.title': 'Panel del Proyecto', 'dashboard.globalView': 'Vista Global',
  'dashboard.personalView': 'Mi Vista', 'dashboard.aiDecision': '🧠 Decisión IA',
  'dashboard.completionRate': 'Tasa de Completado', 'dashboard.riskAlert': 'Alertas de Riesgo',
  'dashboard.unassigned': 'Sin Asignar', 'dashboard.totalTasks': 'Total Tareas',
  'dashboard.burndown': 'Gráfico Burndown', 'dashboard.teamLoad': 'Carga del Equipo',
  'dashboard.riskList': 'Lista de Riesgos', 'dashboard.statusDist': 'Distribución de Estado',
  'dashboard.noActiveSprint': 'Sin sprint activo',
  'dashboard.selectProjectHint': 'Seleccione un proyecto arriba',
  'dashboard.inProgress': 'En Progreso', 'dashboard.todo': 'Por Hacer',
  'dashboard.done': 'Completado', 'dashboard.inReview': 'En Revisión',
  'dashboard.inTesting': 'En Pruebas',
  'sprint.title': 'Gestión de Sprint', 'sprint.board': 'Tablero',
  'sprint.resource': 'Recursos', 'sprint.change': 'Cambios', 'sprint.plan': 'Planificación',
  'sprint.completed': 'Completado', 'sprint.noActiveSprint': 'Sin sprint activo',
  'sprint.syncNow': 'Sincronizar', 'sprint.todo': 'Por Hacer',
  'sprint.inProgress': 'En Progreso', 'sprint.inReview': 'En Revisión',
  'sprint.inTesting': 'En Pruebas', 'sprint.done': 'Completado',
  'sprint.unassigned': 'Sin Asignar',
  'req.title': 'Requisitos', 'req.total': 'requisitos',
  'req.list': 'Lista', 'req.kanban': 'Kanban',
  'req.allStatus': 'Todos los estados', 'req.allPriority': 'Todas las prioridades',
  'req.allAssignee': 'Todos los asignados', 'req.searchPlaceholder': 'Buscar requisitos...',
  'req.syncJira': 'Sincronizar desde Jira',
  'risk.title': 'Riesgos y Colaboración', 'risk.board': 'Tablero de Riesgos',
  'risk.collab': 'Colaboración', 'risk.deps': 'Dependencias',
  'risk.high': 'Alto', 'risk.medium': 'Medio', 'risk.low': 'Bajo',
  'risk.highRisk': 'Riesgo Alto', 'risk.mediumRisk': 'Riesgo Medio', 'risk.lowRisk': 'Riesgo Bajo',
  'risk.allLevel': 'Todos los niveles', 'risk.allType': 'Todos los tipos',
  'risk.autoPush': 'Envío automático a WeCom',
  'risk.unassigned': 'Sin asignar', 'risk.overtime': 'Tiempo extra',
  'risk.scopeCreep': 'Expansión de alcance', 'risk.dependency': 'Dependencia',
  'risk.identified': 'Identificado', 'risk.evaluating': 'Evaluando',
  'risk.handling': 'Manejando', 'risk.closed': 'Cerrado',
  'reports.title': 'Informes', 'reports.daily': 'Diario',
  'reports.weekly': 'Semanal', 'reports.sprint': 'Revisión Sprint',
  'reports.draft': 'Borrador', 'reports.pushed': 'Enviado',
  'reports.pushWecom': 'Enviar a WeCom', 'reports.generate': 'Generar',
  'reports.preview': 'Vista previa',
  'settings.title': 'Configuración', 'settings.project': 'Config. Proyecto',
  'settings.jira': 'Integración Jira', 'settings.notifications': 'Notificaciones',
  'settings.permissions': 'Permisos', 'settings.testConnection': 'Probar Conexión',
  'settings.connected': 'Conectado', 'settings.disconnected': 'Desconectado',
  'topbar.selectBoard': 'Seleccionar proyecto...', 'topbar.search': 'Buscar tareas...',
  'topbar.switchRole': 'Cambiar Rol', 'topbar.pm': 'PM', 'topbar.dev': 'DEV',
  'topbar.logout': 'Cerrar sesión',
  'common.unassigned': 'Sin asignar', 'common.completed': 'Completado',
  'common.inProgress': 'En Progreso', 'common.todo': 'Por Hacer',
  'common.inReview': 'En Revisión', 'common.inTesting': 'En Pruebas',
  'dashboard.myTasks': 'Mis Tareas', 'dashboard.myProgress': 'Mi Progreso',
  'dashboard.pendingItems': 'Pendientes', 'dashboard.activeIssues': 'Tareas Activas',
  'req.id': 'ID', 'req.title2': 'Título', 'req.status': 'Estado',
  'req.priority': 'Prioridad', 'req.assignee': 'Asignado', 'req.labels': 'Etiquetas',
  'sprint.filterPriority': 'Prioridad', 'sprint.filterAssignee': 'Asignado',
  'sprint.filterKeyword': 'Buscar ID o título...',
  'sprint.resetFilter': 'Restablecer',
  'layout.devBanner': 'Vista Desarrollador · Tus tareas resaltadas',
  'nav.roadmap': 'Hoja de ruta',
  'roadmap.title': 'Hoja de ruta del proyecto',
  'roadmap.addMilestone': 'Agregar hito',
  'roadmap.addNode': 'Agregar nodo clave',
  'roadmap.selectTemplate': 'Seleccionar plantilla',
  'roadmap.syncJira': 'Sincronizar desde Jira',
  'roadmap.emptyState': 'No hay datos de hoja de ruta. Agregue hitos o seleccione una plantilla.',
  'roadmap.deleteMilestoneConfirm': '¿Eliminar este hito?',
  'roadmap.deleteNodeConfirm': '¿Eliminar este nodo clave?',
  'roadmap.replaceConfirm': 'Aplicar una plantilla reemplazará los datos existentes. ¿Continuar?',
  'roadmap.overdue': 'Vencido',
  'roadmap.today': 'Hoy',
  'roadmap.noVersions': 'No se encontraron Fix Versions',
  'roadmap.syncSuccess': 'Sincronización exitosa',
  'roadmap.storageWarning': 'Los datos no se persistirán',
  'roadmap.template.agileSprint.name': 'Plantilla Agile Sprint',
  'roadmap.template.agileSprint.description': '6 sprints de 2 semanas con revisiones y lanzamiento',
  'roadmap.template.quarterly.name': 'Plantilla de planificación trimestral',
  'roadmap.template.quarterly.description': '4 hitos trimestrales con revisiones',
  'roadmap.template.productLaunch.name': 'Plantilla de lanzamiento de producto',
  'roadmap.template.productLaunch.description': 'Requisitos → Diseño → Desarrollo → Pruebas → Lanzamiento',
  'roadmap.template.customBlank.name': 'Personalizado en blanco',
  'roadmap.template.customBlank.description': 'Comenzar desde cero',
  // Resource tab
  'resource.totalTasks': 'Total Tareas', 'resource.assigned': 'Asignadas',
  'resource.unassigned': 'Sin Asignar', 'resource.avgLoad': 'Carga Prom.',
  'resource.overloaded': 'Sobrecargado', 'resource.balanced': 'Equilibrado',
  'resource.underloaded': 'Disponible', 'resource.load': 'Carga',
  'resource.noTasks': 'Sin tareas', 'resource.noData': 'Sin datos',
  'resource.developer': 'Desarrollador',
  'resource.collapse': 'Colapsar', 'resource.expandMore': 'Ver más',
  'resource.sortBy': 'Ordenar: ', 'resource.sortLoad': 'Carga',
  'resource.sortTaskCount': 'Tareas', 'resource.sortName': 'Nombre',
  'resource.detailAll': 'Todas las Tareas', 'resource.detailAssigned': 'Tareas Asignadas',
  'resource.detailUnassigned': 'Tareas Sin Asignar', 'resource.detailOverloaded': 'Tareas de Devs Sobrecargados',
  'resource.detailBalanced': 'Tareas de Devs Equilibrados', 'resource.detailUnderloaded': 'Tareas de Devs Disponibles',
  'resource.unassignedBanner': 'tareas sin asignar',
  // Common
  'common.selectProjectFirst': 'Seleccione un proyecto primero',
  'common.selectProjectHint': 'Seleccione un proyecto desde la navegación superior',
  // Requirements kanban
  'req.draft': 'Borrador', 'req.pendingReview': 'Pendiente / En Revisión',
  'req.confirmed': 'Confirmado', 'req.inDev': 'En Desarrollo', 'req.done': 'Completado',
  'req.noMatch': 'No hay requisitos coincidentes',
  // Milestone dialog
  'milestone.planned': 'Planificado', 'milestone.inProgress': 'En Progreso',
  'milestone.completed': 'Completado', 'milestone.delayed': 'Retrasado',
  'milestone.editTitle': 'Editar Hito', 'milestone.name': 'Nombre',
  'milestone.startDate': 'Fecha de Inicio', 'milestone.endDate': 'Fecha de Fin',
  'milestone.status': 'Estado', 'milestone.description': 'Descripción',
  'milestone.namePlaceholder': 'Nombre del hito', 'milestone.descPlaceholder': 'Descripción opcional',
  'milestone.nameRequired': 'El nombre es obligatorio', 'milestone.startRequired': 'Seleccione fecha de inicio',
  'milestone.endRequired': 'Seleccione fecha de fin', 'milestone.dateError': 'La fecha de inicio no puede ser posterior a la de fin',
  'milestone.delete': 'Eliminar',
  // Roadmap toolbar
  'roadmap.selectProjectTooltip': 'Seleccione un proyecto primero', 'roadmap.clearAll': 'Limpiar Todo',
  // Reports page
  'reports.subtitle': 'Generar y enviar informes de proyecto automáticamente',
  'reports.monthly': 'Mensual', 'reports.collaboration': 'Colaboración',
  'reports.dailyDesc': 'Progreso diario', 'reports.weeklyDesc': 'Resumen semanal',
  'reports.sprintDesc': 'Revisión de Sprint', 'reports.monthlyDesc': 'Resumen mensual',
  'reports.collaborationDesc': 'Entre equipos',
  'reports.reportList': 'Lista de Informes', 'reports.allTypes': 'Todos los tipos',
  'reports.allStatus': 'Todos los estados',
  'reports.type': 'Tipo', 'reports.reportTitle': 'Título',
  'reports.date': 'Fecha', 'reports.status': 'Estado',
  'reports.actions': 'Acciones', 'reports.pushing': 'Enviando…',
  'reports.previewEmpty': '← Haga clic en un informe a la izquierda para ver detalles',
  // Dashboard
  'dashboard.subtitle.sprints': 'sprint(s) activo(s)',
  'dashboard.subtitle.tasks': 'tarea(s)',
  'dashboard.subtitle.activeSprints': 'sprint(s) activo(s)',
  'dashboard.completionRateLabel': 'Tasa de Completado',
  'dashboard.highRisk': 'Riesgo Alto', 'dashboard.mediumRisk': 'Riesgo Medio',
  'dashboard.completedTasks': 'Tareas Completadas', 'dashboard.pendingRisks': 'Riesgos Pendientes',
  'dashboard.noRisks': 'Sin riesgos',
  'dashboard.viewAll': 'Ver Todo', 'dashboard.level': 'Nivel',
  'dashboard.riskType': 'Tipo', 'dashboard.description': 'Descripción',
  'dashboard.assignee': 'Asignado', 'dashboard.riskStatus': 'Estado',
  'dashboard.totalCount': 'Total', 'dashboard.showFirst50': 'Mostrando los primeros 50 de',
  'dashboard.idealLine': 'Ideal', 'dashboard.actualLine': 'Real',
  'dashboard.taskCount': 'Tareas',
  'dashboard.needAssign': 'Necesita asignación', 'dashboard.allAssigned': 'Todos asignados',
  'dashboard.clickDetail': 'Clic para ver detalles',
  'dashboard.noTasksForYou': 'No hay tareas asignadas a ti en este Sprint',
  'dashboard.items': 'elementos', 'dashboard.sprintCompletionRate': 'Tasa de Completado del Sprint',
  'dashboard.errorLoad': 'Error al cargar datos',
  // Sprint
  'sprint.syncing': 'Sincronizando…', 'sprint.errorLoad': 'Error al cargar datos',
  'sprint.planBannerTitle': '📋 Asistente de Planificación de Sprint',
  'sprint.planBannerDesc': 'La IA ha filtrado las tareas candidatas del backlog por prioridad y urgencia. Seleccione tareas para exportar una lista de planificación.',
  'sprint.currentSprint': 'Sprint Actual', 'sprint.backlogCandidates': 'Candidatos del Backlog',
  'sprint.selected': 'Seleccionados',
  'sprint.backlogTitle': '📥 Candidatos del Backlog (ordenados por IA)',
  'sprint.selectTop10': 'Seleccionar Top 10',
  'sprint.thId': 'ID', 'sprint.thTitle': 'Título', 'sprint.thPriority': 'Prioridad',
  'sprint.thAssignee': 'Asignado', 'sprint.thAiScore': 'Puntuación IA',
  'sprint.aiPlanSuggestion': '🧠 Sugerencia de Planificación IA',
  'sprint.selectedTasks': 'Tareas Seleccionadas',
  'sprint.clearSelection': 'Limpiar', 'sprint.copyPlan': '📋 Copiar Plan',
  'sprint.copiedAlert': 'Tareas copiadas al portapapeles',
  'sprint.noBacklog': 'Sin candidatos en el backlog',
  'sprint.sizeOk': 'tareas, tamaño razonable',
  'sprint.sizeTooMany': 'tareas, se recomienda mantener menos de 10',
  'sprint.selectHint': 'Seleccione tareas de la izquierda para agregar al próximo Sprint',
  // Risk
  'risk.subtitle': 'Detección automática de riesgos basada en datos del Sprint actual',
  'risk.errorLoad': 'Error al cargar datos',
  'risk.assigneeLabel': 'Asignado', 'risk.noMatchRisk': 'Sin riesgos coincidentes',
  'risk.noCollabTasks': 'Sin tareas de colaboración entre equipos en este Sprint',
  'risk.collabDesc': 'El sistema detecta colaboración entre equipos identificando prefijos de proyecto en títulos de issues (ej. CP|TMS|OMS)',
  'risk.collabDetected': 'proyecto(s) de colaboración entre equipos',
  'risk.collabWith': 'con', 'risk.collabTasks': 'tarea(s)',
  'risk.collabDone': 'Completado', 'risk.collabInProgress': 'En Progreso',
  'risk.completionRate': 'Tasa de Completado', 'risk.moreIssues': 'tarea(s) más...',
  'risk.unassignedHighPriority': 'Tareas de Alta Prioridad Sin Asignar (Acción Inmediata Requerida)',
  'risk.overtimeLabel': 'Tareas con Tiempo Excedido',
  'risk.noUpdateDays': 'En Progreso pero Sin Actualización por 3 Días',
  'risk.noDepsRisk': 'No se detectaron riesgos de dependencia',
  'risk.daysNoUpdate': 'días sin actualización', 'risk.exceed': 'Excedido',
  // Requirements
  'req.subtitle': 'requisitos', 'req.reqs': 'requisitos', 'req.filtered': 'filtrados',
  'req.lastYear': 'último año', 'req.syncing': 'Sincronizando…',
  'req.statusDraft': 'Borrador/Por Hacer', 'req.statusReview': 'En Revisión',
  'req.statusDev': 'En Desarrollo', 'req.statusTest': 'En Pruebas', 'req.statusDone': 'Completado',
  'req.p0Urgent': 'P0 Urgente', 'req.p1High': 'P1 Alto',
  'req.p2Medium': 'P2 Medio', 'req.p3Low': 'P3 Bajo',
  'req.errorLoad': 'Error al cargar datos',
  // Settings
  'settings.subtitle': 'Configuración del proyecto y gestión de integraciones',
  'settings.projectConfig': 'Config. del Proyecto',
  'settings.boardId': 'ID del Tablero', 'settings.projectKey': 'Clave del Proyecto',
  'settings.notConfigured': 'No configurado',
  'settings.configDesc': 'El ID del tablero y la clave del proyecto se configuran mediante la variable de entorno VITE_DEFAULT_BOARD_ID',
  'settings.jiraIntegration': 'Integración Jira',
  'settings.connectionStatus': 'Estado de Conexión',
  'settings.notTested': 'No probado', 'settings.jiraUrl': 'URL de Jira',
  'settings.lastSync': 'Última Sincronización', 'settings.testing': 'Probando…',
  'settings.notifSettings': 'Configuración de Notificaciones',
  'settings.highRiskPush': 'Notificación de Riesgo Alto',
  'settings.highRiskPushDesc': 'Enviar automáticamente a WeCom cuando se detecten riesgos altos',
  'settings.dailyPush': 'Envío de Informe Diario',
  'settings.dailyPushDesc': 'Enviar automáticamente el informe diario a WeCom antes del fin del día',
  'settings.weeklyPush': 'Envío de Informe Semanal',
  'settings.weeklyPushDesc': 'Enviar automáticamente el informe semanal a WeCom el viernes por la tarde',
  'settings.permManagement': 'Gestión de Permisos',
  'settings.feature': 'Función', 'settings.pm': 'PM', 'settings.dev': 'DEV',
  'settings.perm.viewSprint': 'Ver Tablero Sprint',
  'settings.perm.manageSprint': 'Gestionar Sprint (Crear/Cerrar)',
  'settings.perm.viewReqs': 'Ver Requisitos',
  'settings.perm.editReqs': 'Crear/Editar Requisitos',
  'settings.perm.viewRisk': 'Ver Tablero de Riesgos',
  'settings.perm.pushRisk': 'Enviar Notificaciones de Riesgo',
  'settings.perm.viewReports': 'Ver Informes',
  'settings.perm.pushReports': 'Enviar Informes',
  'settings.perm.editConfig': 'Editar Config. del Proyecto',
  'settings.perm.manageJira': 'Gestionar Integración Jira',
  // AI Insight
  'ai.insight': 'IA Insight', 'ai.generate': '✨ Generar Análisis',
  'ai.regenerate': '🔄 Regenerar', 'ai.analyzing': 'IA analizando',
  'ai.collapse': 'Colapsar', 'ai.expand': 'Expandir',
  'ai.retry': 'Reintentar', 'ai.cached': 'En caché',
  // Change tab
  'change.priorityChange': 'Cambio de Prioridad', 'change.newAddition': 'Nueva Adición',
  'change.scopeChange': 'Cambio de Alcance', 'change.statusRegression': 'Regresión de Estado',
  'change.totalChanges': 'Total de Cambios',
  'change.affectedTasks': 'Tareas Afectadas',
  'change.highImpact': 'Alto Impacto', 'change.mediumImpact': 'Medio Impacto',
  'change.lowImpact': 'Bajo Impacto',
  'change.baselineVsCurrent': 'Línea Base vs Actual',
  'change.reqCount': 'Requisitos', 'change.changeTasks': 'Tareas Cambiadas',
  'change.detection': 'Detección de Cambios',
  'change.scopeCreepAnalysis': 'Análisis de Expansión de Alcance',
  'change.scopeCreepWarning': 'Advertencia de Expansión de Alcance',
  'change.scopeGrowth': 'Crecimiento del Alcance',
  'change.baselineReqs': 'Requisitos Base', 'change.currentReqs': 'Requisitos Actuales',
  'change.addedReqs': 'Requisitos Añadidos', 'change.addedTasks': 'Tareas Añadidas',
  'change.newReqTimeline': 'Línea de Tiempo de Nuevos Requisitos',
  'change.aiAnalysis': 'Análisis de Cambios IA', 'change.aiAnalyzeBtn': 'Análisis de Cambios IA',
  'change.aiAnalyzing': 'IA analizando cambios',
  'change.noSprintDate': 'Fecha de inicio del Sprint no disponible, no se puede realizar la detección de cambios',
  'change.noChanges': 'No se detectaron cambios en los requisitos',
  'change.severityHigh': 'Alto', 'change.severityMedium': 'Medio', 'change.severityLow': 'Bajo',
  // Global search
  'search.pages': 'Páginas', 'search.tasks': 'Tareas',
  'search.noResults': 'No se encontraron resultados',
  'search.navigate': '↑↓ Navegar', 'search.jump': 'Enter para ir', 'search.close': 'Esc para cerrar',
  // Toast / errors
  'toast.pushSuccess': '✅ Envío Exitoso', 'toast.pushSuccessDesc': 'Mensaje enviado al grupo WeCom',
  'toast.pushFail': '❌ Envío Fallido', 'toast.pushFailDesc': 'Verifique la configuración del Webhook de WeCom',
  'toast.connectSuccess': '✅ Conexión Exitosa', 'toast.connectSuccessDesc': 'La conexión al servidor Jira es normal',
  'toast.connectFail': '❌ Conexión Fallida', 'toast.connectFailDesc': 'Verifique la URL de Jira y la configuración de autenticación',
  'error.aiTimeout': 'AI response timeout, please retry',
  // Roadmap templates
  'roadmap.template.reqAnalysis': 'Análisis de Requisitos', 'roadmap.template.design': 'Diseño',
  'roadmap.template.development': 'Desarrollo', 'roadmap.template.testing': 'Pruebas',
  'roadmap.template.release': 'Lanzamiento',
}

export const translations: Record<Locale, Translations> = { zh, en, ja, es }
