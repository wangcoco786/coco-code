# Requirements Document

## Introduction

在现有 Dashboard 首页中新增"部门绩效"视图，提供部门整体绩效总览和个人绩效详情两个层级的展示。绩效评估模型参考业界顶尖框架设计：融合 **SPACE Framework**（Microsoft Research / GitHub, 2021）的多维度开发者生产力理念和 **DORA Metrics**（Google DevOps Research）的交付效能指标体系。模型覆盖吞吐量（Activity）、交付效率（Efficiency & Flow）、质量（Performance & Change Failure Rate）、影响力（Performance）、协作（Communication）五个维度，避免单一指标误导，全面反映研发人员的真实贡献。复杂度评估不依赖人工维护的 Story Points 字段，而是基于子任务数、关联 issue 数、评论数、跨 Sprint 次数等客观元数据自动计算。数据源为 Jira Sprint 数据及 Jira 评论/任务关联信息。用户打开 Dashboard 链接即可直接看到该页面（作为新的 Tab 视图）。

## Glossary

- **Performance_Dashboard**: 部门绩效展示视图，作为 Dashboard 页面中的一个 Tab 存在
- **Department_Overview**: 部门整体绩效总览面板，展示部门级别的聚合绩效指标
- **Individual_Performance**: 个人绩效详情面板，展示每位成员的多维度综合绩效数据
- **Performance_Score**: 综合绩效分数，由五个维度指标按权重加权计算得出（0-100 分）
- **Complexity_Factor**: 复杂度因子，基于 ticket 元数据（子任务数、关联 issue 数、评论数、跨 Sprint 次数）通过规则自动计算的任务难度系数，范围 1.0 ~ 5.0
- **Throughput_Score**: 吞吐量维度分数（0-100），衡量完成任务数量及复杂度加权完成量，对应 SPACE 的 Activity 维度
- **Efficiency_Score**: 交付效率维度分数（0-100），衡量平均任务完成周期和按时交付率，对应 SPACE 的 Efficiency & Flow 维度及 DORA 的 Lead Time
- **Quality_Score**: 质量维度分数（0-100），衡量返工率和 Bug 引入率，对应 SPACE 的 Performance 维度及 DORA 的 Change Failure Rate
- **Impact_Score**: 影响力维度分数（0-100），衡量高优先级/关键路径任务完成占比及阻塞解决速度，对应 SPACE 的 Performance 维度
- **Collaboration_Score**: 协作维度分数（0-100），衡量帮助他人解决阻塞和跨团队任务参与度，对应 SPACE 的 Communication 维度
- **Cycle_Time**: 任务完成周期，从任务状态变为 In Progress 到状态变为 Done 的自然天数
- **Delivery_Rate**: 按时交付率，在 Sprint 截止日期前完成的任务占比
- **Rework_Rate**: 返工率，被 reopen 或退回的任务数占已完成任务总数的比例
- **Bug_Introduction_Rate**: Bug 引入率，已完成任务中后续产生关联 Bug 的比例（依赖 Jira 关联数据可得性）
- **Performance_Engine**: 绩效计算引擎，负责从原始 Issue 数据计算各项绩效指标的纯函数模块
- **Sprint_Issues**: 当前活跃 Sprint 中的所有 PlatformIssue 数据

## Requirements

### Requirement 1: 部门绩效 Tab 入口

**User Story:** As a 项目成员, I want to 在 Dashboard 中看到部门绩效 Tab, so that 我可以快速切换到绩效视图查看部门和个人表现。

#### Acceptance Criteria

1. WHEN 用户打开 Dashboard 页面, THE Performance_Dashboard SHALL 作为一个新的 Tab 选项显示在现有 Tab 栏中（与"全局视图"、"个人视图"并列）
2. WHEN 用户点击"部门绩效" Tab, THE Performance_Dashboard SHALL 切换显示部门绩效内容区域
3. THE Performance_Dashboard SHALL 默认展示 Department_Overview（部门整体绩效总览）
4. WHEN 当前项目未选择时, THE Performance_Dashboard SHALL 显示提示信息引导用户先选择项目

### Requirement 2: 部门整体绩效总览

**User Story:** As a 项目经理, I want to 查看部门整体多维度绩效概览, so that 我可以快速了解团队在吞吐量、效率、质量、影响力和协作各方面的健康状况。

#### Acceptance Criteria

1. THE Department_Overview SHALL 展示以下聚合指标卡片：团队平均 Performance_Score、团队平均 Throughput_Score、团队平均 Efficiency_Score、团队平均 Quality_Score、团队平均 Impact_Score、团队平均 Collaboration_Score
2. THE Department_Overview SHALL 展示团队总完成任务数和团队平均 Cycle_Time
3. THE Department_Overview SHALL 展示团队成员绩效排行列表，按 Performance_Score 降序排列，每行显示五个维度分数
4. WHEN Sprint_Issues 数据加载完成, THE Department_Overview SHALL 在 200ms 内完成绩效指标计算并渲染
5. THE Department_Overview SHALL 展示绩效分布图，显示团队成员在不同绩效区间的分布情况
6. THE Department_Overview SHALL 展示五维度雷达图，显示团队在各维度的平均表现
7. WHILE Sprint_Issues 数据正在加载, THE Department_Overview SHALL 显示骨架屏加载状态
8. IF Sprint_Issues 数据为空, THEN THE Department_Overview SHALL 显示"暂无数据"的空状态提示

### Requirement 3: 个人绩效详情

**User Story:** As a 项目成员, I want to 查看每个人在五个维度上的绩效详情, so that 我可以全面了解个人在吞吐量、效率、质量、影响力和协作方面的表现。

