# Weekly Report 周报 — IDC & DTS

**Week 周期:** Aug 31 – Sep 06, 2026　|　**Source 数据来源:** Jira

---

## IDC

### YMS (TrfMS)

**This week 本周**
Focused on Gate/Check-In/Check-Out flow and backend hardening: inline task status, entry-list equipment matching, Shuttle fixes, WMS calls moved to Nacos service discovery, and IoT WebSocket switched to the new provider. Driver verification/whitelist and DIEV (Samsung) carrier-portal items progressed.
本周聚焦 Gate/进出场流程与后端加固：任务状态内联展示、Entry List 设备匹配、Shuttle 修复、WMS 调用改为 Nacos 服务发现、IoT WebSocket 切换新链路；司机验证/白名单与 DIEV（三星）Carrier Portal 相关需求推进。

**Next week 下周**
Push the large "ready to release" queue to production (Gate Check-In & Quick Check-In, Prefill receipt batch-confirm, Carrier Portal fixes) and clear hotfix / test-failed items.
将大量"待发布"需求推上线（Gate Check-In 与 Quick Check-In、Prefill 收货批量确认、Carrier Portal 修复），并清理 hotfix 与测试未通过项。

### Recruit

**This week 本周**
IAM/Central integration landed (external customers → IAM users, permission propagation to APS, WeCom sync fix); Recruit data-permission control and YMS-Box remote upgrade completed.
完成 IAM/Central 集成（外部客户导入为 IAM 用户、权限同步到 APS、企微同步修复）；Recruit 数据权限控制与 YMS-Box 远程升级完成。

**Next week 下周**
Recruit UI rebuild and candidate-facing pages; roll out IAM/Central & LMS agents (Permission / App & Client / Team Management); Paylocity sync.
Recruit UI 重构与候选人端页面；上线 IAM/Central 与 LMS 系列 Agent（权限 / App & Client / 团队管理）；Paylocity 同步。

### HRM

**This week 本周**
No items closed; all in progress (Company Sync with IAM, HRM–IAM binding).
本周无关闭项，均在进行中（与 IAM 的 Company Sync、HRM–IAM 绑定）。

**Next week 下周**
Finish Company Sync / IAM binding, API docs, production issue diagnosis, and Paylocity supervisor-sync investigation.
完成 Company Sync / IAM 绑定、API 文档、生产问题诊断，及 Paylocity 主管同步延迟排查。

### APS

**This week 本周**
Delivered the Labor Planning scheduled-email suite (holiday skip, per-mailbox failover), warehouse-name search, APS↔WMS permission sync, and AI chatbox permissions; Borrow Staff and Message Center reached dev-complete.
交付 Labor Planning 定时邮件套件（跳过节假日、逐邮箱失败重发）、仓库名搜索、APS↔WMS 权限同步、AI chatbox 权限；Borrow Staff 与 Message Center 开发完成。

**Next week 下周**
Team Management Enhancement, staffing-summary caching, Runtime Agent V2.14 refactor, and Borrow-Staff approval center.
团队管理增强、人员汇总缓存、Runtime Agent V2.14 重构、借人审批中心。

### IOT & EE

**This week 本周**
Yard statistics cards, robot hover/detail panels, and alarm page completed; quadruped-robot inspection and SPOT/DOCK stats in testing.
完成堆场统计卡片、机器人悬停/详情面板、告警页；四足机器人巡检与 SPOT/DOCK 统计进入测试。

**Next week 下周**
Gate hover info / health status / event drawer, real-time yard map, spot master-data governance, and platform user manual.
Gate 悬停信息/健康状态/事件抽屉、实时堆场地图、spot 主数据治理、平台使用手册。

---

## DTS

### Linker — OMS V3 (DI OMS)

**This week 本周**
Released Glory inventory-sync settings and multiple Small-Parcel carrier fixes (FedEx/UPS/USPS, Amazon token, scan form); PO/retailer-mapping and a configurable auto-retry framework advanced.
发布 Glory 库存同步设置及多项 Small Parcel 承运商修复（FedEx/UPS/USPS、Amazon token、scan form）；采购单/零售商映射与可配置自动重试框架推进。

**Next week 下周**
This is the largest backlog (~250 open, ~100 ready-to-test): OMS V3 cancel-outbound & PO refinements, OMS AI Assistant, Shopify risk-order control, plus DDD/OpenSpec and QA E2E automation groundwork.
积压最大（约 250 未完成、约 100 待测）：OMS V3 取消出库与 PO 优化、OMS AI 助手、Shopify 风险订单控制，以及 DDD/OpenSpec 与 QA E2E 自动化基础建设。

### DI (Data Integration)

**This week 本周**
NetSuite (Stron) integration workflows closed; connector/flow work progressed.
NetSuite（Stron）集成工作流关闭；Connector/Flow 工作推进。

**Next week 下周**
Walmart DSV/B2B, Amazon 1P/FBM/FBA, online payments (Stripe/PayPal/Axia), EDI 180 outbound (RMS), and Trackstar integration.
Walmart DSV/B2B、Amazon 1P/FBM/FBA、在线支付（Stripe/PayPal/Axia）、EDI 180 出站（RMS）、Trackstar 集成。

### Client Portal 3.0 (CP)

**This week 本周**
CP3.0 claim/dispute inventory-count field + BNP sync released; GA4 event tracking live; attachment-display fix closed.
CP3.0 索赔/争议库存数量字段与 BNP 同步发布；GA4 事件埋点上线；附件显示修复关闭。

**Next week 下周**
API/data permission control by role & tenant, navigation redesign (global search / Favorites / AI Agents / Help Center), and account management.
按角色与租户的 API/数据权限控制、导航重构（全局搜索 / 收藏 / AI Agents / Help Center）、账户管理。

---

*Generated from Jira, Sep 02, 2026. Chinese ticket titles summarized into themes. 数据取自 Jira，中文标题已归纳为主题。*
