# Implementation Plan: Sprint Release Notes

## Overview

在 Dashboard 中新增 "Release Notes" Tab，从当前活跃 Sprint 的 Jira 数据中自动聚合 Issue，按类型分类展示，提供完成度统计、插队标识、状态不一致提醒和 Markdown/HTML 导出功能。实现采用纯函数计算引擎 + React 组件的分层架构，复用现有 TanStack Query 数据层和 hooks。

## Tasks

- [x] 1. 定义类型和核心接口
  - [x] 1.1 在 `src/types/platform.ts` 中新增 Release Notes 相关类型定义
    - 新增 `IssueCategory`、`ClassifiedIssue`、`CategorizedIssues`、`ReleaseNotesSummary`、`ReleaseNotesData`、`ExportFormat`、`ExportOptions` 类型
    - 新增 `CATEGORY_RULES` 分类规则常量类型
    - _Requirements: 2.1, 4.1, 6.1_

- [x] 2. 实现分类计算引擎
  - [x] 2.1 创建 `src/lib/releaseNotesEngine.ts` 实现核心分类和统计函数
    - 实现 `classifyIssue`: 根据 labels 和 issueType 按优先级规则分类单个 Issue
    - 实现 `categorizeIssues`: 批量分类并按 category 分组
    - 实现 `computeCompletionSummary`: 计算总数、完成数、完成率、hotfix 数、计划内/插队比例
    - 实现 `detectStaleIssues`: 检测 Sprint 临近结束时状态未更新的 Issue
    - 实现 `identifyUnplannedIssues`: 标记 createdAt 晚于 Sprint startDate 的 Issue
    - 实现 `buildReleaseNotesData`: 聚合生成完整 ReleaseNotesData
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.4, 5.1, 7.1_

  - [ ]* 2.2 编写属性测试: 分类完整性和互斥性
    - **Property 1: Classification completeness and mutual exclusivity**
    - **Validates: Requirements 2.1**

  - [ ]* 2.3 编写属性测试: 分类规则优先级正确性
    - **Property 2: Classification rule priority correctness**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6**

  - [ ]* 2.4 编写属性测试: 完成度统计算术一致性
    - **Property 3: Completion summary arithmetic consistency**
    - **Validates: Requirements 4.1, 4.3, 5.3**

  - [ ]* 2.5 编写属性测试: 完成率警告阈值
    - **Property 4: Completion warning threshold**
    - **Validates: Requirements 4.4**

  - [ ]* 2.6 编写属性测试: 插队 Issue 检测
    - **Property 5: Unplanned issue detection**
    - **Validates: Requirements 5.1**

  - [ ]* 2.7 编写属性测试: 状态过期检测
    - **Property 6: Stale status detection**
    - **Validates: Requirements 7.1**

  - [ ]* 2.8 编写属性测试: Hot fix 计数一致性
    - **Property 9: Hot fix count consistency**
    - **Validates: Requirements 4.2**

- [x] 3. Checkpoint - 确保计算引擎测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. 实现导出服务
  - [x] 4.1 创建 `src/lib/releaseNotesExporter.ts` 实现 Markdown 和 HTML 导出
    - 实现 `generateMarkdown`: 生成包含 Sprint 名称、日期范围、完成度摘要、分类 Issue 列表的 Markdown 文档
    - 实现 `generateHTML`: 生成带样式的 HTML 文档（参考 `release-note-v1.1.0.html` 风格）
    - 实现 `triggerDownload`: 创建 Blob 并触发浏览器文件下载
    - 实现 `sanitizeFilename`: 清理 Sprint 名称中的特殊字符
    - 文件名格式: `release-notes-{projectKey}-{sprintName}.{ext}`
    - 导出内容包含 ISO 8601 格式的生成时间戳
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 4.2 编写属性测试: 导出内容完整性
    - **Property 7: Export content completeness**
    - **Validates: Requirements 6.2, 6.3**

  - [ ]* 4.3 编写属性测试: 导出文件名和时间戳
    - **Property 8: Export filename and timestamp**
    - **Validates: Requirements 6.4, 6.5**

