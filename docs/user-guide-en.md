# AI-PM Platform User Guide

## Overview

AI-PM is an AI-powered project management platform that integrates with Jira to provide Sprint management, requirements tracking, risk monitoring, report generation, and project roadmap planning.

## Getting Started

1. Select a Jira project from the project selector in the top navigation bar
2. All pages will automatically load data for the selected project
3. Use the left sidebar to navigate between modules

## Modules

### Dashboard

Project overview at a glance:
- **Global View**: Sprint completion rate, task status distribution, team workload, risk alerts, burndown chart
- **Personal View**: My tasks, progress stats
- **AI Decision** (PM role): AI-assisted decision suggestions
- **AI Project Insights**: Click "Generate Analysis" for AI health assessment

### Requirements

Manage all project requirements (past year):
- **List / Kanban View**: Toggle between display modes
- **Filters**: By status, priority, assignee, keyword
- **Status Stats**: Top bar shows counts per status, click to quick-filter
- **Ticket Links**: Click any task ID to open the original Jira issue
- **AI Analysis**: Requirements health and backlog risk insights

### Sprint Management

Detailed Sprint management with 4 tabs:

**Board**
- 5-column kanban: To Do → In Progress → In Review → In Testing → Done
- Filter by priority, assignee, keyword

**Resources**
- Developer profile cards: avatar, skill tags, workload indicator
- Workload visualization: Overloaded (red) / Balanced (green) / Idle (orange)
- Team summary bar: click any stat card to expand task details
- Sort by: load, task count, name

**Changes**
- AI-powered change detection: priority changes, new additions, scope changes, status regressions
- Impact analysis dashboard
- Scope creep detection (auto-warning at >20%)
- AI change summary generation

**Planning**
- AI scores and ranks Backlog candidates
- Select tasks and copy planning list

### Risk & Collaboration

- **Risk Board**: Risks by status (Identified → Evaluating → Handling → Closed)
- **Cross-team Collaboration**: Auto-detected cross-project tasks
- **Dependencies**: Unassigned high-priority tasks, overtime tasks, stale tasks
- **WeCom Push**: One-click risk notification to WeCom group

### Reports

- **Daily / Weekly / Sprint Review**: Auto-generated reports with task details, team workload tables, risk details
- **Push to WeCom**: One-click report delivery
- **AI Report Assistant**: AI-generated progress summaries

### Project Roadmap

- **Timeline View**: Horizontal timeline with milestones and key nodes
- **Milestone Management**: Add/edit/delete milestones (Planned/In Progress/Completed/Delayed)
- **Key Nodes**: Release, review, deadline, custom events
- **Templates**: 4 built-in templates (Agile Sprint, Quarterly, Product Launch, Custom Blank)
- **Jira Sync**: Import milestones from Jira Fix Versions
- **AI Roadmap Analysis**: Roadmap health insights

### Settings

- Jira connection configuration and testing
- Notification settings
- Permission management

## Common Features

### AI Smart Analysis
Every page has an AI analysis panel at the top. Click "Generate Analysis" for AI-powered insights and recommendations.

### Global Search
The top search bar supports searching by task ID, title, and page names. Supports exact Jira ticket number search.

### Ticket Links
All ticket IDs across the platform are clickable, opening the original Jira issue in a new tab.

### Multi-language
Supports Chinese, English, Japanese, and Spanish. Switch languages from the top navigation bar.

### Role Switching
Switch between PM and DEV roles in the top navigation bar. Different roles see different features.

### AI Assistant
Click the 🤖 button in the bottom-right corner to open the AI chat. Ask questions about your Jira project data directly.