#### Acceptance Criteria

1. THE Individual_Performance SHALL 为每位成员展示以下五维度分数及明细：Throughput_Score（完成任务数、复杂度加权完成量）、Efficiency_Score（平均 Cycle_Time、Delivery_Rate）、Quality_Score（Rework_Rate、Bug_Introduction_Rate）、Impact_Score（高优先级任务完成占比、阻塞解决速度）、Collaboration_Score（参与非自己任务的评论数、跨团队任务参与度）
2. THE Individual_Performance SHALL 为每位成员展示五维度雷达图，直观呈现个人能力分布
3. WHEN 用户点击某位成员的绩效卡片, THE Individual_Performance SHALL 展开显示该成员的详细任务列表及各任务的 Complexity_Factor
4. THE Individual_Performance SHALL 以卡片网格形式展示所有成员，每张卡片包含成员姓名、Performance_Score、绩效等级标签和五维度分数摘要
5. THE Individual_Performance SHALL 支持按 Performance_Score、Throughput_Score、Efficiency_Score、Quality_Score、Impact_Score、Collaboration_Score 排序
6. IF 某成员没有被分配任何任务, THEN THE Individual_Performance SHALL 在该成员卡片上显示"暂无任务数据"

### Requirement 4: 五维度综合绩效计算引擎

**User Story:** As a 开发者, I want to 使用一个基于 SPACE + DORA 框架的纯函数绩效计算模块, so that 绩效计算逻辑可测试、可复用且与 UI 解耦。

#### Acceptance Criteria

1. THE Performance_Engine SHALL 基于以下五个维度及权重计算 Performance_Score：Throughput_Score（权重 20%）、Efficiency_Score（权重 25%）、Quality_Score（权重 25%）、Impact_Score（权重 15%）、Collaboration_Score（权重 15%）
2. THE Performance_Engine SHALL 将 Performance_Score 及各维度分数归一化到 0-100 的范围
3. THE Performance_Engine SHALL 计算 Throughput_Score，综合考虑：完成任务数量在团队中的相对排名得分、复杂度加权完成量（每个已完成任务贡献值等于 1 乘以该任务的 Complexity_Factor，所有已完成任务贡献值求和）在团队中的相对排名得分
4. THE Performance_Engine SHALL 计算 Efficiency_Score，综合考虑：平均 Cycle_Time（从 In Progress 到 Done 的天数，越短分数越高）、Delivery_Rate（Sprint 内按时完成的任务数除以总分配任务数）
5. THE Performance_Engine SHALL 计算 Quality_Score，综合考虑：Rework_Rate（被 reopen 或退回的任务数除以已完成任务总数，越低分数越高）、Bug_Introduction_Rate（已完成任务中后续产生关联 Bug 的比例，越低分数越高）
6. IF Bug 关联数据不可得, THEN THE Performance_Engine SHALL 将 Bug_Introduction_Rate 子项权重归入 Rework_Rate，仅基于 Rework_Rate 计算 Quality_Score
7. THE Performance_Engine SHALL 计算 Impact_Score，综合考虑：高优先级（Highest/High）或关键路径任务完成数占个人总完成数的比例、阻塞其他人的任务（被其他任务标记为 blocked by 的任务）的平均解决速度
8. THE Performance_Engine SHALL 计算 Collaboration_Score，综合考虑：参与非自己负责任务的评论数量（基于 Jira 评论数据）、跨团队任务参与度（参与的任务中属于其他团队成员负责的任务占比）
9. THE Performance_Engine SHALL 基于 ticket 元数据规则计算 Complexity_Factor，公式为：基础分 1.0；子任务数大于 3 则加 0.5，大于 6 则加 1.0；关联 issue 数大于 2 则加 0.3，大于 5 则加 0.6；评论数大于 5 则加 0.3，大于 10 则加 0.6；跨 Sprint 次数大于 0 则加 0.3 乘以跨越次数；最终结果限制在 1.0 至 5.0 范围内
10. FOR ALL 有效的 Sprint_Issues 输入, THE Performance_Engine 计算后再次计算 SHALL 产生相同的 Performance_Score（幂等性）
11. THE Performance_Engine SHALL 作为纯函数模块导出，不依赖任何外部状态或副作用

### Requirement 5: 页面直接可访问

**User Story:** As a 用户, I want to 打开链接就能看到部门绩效页面, so that 我不需要额外的操作步骤即可查看绩效数据。

#### Acceptance Criteria

1. WHEN 用户通过 URL 参数指定 tab=performance 访问 Dashboard, THE Performance_Dashboard SHALL 自动激活部门绩效 Tab
2. WHEN 用户直接访问 /dashboard 且未指定 tab 参数, THE Performance_Dashboard SHALL 保持现有默认 Tab 行为不变
3. THE Performance_Dashboard SHALL 支持浏览器前进/后退导航时正确切换 Tab 状态

### Requirement 6: 绩效数据展示格式

**User Story:** As a 项目成员, I want to 以清晰直观的格式查看绩效数据, so that 我可以快速理解绩效表现。

#### Acceptance Criteria

1. THE Performance_Dashboard SHALL 使用颜色编码标识绩效等级：绿色（80-100 分优秀）、蓝色（60-79 分良好）、橙色（40-59 分一般）、红色（0-39 分需改进）
2. THE Performance_Dashboard SHALL 在每个绩效分数旁显示对应的等级标签文字
3. THE Performance_Dashboard SHALL 使用进度条可视化展示各维度指标的完成百分比
4. THE Performance_Dashboard SHALL 适配移动端屏幕，在小于 900px 宽度时切换为单列布局