- [x] 5. 实现数据 Hook 和 Dashboard Tab 集成
  - [x] 5.1 创建 `src/hooks/useReleaseNotes.ts` 数据 Hook
    - 复用 `useActiveSprintIssuesByProject` 获取 Sprint Issue 数据
    - 复用 `useActiveSprintsByProject` 获取活跃 Sprint 信息
    - 调用 `releaseNotesEngine` 计算分类结果和统计摘要
    - 管理筛选状态（仅插队 / 仅状态待更新）
    - 处理加载状态和错误状态
    - _Requirements: 1.1, 1.2, 1.3, 8.1, 8.2, 8.3_

  - [x] 5.2 修改 `src/pages/Dashboard/Dashboard.tsx` 新增 Release Notes Tab
    - 在 `DashTab` 类型中新增 `'release-notes'` 选项
    - 在 Tab 栏中添加 "Release Notes" 按钮
    - 仅当活跃 Sprint 存在时显示该 Tab
    - 点击时渲染 ReleaseNotesTab 组件
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 6. 实现 Release Notes UI 组件
  - [x] 6.1 创建 `src/pages/Dashboard/ReleaseNotesTab.tsx` 容器组件和 `ReleaseNotesTab.module.css` 样式
    - 渲染 Sprint 名称和日期范围作为 header
    - 管理筛选状态切换（仅插队 / 仅状态待更新）
    - 渲染 CompletionSummary、IssueCategorySection、ExportDropdown、FilterBar
    - 处理加载骨架屏和错误重试状态
    - _Requirements: 1.4, 5.2, 7.3, 8.1, 8.2, 8.3_

  - [x] 6.2 实现 CompletionSummary 统计摘要组件
    - 展示总数、已完成数、完成率百分比
    - 展示 Hot Fix 数量（独立指示器）
    - 展示计划内 vs 插队比例（如 "计划内: 15, 插队: 5"）
    - 完成率低于 80% 时显示警告指示器
    - 有状态待更新 Issue 时显示提醒消息
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.3, 7.2_

  - [x] 6.3 实现 IssueCategorySection 分类区块组件和 IssueRow 组件
    - IssueCategorySection: 可折叠区块，显示分类名称和 Issue 数量
    - IssueRow: 展示 issue key、title、status、priority、assignee
    - 已完成 Issue 显示 ✓ 图标，未完成显示状态 colored badge
    - 插队 Issue 显示 "插队" badge
    - 状态待更新 Issue 显示 "状态待更新" 警告 badge
    - _Requirements: 2.7, 3.1, 3.2, 3.3, 3.4, 5.1, 7.1_

  - [x] 6.4 实现 ExportDropdown 导出按钮组件
    - 下拉菜单提供 Markdown / HTML 两种格式选项
    - 点击后调用 `releaseNotesExporter` 生成文件并触发下载
    - _Requirements: 6.1_

  - [x] 6.5 实现 FilterBar 筛选栏组件
    - 提供 "仅显示插队 Issue" 筛选切换
    - 提供 "仅显示状态待更新 Issue" 筛选切换
    - _Requirements: 5.2, 7.3_

- [x] 7. Checkpoint - 确保所有组件集成正常
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. 组件测试
  - [ ]* 8.1 编写 `src/pages/Dashboard/ReleaseNotesTab.test.tsx` 组件测试
    - 测试 Tab 显示/隐藏（有/无活跃 Sprint）
    - 测试加载状态（骨架屏渲染）
    - 测试错误状态 + 重试按钮
    - 测试分类折叠/展开交互
    - 测试筛选切换（仅插队 / 仅状态待更新）
    - 测试导出按钮下拉菜单
    - _Requirements: 1.1, 1.3, 2.7, 5.2, 7.3, 8.1, 8.2, 8.3_

- [x] 9. Final checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- 分类引擎为纯函数模块，不依赖外部状态，适合属性测试
- 导出功能参考项目已有的 `release-note-v1.1.0.html` 风格
- 复用现有 `useActiveSprintIssuesByProject` 和 `useActiveSprintsByProject` hook，无需额外 API 调用

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 4, "tasks": ["5.2"] },
    { "id": 5, "tasks": ["6.1", "6.4", "6.5"] },
    { "id": 6, "tasks": ["6.2", "6.3"] },
    { "id": 7, "tasks": ["8.1"] }
  ]
}
```
