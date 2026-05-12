# Implementation Plan: 部门绩效 Dashboard

## Overview

基于 SPACE Framework + DORA Metrics 的五维度绩效评估系统实现计划。按照从底层计算引擎到上层 UI 组件的依赖顺序，逐步构建完整的部门绩效 Dashboard 功能。技术栈：React 18 + TypeScript + Vitest + fast-check + ECharts + TanStack Query + CSS Modules。

## Tasks

- [x] 1. 实现绩效计算引擎核心模块
  - [x] 1.1 创建数据模型和类型定义
    - 在 `src/lib/performanceEngine.ts` 中定义所有 TypeScript 接口和类型：`PerformanceIssue`、`MemberPerformance`、`DepartmentPerformance`、`PerformanceDistribution`、`ComplexityFactorInput`、`PerformanceWeights`、`PerformanceGrade`、`PerformanceDetails`、`StatusTransition`、`IssueComment`
    - 导出 `DEFAULT_WEIGHTS` 常量（throughput: 0.20, efficiency: 0.25, quality: 0.25, impact: 0.15, collaboration: 0.15）
    - 导出 `getPerformanceGrade` 和 `getGradeColor` 辅助函数
    - _Requirements: 4.1, 4.2, 6.1, 6.2_

  - [x] 1.2 实现复杂度因子计算函数
    - 实现 `calculateComplexityFactor(input: ComplexityFactorInput): number`
    - 按照需求规则：基础分 1.0；子任务数 >3 加 0.5，>6 加 1.0；关联 issue 数 >2 加 0.3，>5 加 0.6；评论数 >5 加 0.3，>10 加 0.6；跨 Sprint 次数 >0 加 0.3×次数
    - 结果 clamp 到 [1.0, 5.0]
    - _Requirements: 4.9_

  - [x] 1.3 实现吞吐量维度计算函数
    - 实现 `calculateThroughputScore`，基于完成任务数量和复杂度加权完成量在团队中的相对排名计算得分
    - 单人团队时直接给满分
    - _Requirements: 4.3_

  - [x] 1.4 实现效率维度计算函数
    - 实现 `calculateEfficiencyScore`，基于平均 Cycle_Time（In Progress → Done 天数）和 Delivery_Rate（Sprint 内按时完成比例）计算
    - 从 `statusTransitions` 中解析状态变更时间
    - _Requirements: 4.4_

  - [x] 1.5 实现质量维度计算函数
    - 实现 `calculateQualityScore`，基于 Rework_Rate 和 Bug_Introduction_Rate 计算
    - 当 Bug 关联数据不可得时，仅基于 Rework_Rate 计算（权重归入）
    - _Requirements: 4.5, 4.6_

  - [x] 1.6 实现影响力维度计算函数
    - 实现 `calculateImpactScore`，基于高优先级（Highest/High）任务完成占比和阻塞解决速度计算
    - _Requirements: 4.7_

  - [x] 1.7 实现协作维度计算函数
    - 实现 `calculateCollaborationScore`，基于参与非自己任务的评论数和跨团队任务参与度计算
    - _Requirements: 4.8_

  - [x] 1.8 实现综合绩效计算和部门聚合函数
    - 实现 `calculateMemberPerformance`：调用五个维度函数，按权重加权求和得到 performanceScore
    - 实现 `calculateDepartmentPerformance`：聚合所有成员绩效，计算团队平均分、总完成任务数、绩效分布
    - 确保纯函数、幂等性、无副作用
    - _Requirements: 4.1, 4.2, 4.10, 4.11, 2.1, 2.2, 2.5_

- [ ] 2. 绩效计算引擎测试
  - [ ]* 2.1 编写复杂度因子属性测试
    - **Property 3: Complexity factor follows formula and is clamped to [1.0, 5.0]**
    - **Validates: Requirements 4.9**
    - 使用 fast-check 生成随机 ComplexityFactorInput，验证公式正确性和范围约束

  - [ ]* 2.2 编写加权求和属性测试
    - **Property 1: Weighted score equals sum of dimension scores times weights**
    - **Validates: Requirements 4.1**
    - 验证 performanceScore = 各维度分数 × 对应权重之和

  - [ ]* 2.3 编写分数归一化属性测试
    - **Property 2: All output scores are normalized to [0, 100]**
    - **Validates: Requirements 4.2**
    - 对任意有效输入，所有输出分数均在 [0, 100] 范围内

  - [ ]* 2.4 编写质量分数属性测试
    - **Property 4: Quality score handles bug data availability correctly**
    - **Validates: Requirements 4.5, 4.6**
    - 验证 Bug 数据可用/不可用两种路径均产生 [0, 100] 分数

  - [ ]* 2.5 编写效率分数单调性属性测试
    - **Property 5: Efficiency score correctly reflects cycle time and delivery rate**
    - **Validates: Requirements 4.4**
    - 验证 cycle time 增加时分数不增，delivery rate 增加时分数不减

  - [ ]* 2.6 编写吞吐量排名属性测试
    - **Property 6: Throughput score reflects relative ranking in team**
    - **Validates: Requirements 4.3**
    - 验证完成更多且加权更高的成员分数不低于其他成员

  - [ ]* 2.7 编写影响力分数属性测试
    - **Property 7: Impact score reflects high-priority task completion**
    - **Validates: Requirements 4.7**
    - 验证高优先级任务占比增加时分数不减

  - [ ]* 2.8 编写协作分数属性测试
    - **Property 8: Collaboration score reflects cross-team participation**
    - **Validates: Requirements 4.8**
    - 验证跨团队评论增加时分数不减

  - [ ]* 2.9 编写幂等性属性测试
    - **Property 9: Calculation idempotence**
    - **Validates: Requirements 4.10**
    - 验证相同输入两次调用产生相同输出

  - [ ]* 2.10 编写绩效分布属性测试
    - **Property 10: Performance distribution is a valid partition**
    - **Validates: Requirements 2.5**
    - 验证分布各区间人数之和等于总成员数

  - [ ]* 2.11 编写等级映射属性测试
    - **Property 11: Grade color mapping is consistent with score ranges**
    - **Validates: Requirements 6.1**
    - 验证 getPerformanceGrade 对 [0,100] 所有整数返回正确等级

  - [ ]* 2.12 编写排序正确性属性测试
    - **Property 12: Member ranking is correctly sorted by specified dimension**
    - **Validates: Requirements 2.3, 3.5**
    - 验证按任意维度排序后列表为降序

