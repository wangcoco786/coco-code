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
  | 'topbar.pm' | 'topbar.dev'
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
}

export const translations: Record<Locale, Translations> = { zh, en, ja, es }
