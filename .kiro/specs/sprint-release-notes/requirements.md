# Requirements Document

## Introduction

Sprint Release Notes 功能为项目 Dashboard 新增一个 Tab，展示当前活跃 Sprint 的发版说明。该功能从 Jira Sprint 数据中自动聚合已完成和进行中的 Issue，按类型和状态分组呈现，帮助团队在 Sprint 结束时清晰了解本次发版涉及的所有变更内容。解决当前项目管理中"发版后不知道涉及哪些 issue"、"插队 hot fix 无法追踪"、"Jira 状态未及时更新导致信息不透明"等痛点。

## Glossary

- **Release_Notes_Panel**: Dashboard 中展示当前 Sprint 发版说明的 Tab 面板组件
- **Sprint_Issue**: 属于当前活跃 Sprint 的 Jira Issue，经过 statusMapper 映射为 PlatformIssue
- **Issue_Category**: Issue 按 label 或 issue type 归类的分组，如 Feature、Bug Fix、Hot Fix、Improvement
- **Completion_Summary**: 对 Sprint 内 Issue 完成情况的统计摘要，包含总数、已完成数、完成率等
- **Export_Service**: 将 Release Notes 内容导出为 Markdown 或 HTML 格式的服务模块
- **Hot_Fix_Issue**: 在 Sprint 开始后被加入的紧急修复 Issue，通过 createdAt 晚于 Sprint startDate 识别
- **Baseline_Issue**: Sprint 开始时已存在的 Issue，通过 isBaseline 标记或 createdAt 早于 Sprint startDate 识别

## Requirements

### Requirement 1: Release Notes Tab 入口

**User Story:** As a PM, I want to see a "Release Notes" tab on the project Dashboard, so that I can quickly access the current sprint's release summary without navigating away.

#### Acceptance Criteria

1. WHEN a project is selected and an active Sprint exists, THE Release_Notes_Panel SHALL display as a tab labeled "Release Notes" in the Dashboard tab bar
2. WHEN the user clicks the "Release Notes" tab, THE Release_Notes_Panel SHALL render the release notes content for the current active Sprint
3. WHILE no active Sprint exists for the selected project, THE Release_Notes_Panel tab SHALL be hidden from the tab bar
4. THE Release_Notes_Panel SHALL display the Sprint name and date range (startDate ~ endDate) as a header

### Requirement 2: Issue 分类展示

**User Story:** As a PM, I want sprint issues grouped by category (Feature, Bug Fix, Hot Fix, Improvement), so that I can understand the composition of this release at a glance.

#### Acceptance Criteria

1. THE Release_Notes_Panel SHALL group Sprint_Issue items into categories: Feature, Bug Fix, Hot Fix, Improvement, Other
2. WHEN a Sprint_Issue has a label containing "hotfix" or "hot-fix" (case-insensitive), THE Release_Notes_Panel SHALL classify the Sprint_Issue as Hot_Fix_Issue category
3. WHEN a Sprint_Issue has a label containing "bug" or its Jira issue type is "Bug", THE Release_Notes_Panel SHALL classify the Sprint_Issue as Bug Fix category
4. WHEN a Sprint_Issue has a label containing "feature" or "story" or its Jira issue type is "Story", THE Release_Notes_Panel SHALL classify the Sprint_Issue as Feature category
5. WHEN a Sprint_Issue has a label containing "improvement" or "enhancement", THE Release_Notes_Panel SHALL classify the Sprint_Issue as Improvement category
6. WHEN a Sprint_Issue does not match any specific category rule, THE Release_Notes_Panel SHALL classify the Sprint_Issue as Other category
7. THE Release_Notes_Panel SHALL display each category as a collapsible section with the category name and issue count

### Requirement 3: Issue 详情展示

**User Story:** As a team member, I want to see key details for each issue in the release notes, so that I can understand what was delivered without opening Jira.

#### Acceptance Criteria

1. THE Release_Notes_Panel SHALL display for each Sprint_Issue: issue key (e.g. DTS-1234), title, status, priority, and assignee name
2. THE Release_Notes_Panel SHALL visually distinguish completed issues (status = done) from incomplete issues using color or icon indicators
3. WHEN a Sprint_Issue has status "done", THE Release_Notes_Panel SHALL display a checkmark icon next to the issue
4. WHEN a Sprint_Issue has status other than "done", THE Release_Notes_Panel SHALL display the current status as a colored badge

### Requirement 4: 完成度统计摘要

**User Story:** As a PM, I want to see a completion summary at the top of the release notes, so that I can quickly assess the sprint delivery status.

#### Acceptance Criteria

1. THE Completion_Summary SHALL display: total issue count, completed issue count, and completion rate percentage
2. THE Completion_Summary SHALL display the count of Hot_Fix_Issue items separately with a distinct visual indicator
3. THE Completion_Summary SHALL display the count of Baseline_Issue items versus added issues (scope creep indicator)
4. WHEN the completion rate is below 80%, THE Completion_Summary SHALL display a warning indicator

### Requirement 5: 插队 Issue 标识

**User Story:** As a PM, I want to clearly identify issues that were added after the sprint started (hot fixes / scope creep), so that I can track unplanned work in the release.

#### Acceptance Criteria

1. WHEN a Sprint_Issue was created after the Sprint startDate, THE Release_Notes_Panel SHALL display a "插队" badge next to the issue
2. THE Release_Notes_Panel SHALL provide a filter toggle to show only "插队" issues
3. THE Completion_Summary SHALL display the ratio of planned vs unplanned issues (e.g. "计划内: 15, 插队: 5")

### Requirement 6: 导出功能

**User Story:** As a PM, I want to export the release notes as Markdown or HTML, so that I can share the release summary with stakeholders via email or documentation tools.

#### Acceptance Criteria

1. WHEN the user clicks the "Export" button, THE Export_Service SHALL present options for Markdown and HTML formats
2. WHEN the user selects Markdown format, THE Export_Service SHALL generate a Markdown document containing the Sprint name, date range, completion summary, and categorized issue list
3. WHEN the user selects HTML format, THE Export_Service SHALL generate a styled HTML document with the same content
4. THE Export_Service SHALL trigger a file download with filename pattern: `release-notes-{projectKey}-{sprintName}.{ext}`
5. THE Export_Service SHALL include a generation timestamp in the exported document

### Requirement 7: 状态不一致提醒

**User Story:** As a PM, I want to be alerted about issues that may have stale Jira statuses, so that I can follow up with team members to update them.

#### Acceptance Criteria

1. WHEN a Sprint_Issue has status "in_progress" or "in_testing" and the Sprint endDate is within 2 days, THE Release_Notes_Panel SHALL display a "状态待更新" warning badge next to the issue
2. WHEN there are issues with potentially stale statuses, THE Completion_Summary SHALL display a warning message: "有 {count} 个 Issue 状态可能未及时更新"
3. THE Release_Notes_Panel SHALL provide a filter toggle to show only issues with stale status warnings

### Requirement 8: 加载与错误处理

**User Story:** As a user, I want clear feedback when data is loading or when errors occur, so that I understand the system state.

#### Acceptance Criteria

1. WHILE Sprint data is loading, THE Release_Notes_Panel SHALL display a loading skeleton placeholder
2. IF the Jira API returns an error, THEN THE Release_Notes_Panel SHALL display an error message with a retry button
3. WHEN the user clicks the retry button, THE Release_Notes_Panel SHALL re-fetch the Sprint data