- [x] 3. Checkpoint - 确保计算引擎测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. 实现绩效数据获取 Hook
  - [x] 4.1 创建 usePerformanceData Hook
    - 在 `src/hooks/usePerformanceData.ts` 中实现
    - 基于现有 `useActiveSprintIssuesByProject` 扩展，新增 `usePerformanceIssues` 查询获取额外字段（subtasks、issuelinks、comment、changelog）
    - 使用 TanStack Query，staleTime 设为 5 分钟
    - 将 Jira 原始数据转换为 `PerformanceIssue[]` 格式
    - 调用 `calculateDepartmentPerformance` 返回计算结果
    - 导出 loading/error 状态
    - _Requirements: 2.4, 2.7, 2.8_

  - [ ]* 4.2 编写 usePerformanceData Hook 单元测试
    - 使用 MSW mock Jira API 响应
    - 测试数据转换逻辑和错误处理
    - _Requirements: 2.7, 2.8_

- [x] 5. 实现部门绩效视图容器组件
  - [x] 5.1 创建 PerformanceView 容器组件
    - 在 `src/pages/Dashboard/PerformanceView.tsx` 中实现
    - 管理部门总览 / 个人详情的子视图切换（默认显示部门总览）
    - 调用 `usePerformanceData` 获取数据
    - 处理加载状态（骨架屏）和空状态（"暂无数据"提示）
    - 未选择项目时显示引导提示
    - _Requirements: 1.3, 1.4, 2.7, 2.8_

  - [x] 5.2 创建 PerformanceView.module.css 样式文件
    - 定义绩效视图专用样式：卡片网格、雷达图容器、排行列表、进度条、颜色编码
    - 实现响应式布局：<900px 时切换为单列
    - 复用 Dashboard.module.css 中已有的骨架屏和卡片样式模式
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 6. 实现部门整体绩效总览组件
  - [x] 6.1 创建 DepartmentOverview 组件
    - 在 `src/pages/Dashboard/DepartmentOverview.tsx` 中实现
    - 展示 6 个聚合指标卡片（团队平均 Performance/Throughput/Efficiency/Quality/Impact/Collaboration Score）
    - 展示团队总完成任务数和平均 Cycle_Time
    - 使用 ECharts 绘制五维度雷达图（团队平均表现）
    - 展示绩效分布图（各区间人数柱状图）
    - 展示绩效排行列表（按 Performance_Score 降序，每行显示五维度分数）
    - 使用颜色编码和等级标签标识绩效等级
    - 使用进度条可视化各维度指标
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 6.1, 6.2, 6.3_

- [x] 7. 实现个人绩效详情组件
  - [x] 7.1 创建 IndividualPerformance 组件
    - 在 `src/pages/Dashboard/IndividualPerformance.tsx` 中实现
    - 以卡片网格形式展示所有成员（姓名、Performance_Score、等级标签、五维度分数摘要）
    - 每张卡片包含个人五维度雷达图（ECharts）
    - 支持按 6 个维度排序（Performance/Throughput/Efficiency/Quality/Impact/Collaboration）
    - 点击卡片展开显示详细任务列表及各任务的 Complexity_Factor
    - 无任务数据的成员显示"暂无任务数据"
    - 使用颜色编码和进度条
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.1, 6.2, 6.3_

- [x] 8. 集成到 Dashboard 页面
  - [x] 8.1 修改 Dashboard.tsx 新增 Performance Tab
    - 在 `DashTab` 类型中新增 `'performance'`
    - 在 Tab 栏中添加"部门绩效"按钮（与"全局视图"、"个人视图"并列，所有角色可见）
    - 在内容区添加 `activeTab === 'performance'` 条件渲染 `PerformanceView`
    - 通过 `useSearchParams` 读取 `tab=performance` URL 参数，支持直接链接访问
    - 支持浏览器前进/后退导航时正确切换 Tab 状态
    - 保持现有默认 Tab 行为不变（未指定 tab 参数时）
    - _Requirements: 1.1, 1.2, 5.1, 5.2, 5.3_

- [x] 9. Checkpoint - 确保所有组件集成正常
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. 编写组件集成测试
  - [ ]* 10.1 编写 PerformanceView 组件测试
    - 在 `src/pages/Dashboard/PerformanceView.test.tsx` 中实现
    - 测试 Tab 切换交互、加载状态（骨架屏）、空状态提示
    - 测试 URL 参数 `tab=performance` 激活
    - 测试排序交互、卡片展开/收起
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.7, 2.8, 3.5_

- [x] 11. Final checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 每个任务引用了具体的需求条款以确保可追溯性
- Checkpoints 确保增量验证
- 属性测试验证计算引擎的通用正确性属性（12 个 Property）
- 单元测试验证具体示例和边界情况
- 实现顺序：计算引擎 → 数据 Hook → UI 组件 → 集成，确保每步可独立验证
