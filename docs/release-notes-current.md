# Release Notes（2026-04-10 ~ 2026-06-04）

> 生成时间：2026/6/16 12:00:01
>
> 项目：DTS、BNP、CRM-Core、Rate Engine、VRM、BI、RP、AIAG
>
> 仅包含该期间内关闭的 Issues

---

## DTS（285 项已完成）

### Feature（19）

| Key | 标题 |
|-----|------|
| DTS-8894 | Linker\|OMS V3\|form engine |
| DTS-9094 | [DI] Third-party carrier-calculated shipping - Shopify |
| DTS-9405 | CLONE - Stron 项目 修改需求-2：库存 |
| DTS-9487 | Linker\|OMS V3 \|shipping request\|rate shopping 应用 |
| DTS-9879 | Vantage - 参考DTS-9640- 客户需要发发票excel到FTP |
| DTS-9802 | 实现 Walmart OAuth Marketplace Entry Flow |
| DTS-9837 | Linker\|OMS V3\|order\| dispatch order时间轴展示问题 |
| DTS-9896 | Linker\|OMS V3 \|Sales\|可用库存优化 |
| DTS-9999 | 请将OMS中销售订单配置自动创建商品的开关默认关闭 |
| DTS-10108 | Stron 同步 订单数据时，应该忽略sku的字母大小写 |
| DTS-10238 | [OMS v3] C端用户画像设计：收货人画像底座、标签体系与可视化能力 |
| DTS-10239 | [OMS v3]设计 OMS 统一运单业务表模型，沉淀 Shipment 主数据与运输执行明细 |
| DTS-10296 | Linker\|OMS V3 \|Ritual beverage\|指定商品指定UOM回传库存 |
| DTS-8986 | OMS接收Hazardous Materials Information下传到FMS [FMS-Quote] |
| DTS-9940 | LSO: Modify the current BT integration by pushing all package data to BT. |
| DTS-10089 | Stron项目：从ITEM WMS和WISE获取Customer并配置推送 |
| DTS-10097 | CLONE - Lenovo - add incoterm FCA (Billable) |
| DTS-10132 | Linker\|CP\|忘记密码/重置密码功能 |
| DTS-10461 | Linker\|CP \|恢复integration菜单 |

### Bug Fix（21）

| Key | 标题 |
|-----|------|
| DTS-9866 | Netsuite 同步到WMS 没有同步应该同步的订单。 |
| DTS-9971 | Agentforce - QA Bug Report 4/10/2026 |
| DTS-10013 | Diageo - Base Qty is not correct  |
| DTS-10140 | Post column header is unclear (numeric / opaque values) |
| DTS-10143 | Conversation search empty state leaves prior thread visible |
| DTS-10142 | Messages plus button opens Create Group only |
| DTS-10146 | DM transcript uses uniform outgoing-style bubbles |
| DTS-10144 | Add Friend allows invalid email input before search |
| DTS-10168 | OMS Investigation Required – 944 Not Generated/Sent for ASN 0703271922 (LENNOX) |
| DTS-10189 | Amazon FBM label returns Invalid file signature after orderItemId fix - NET HEALTH / Douglasville |
| DTS-10293 |  Inventory quantity mismatch between WISE and Shopify |
| DTS-10141 | Draft lost on full page reload |
| DTS-10145 | URLs in chat render as plain text |
| DTS-10147 | No message action menu on sent messages |
| DTS-10366 | ZURU的rc，WMS是关闭状态，但是OMS状态还是处理中 |
| DTS-10130 | Live chat \| Contacts \| Duplicate employees |
| DTS-10167 | Without 997-midea |
| DTS-9970 | Duplicate orders created in UNIS- Tracking syncing issue - BRUMATE  |
| DTS-10128 | DHL shipping label |
| DTS-10243 | Hazmat Extra Service Code Error (810-832) - DN-3167139 |
| DTS-10162 | Orders are not routing Valley View - THE OUAI |

### Improvement（244）

| Key | 标题 |
|-----|------|
| DTS-10411 | 账户体系 — 用户时区偏好与账户页保存合并 |
| DTS-10412 | 库存账目 — 按单据类型记账 + 出库占用 M0/M1 + 每日盘点兜底 |
| DTS-10413 | 前端框架 — 菜单重组 / 列表页吸顶 / Header 全局搜索入口 |
| DTS-10414 | 商品中心 — 商品发布到销售渠道主链路与发布历史追溯 |
| DTS-10415 | 商品中心 — 平台字典映射与渠道商品挂载维护 |
| DTS-10410 | 可观测性 — 应用日志统一接入 ES 与实例监控页 |
| DTS-10420 | 自动履约编排主链路 — 销售单 → 履约单 → 出库单 三跳 |
| DTS-10421 | 自动分仓策略配置化 + 最小仓库组合寻仓算法 |
| DTS-10417 | TikTok 渠道 — 商品导入 / 平台字典 / 仓库同步 / 发布到 TikTok |
| DTS-10418 | Shopify 渠道 — 平台字典同步与插件菜单接入主前端 |
| DTS-10419 | 商户体系 — 多租户商户数量统计与切换器双栏改造 |
| DTS-10416 | 商品中心 — 品牌 / 类目 / 属性主数据录入与四级类目级联 |
| DTS-10425 | 通知订阅中心 — 事件驱动 + 站内信 + 插件通道扩展 |
| DTS-10424 | 运单 — 状态流转与轨迹时间线最小闭环 |
| DTS-10426 | Walmart Marketplace 渠道插件 — OAuth 装机首版 |
| DTS-10422 | 运单 — 查询与手动建单全流程页面 |
| DTS-10423 | 运单 — WMS 发货回传自动创建运单 |
| DTS-10429 | 采购订单管理闭环 — 下单 / 收货 / 状态机 + 乐观锁防并发 |
| DTS-10428 | Squarespace 渠道插件 — 首版（连接 + 商品 / 订单 + 同步 + MCP） |
| DTS-10427 | Shein 渠道插件 — 首版（OAuth + 订单 / 商品查询） |
| DTS-10400 | Shopify 渠道 — 商品写 MCP 工具与配置页整合 |
| DTS-10401 | 插件框架（Kit）整合与自有仓库插件全量重写 |
| DTS-10407 | 履约 — 视图重塑、变更请求、决策规则与 SO 联动 |
| DTS-10403 | 自有仓库入库 — 主链路 MVP（列表 / 创建 / 编辑 / 详情 / 收货 + 结案） |
| DTS-10405 | 销售订单 — 导入链路 envelope-first 改造与失败重导 |
| DTS-10406 | 销售订单 — 列表 / 筛选 / 详情 UI 与字段下放 |
| DTS-10402 | 自有仓库出库单 — 5 项增量增强 + 状态串行化与错误码映射 |
| DTS-10404 | 自有仓库 — 商品/UOM 同步、OMS 建仓入口与双向同步 |
| DTS-10408 | 全局单据搜索 — ⌘K 命令面板 + ES 索引 |
| DTS-10409 | 销售渠道 — 店铺档案扩展 17 字段 + 列表 / 详情 UI 重做 |
| DTS-10431 | Notion 连接管理插件 — 首版连接闭环 |
| DTS-10430 | Wix Stores 渠道插件 — 连接授权与 MCP 诊断 |
| DTS-10398 | OMS Copilot 内置 AI 助手 — 端到端落地 |
| DTS-10397 | 运单领域 — 统一运单数据底座搭建 |
| DTS-10399 | TikTok 渠道插件 — 三模块端到端接入 |
| DTS-10197 | 添加API：查询当前用户私聊/群聊已读最大消息ID列表 |
| DTS-6763 | 【前端】配合shopify认证修改 |
| DTS-8954 | form engine 后端 |
| DTS-8952 | form engine 前端 |
| DTS-8918 | web项目搭建、登录、绑定邮箱、选择公司功能开发 |
| DTS-9067 | web项目联系人功能开发 |
| DTS-9180 | websocket及dexie数据存储封装 |
| DTS-9203 | web增加私聊功能 |
| DTS-9244 | 先调登录以及调研shopify的结构 |
| DTS-9214 | form engine 拓展属性 |
| DTS-9318 | web私聊支持发送表情、图片、文件 |
| DTS-9319 | web支持退出登录 |
| DTS-9362 | web选择组织架构及customer创建群聊 |
| DTS-9469 | web群聊支持修改群昵称和解散群聊、退出群聊 |
| DTS-9503 | web聊天消息发送失败检测与手动重试机制 |
| DTS-9468 | web群聊支持添加和移除人员及查看群组人员 |
| DTS-9467 | web群聊支持发送表情、图片、文件 |
| DTS-9486 | web支持查看添加好友，及处理好友申请消息 |
| DTS-9499 | Linker\|OMS V3 \|shipping request\|rate shopping 应用 -后端 |
| DTS-9633 | ltl map前端开发 |
| DTS-9632 | ltl/ftl -list前端开发 |
| DTS-9634 | ltl/ftl -analytics 前端开发 |
| DTS-9695 | sales-order表数据订阅方式更改 |
| DTS-9696 | ltl/ftl/lastmile接口入参调整，接口响应时间调整 |
| DTS-9591 | last mile-analytics前端开发 |
| DTS-9589 | last mile-list前端开发 |
| DTS-9590 | last mile-map前端开发 |
| DTS-9595 | lastmile ltl ftl 配合测试修改问题 |
| DTS-9803 | DMS排查mark as delivered后状态 |
| DTS-9838 | Linker\|OMS V3\|order\| dispatch order时间轴展示问题-前端 |
| DTS-9844 | Linker\|OMS V3\|order\| dispatch order时间轴展示问题 -后端 |
| DTS-9898 | CLONE - OMS V2 拆单使用计算后的库存进行库存比较进行拆单 |
| DTS-9897 | CLONE - Linker\|OMS V3 \|Sales\|可用库存优化  库存计算接口 |
| DTS-9900 | Walmart App OAuth 认证 创建默认channel并授权 |
| DTS-9936 | DI connector operate 输入输出 jsonSchema skill |
| DTS-10060 | [Linker Agent Factory] 产品介绍页 + 登录页 Lottie 动画 |
| DTS-10062 | [Linker Agent Factory] 微信流式回复 + iLink 协议合规对齐 |
| DTS-10057 | [Linker Agent Factory] Auto Memory v3 — 多策略记忆提取与跨会话召回 |
| DTS-10059 | [Linker Agent Factory] SDK 新特性集成 — 子代理可观测 + 预算上限 + 预热 |
| DTS-10061 | [Linker Agent Factory] Agent 会话统计分析页面与权限加固 |
| DTS-10063 | [Linker Agent Factory] 域名迁移 agentforce.item.pub → agents.item.pub |
| DTS-10058 | [Linker Agent Factory] Admin 监控面板重构 — 平台视角跨组织用量/并发/计费 |
| DTS-10149 | flow内更改 取值逻辑 |
| DTS-10087 | 开发unis-rate-shipping 服务 |
| DTS-10136 | schema组件支持自定义operate获取数据 |
| DTS-10178 | Push WMS DN flow添加subsidiary 过滤customer |
| DTS-10181 | SO默认关闭 ，PO默认打开-后端 |
| DTS-10182 | 前端页面增加PO自动创建商品开关 |
| DTS-10194 | Unis rateshopping app 审核技术点优化 |
| DTS-10272 | [v1.0] A2UI 渲染器能力确认（DI） |
| DTS-9894 | OMS提供FMS生成LSO Claim所需字段（支持OMS冷、热库对接） |
| DTS-9686 | client portal区分支持多租户切换-front |
| DTS-10223 | OMS 主站：供应商管理一期（列表 / 详情 / 创建闭环） |
| DTS-10224 | OMS 主站：履约出库单状态时间轴 + WMS DC 消息消费 |
| DTS-10225 | Shopify 插件：销售订单字段补齐与 Basic Auth |
| DTS-10226 | Shopify 插件：订单 / 商品 / 客户三模块体验 v1 |
| DTS-10219 | OMS 主站：库存与商品基础数据 v1 落地 |
| DTS-10222 | OMS 主站:客户管理一期(master / V2 导入 / Geo 三级地区) |
| DTS-10221 | OMS 主站：仓库新增财务编码与履约/库存同步开关 |
| DTS-10227 | TikTok Shop 插件：从 0 到 1 落地 |
| DTS-10220 | OMS 主站：渠道商品导入与发布到外部 App |
| DTS-10229 | 虚拟仓库（virtual-warehouse）APP 一期 |
| DTS-10228 | item-wms 插件：库存与出库单只读浏览升级 |
| DTS-10236 | 发布到外部 App |
| DTS-10237 | OMS 主站：采购模块一期（采购单 / 收货 / 状态流转） |
| DTS-10234 | 平台运营后台 + OMS 开发者中心骨架 |
| DTS-10235 | OMS 主站：渠道商品导入 |
| DTS-10230 | 插件框架核心能力（INBOUND/OUTBOUND/状态机/多实例） |
| DTS-10232 | 可观测性：访问 / 错误 / 插件交互日志三页统一 |
| DTS-10233 | 调度框架（db-scheduler + v2 + installation 级独立调度） |
| DTS-9715 | V3 Walmart marketplace Integration Order |
| DTS-9716 | V3 Walmart marketplace Integration Shipment |
| DTS-9717 | V3 Walmart marketplace Integration Inventory |
| DTS-9712 | eHub 接口调研，配置 |
| DTS-9455 | [SHEIN] Flow模板修改 |
| DTS-9906 | assistant对应agent open-api |
| DTS-10051 | DI Carrier call 模块 |
| DTS-10050 | Ehub cancel label |
| DTS-9905 | assistant重构-前端 |
| DTS-10049 | Ehub - Label |
| DTS-10048 | eHub - Rate |
| DTS-9675 | 创建、编辑、查看帐号、对接iam以及记录操作 |
| DTS-9672 | 创建、编辑、查看帐号、对接iam以及记录操作 |
| DTS-9962 | CP\|portal admin-菜单管理 backend |
| DTS-9901 | cp-portal-角色管理CRUD与权限树配置 |
| DTS-9874 | cp-admin-角色管理功能对接与优化 |
| DTS-9198 | 登陆时返回用户的公司列表 |
| DTS-9998 | 支持dock app集成 |
| DTS-9883 | cp-admin-账号管理功能对接与优化 |
| DTS-9886 | cp-portal-账号管理功能对接与优化 |
| DTS-10046 | 在file服务上添加rar ， png 和 heic   |
| DTS-9541 | 支持多app同时登陆 |
| DTS-10231 | 插件共享 Node SDK（plugin-server-kit + plugin-ui + 参考插件） |
| DTS-10310 | Support\| 申请开通 Agent 沙箱与日志服务器内网及公网访问权限（172.19.4.180 / 172.19.4.181） |
| DTS-10297 | Client Portal 页面加载时未进行鉴权，仅在触发操作时才跳转登录页 |
| DTS-10005 | Item Client Portal 3.0\|TMS client portal V2 的账号处理 |
| DTS-8861 | Linker\|LiveChat\|Web版本需求开发 |
| DTS-9056 | Linker\|OMS V3 \|shein\|上下架及售罄商品回调 |
| DTS-9456 | LSO：通过Webhook推送LSO Traking到Partner系统处理场景及需求覆盖情况 |
| DTS-9568 | Linker\|OMS\|LSO PLC Report&OTS Reports更新last scan event取值规则 |
| DTS-9735 | Linker\|LSO官网操作Schedule a pickup时提示不匹配问题核查 |
| DTS-9746 | CP\|client portal给item客人用的站点需要切换到wms3.0接口 |
| DTS-9727 | CP\|client portal 新站点及配套stage环境部署 |
| DTS-9748 | shopify 拉单 支持分页 |
| DTS-9852 | CP\|GIS系统「My Inventory」嵌入 Client Portal |
| DTS-9749 | Linker\|OMS\|申请stage环境的DMS数据库信息 |
| DTS-9847 | Linker\|OMS\|BI中service hub和arrived hub涉及取值组调整 |
| DTS-9795 | Linker\|OMS\|LSO SmallParcel中操作Mark As Delivered后状态问题核查 |
| DTS-9808 | Linker\|livechat ticket对接+A项目 |
| DTS-9850 | Linker\|OMS\|BI中 LSO Package相关Terminal、expected delivery date、SLA取值规则调整 |
| DTS-9916 | Linker\|Live chat 集成版APP中支持已读未读功能 |
| DTS-9934 | 工作流状态图需要允许外人查看，对权限相关进行调整。 |
| DTS-9921 | Netsuite Item Group 在订单履行流程中的处理规范 |
| DTS-9935 | stron 多包裹回传netsuite处理 |
| DTS-10015 | 推送2个DO单给FMS |
| DTS-9915 | CP\|申请linker_oms_opc库的生产账号，只读权限 |
| DTS-9917 | Linker\|Live chat 集成版APP中支持消息推送功能 |
| DTS-9918 | Linker\|Live chat 集成版APP中支持公司切换功能 |
| DTS-9980 | [Small Parcel] New Carrier - eHub |
| DTS-9988 | [Small Parcel] Renew SSL Certificate for UPS MI Rate API |
| DTS-9997 | Inflated Carrier Rate |
| DTS-10027 | Linker\|OMS\|批量操作将提供的LSO包裹标记为RTS（4-共9单） |
| DTS-10043 | midea-文件格式问题 |
| DTS-9982 | IAM\|CP\|TMS client portal V2 的账号处理 |
| DTS-10020 | Linker\|CP\|unisco.com 注册流程补充逻辑 |
| DTS-10067 | Application session timeout |
| DTS-10069 | Linker\|CP\|Client Portal3.0 已有模块与新数据权限关联关系处理 |
| DTS-10076 | Harness-get-shit-done 项目功能调研-1 |
| DTS-10084 | DI-web Flow AI Assistant — Flow Editor 画布内对话式 AI 搭建助手 |
| DTS-10085 | La Jolla Group - Facitlity Move Update 2（Valley View） |
| DTS-10101 | Univera Brands - Drop order with title name |
| DTS-10113 | Linker\|CP\|给TMS client portal V2 导入IAM的User发送初始密码邮件 |
| DTS-10150 | FBM的Channel:设置补差遗漏订单的方案 |
| DTS-10179 | Linker\| CP \| Return label生成问题 |
| DTS-10070 | OnlinePayment存储用户卡信息的系统调研 |
| DTS-10074 | PCI-Application access request denied log |
| DTS-10072 | PCI-Access list for production application |
| DTS-10073 | PCI-Application - PAN protection |
| DTS-10075 | Harness-ralph-tui 项目功能调研-1 |
| DTS-10079 | Rii Express Carrier |
| DTS-10124 | PCI-Password reuse controlled |
| DTS-10123 | Stron flow更新 |
| DTS-10153 | DI: 前端需要兼容请求接口返回code值为字符串类型 |
| DTS-10195 | PCI-Password complexity minimums |
| DTS-10248 | MFA enabled for in-scope systems |
| DTS-10247 | MFA is securely configured |
| DTS-10246 | router、scheduler、locker应用启用 aws-kms |
| DTS-10288 | Natus 订单同步到WMS， 排除掉location 不在配置范围内的itemline |
| DTS-10292 | UPSNACK BRANDS - Order not imported |
| DTS-10315 | Upsnack Brands - Order not import but fulfilled by UNIS |
| DTS-10362 | OMS order import failed - Seabrook ZURU ref 8000471072, no DN created in WMS |
| DTS-9741 | CP\|portal3.0目前已有功能测试-Yard Management |
| DTS-10206 | Linker\|CP\|Client Portal3.0中的Assistant需切回Atlas |
| DTS-10190 | Linker\|CP\|需将Unis的历史账号数据迁移到最新用户权限管理模块 |
| DTS-10174 | Linker\|CP\|Client Portal Dark 模式下菜单显示问题 |
| DTS-10176 | Linker\|CP\|Invoice中详情页面下载只能下载第一条的PDF信息 |
| DTS-10175 | Linker\|CP\|Finance的 invoice中download invoices 点击没反应 |
| DTS-10379 | Linker\|CP\|Unis正式环境Client Portal3.0查询时查询条件显示不出Customer |
| DTS-10251 | Linker\|CP\|Client Portal -Agents模块重构-Inbound Agent |
| DTS-10196 | Linker\|CP\|Client Portal -Agents模块重构 |
| DTS-10252 | Linker\|CP\|Client Portal -Agents模块重构-Outbound Agent |
| DTS-9890 | CP\|unisco.com 注册流程 |
| DTS-10377 | Linker\|CP\|测试环境LT租户主账号customer设置问题排查 |
| DTS-10215 | Linker\|OMS\|International Freight查看订单详情没反应 |
| DTS-10216 | Linker\|OMS\|LTL / FTL不能查看订单详情 |
| DTS-10186 | Linker\|CP\|统一调整整个ClientPortal的light和dark切换问题 |
| DTS-10217 | Linker\|OMS\|查找International Freight、LTL / FTL有数据的Merchant |
| DTS-10304 | OMS 在reopen销售订单的时候需要重新调用wms的aka接口 |
| DTS-10300 | Authentication fails closed |
| DTS-10302 | All encryption processes are fully documented |
| DTS-10303 | Access to cardholder data and cardholder data environment require explicit management approval |
| DTS-10301 | Authentication data storage, transmission and protection |
| DTS-10432 | Item OMS · Customize — 我的会话产物-需求调研 |
| DTS-10068 | Linker\|Livechat\|Web端问题修复与体验优化 |
| DTS-10159 | Linker\|Web livechat\|搜索无结果时对话详情页状态同步优化 |
| DTS-10004 | CP\|Wise2.0中Inventory Activity增加查询条件 |
| DTS-9439 | CP\|End to end-账号登录后提示无租户权限问题的优化 |
| DTS-10029 | Linker\|支持司机可在YMS的tablet发起视频与CSR视频会话 |
| DTS-10177 | Linker\|CP\|light-dark mode切换显示问题 |
| DTS-9098 | CP\|portal3.0目前已有功能测试-inbound |
| DTS-9262 |  CP\|portal3.0目前已有功能测试-Inventory |
| DTS-9729 | Linker\|OMS\|LSO Smallparcel D状态取值逻辑调整 |
| DTS-9796 | CP\|TMS client portal V2 的账号处理 |
| DTS-9278 | CP\|End to end-Shipments-Location搜索调整 |
| DTS-9893 | [Linker][DI][Merchant] Merchant 后端管理优化：CRM Customer 非必填 & 特定租户 Customer 只读 |
| DTS-9907 | CP\|client portal-tracking页面数据状态对接FMS数据状态 |
| DTS-9684 | CP\|client portal 新站点部署及相关准备 |
| DTS-9882 | CP\|client-portal-前端改造适配权限管理 |
| DTS-10095 | GLS Milton - Carrier list empty in Shipping Account Setting |
| DTS-10109 | [Small Parcel] FreightClub Carrier Services |
| DTS-10126 | SM: 修复ShipEngine的 label和rate价格不一致问题 |
| DTS-10369 | [Small Parcel] UPS collect shipment Support New Billing Type - Consignee Billed - UPS |
| DTS-9424 | [Small Parcel] Amazon SHipping - Support Dangerous Goods |
| DTS-9961 | [Small Parcel] CLONE - HAZMAT Order Issue  |
| DTS-10312 | [DI] 365BC adjust the mapping - Reference - 4 - TSP |
| DTS-10456 | GloryWisdom - - SamsDSV 批量删除fullfillment |
| DTS-10464 | Linker\|CP\|Client Portal--Tracking页面状态切换标签后统计数字及显示条数选择问题 |
| DTS-10202 | [WMS] FBM shipping label - Adding debug log - Net Health |
| DTS-10092 | [Agent] Small Parcel Assisstance Agent |
| DTS-9960 | Tracking not sending back to shopify for shipped orders- SPLENDOR WATER |
| DTS-10040 | Linker\|CP3.0\|preferred service选项调整 |
| DTS-9978 | Tracking is not sent back to Shopify- SLEEP DOCTOR |
| DTS-10094 | Stron 导出到WMS的订单，将Netsuite的Customer作为Retailer 放到DN上。 |
| DTS-10455 | GloryWisdom-Cancel 无效订单 |
| DTS-10166 | [WMS] UNIS 3.0 FBM shipping label - Net Health |
| DTS-9976 | CLONE - [Saas WMS] FedEx Account Cannot work - YesCom |
| DTS-10139 | Amazon Orders Stopped to import into the OMS/WISE - COME REDAY FOODS |
| DTS-10161 | Orders Without "Good To Ship" Tag Still Importing into WISE Despite DI Filter Configuration--- SLEEP DOCTOR |
| DTS-10214 | [DTS] DTS FBM Label Request - Ship From Address Logic - Net Health |

### Other（1）

| Key | 标题 |
|-----|------|
| DTS-8357 | Order Adapter Service |

---

## BNP（219 项已完成）

### Feature（19）

| Key | 标题 |
|-----|------|
| BP-8427 | AP\| Vendor Payment - "Pay to" Column and Search Criteria |
| BP-12615 | AP\|Import/Export Enhancements on Delivery Agent Pay Page |
| BP-13175 | [API文档] BNP Vendor Application API + Create Journal Entry 补充 |
| BP-12870 | Phase 3 - Billing Windows Service 部署 |
| BP-12866 | Phase 5 - BNP 嵌入页面 URL 调整 |
| BP-12868 | Phase 6 - 数据库脚本管理统一 |
| BP-12867 | Phase 5 - RE V2 数据库调整 |
| BP-12855 | Phase 1 - 数据库准备 |
| BP-12861 | Phase 3 - Python 服务部署 |
| BP-12859 | Phase 2 - Kafka Consumer 拆 Repo |
| BP-12864 | Phase 4 - 外部系统配置 |
| BP-12858 | Phase 2 - 代码分支管理 |
| BP-12865 | Phase 5 - CVRM 数据同步 |
| BP-12863 | Phase 3 - SQL Server CDC 启用 |
| BP-12862 | Phase 3 - SQL Server Job 配置 |
| BP-12919 | CLONE - Masterinvoice对接BNP的优化【AR master invoice】 |
| BP-13110 | Billing\| Ship Method Value from WMS for Billing |
| BP-12590 | RE \| Vendor - Create API to Calculate Cost |
| BP-11924 | RE \| Liability Setup - Default Rules Tariff for Historical/New Customers |

### Bug Fix（77）

| Key | 标题 |
|-----|------|
| BP-12597 | BNP返回的rate 信息还是会出现FMS calculation error |
| BP-12971 | Billing\|Price List customer 下拉框出现空白客人选项 |
| BP-13048 | Billing\| Cannot edit sales invoice |
| BP-13126 | Billing\|Price List Missing Condition-Billing Grade for Setup |
| BP-13233 | Billing Item\| Bookkeeping- Invoice Details Double count |
| BP-13125 | Small Parcel Billing\|Unexpected Billing & Incorrect ShippedCSQty |
| BP-12129 | AP\| Vendor Bill Operation Approval - View Log and Operation View Detail Unmatch |
| BP-13119 | AP\|AI Invoice - Not Auto Submit Invoice with Automation Setting |
| BP-13009 | Support\|Invoce手动更新状态后，summary及grand total等清0问题 |
| BP-12575 | Billing\| Handling Invoice missing Pick billing  Item |
| BP-12953 | GL\| Incorrect Location Dropdown Values |
| BP-13170 | AP Purchase\| View log Records Incorrect User Operation |
| BP-12612 | Billing\| Freight Invoice duplicate Charge  |
| BP-13038 | Support  \| Central3.0 Release环境创建租户-Digit Art Cloud   未同步到BNP的Release |
| BP-13115 | Billing\| Job Code Not Synced to WMS |
| BP-13101 | Offload charge is not reflecting on BNP |
| BP-13113 | Driver Agent Pay \| Invoice Detail页面数据回显不出来 |
| BP-13131 | Billing\| Small Parcel Carrier Invoice Display Error |
| BP-13028 | System\| User Group - Not Able to Save Billing Rule Access |
| BP-13198 | RE \| Delivery Agent - Rate Failed |
| BP-13183 | Billing\| Invoice Missing Accessorial Charge |
| BP-12756 | Billing \| Incorrect Additional Invoice Details and Duplicate Charges |
| BP-12730 | CLONE - POD for Carriers not syncing to BNP again [TMS to BNP] |
| BP-12875 | AR\|Master Invoice\| Missing Invoice from TMS to BNP |
| BP-12975 | Billing\| Missing Invoice in small Parcel Billing review |
| BP-12981 | Billing\| RN Item Missing After Invoice Recalculation |
| BP-12902 | AP\| DA Fusion - Orders Missing POD |
| BP-12994 | Billing\| Invoice missing Material and Pick regular order  |
| BP-13000 | Claim\| System Generated CM with Incorrect Location |
| BP-13002 | AP\|Delivery Agent - Status Not Updated When Order Already Delivered |
| BP-13041 | Billing\| Additional Freight Invoice Grand total Error |
| BP-13043 | Invoice\|General Sales Documents-上传文件报错 |
| BP-13049 | Billing\| Data incomplete in Vita Coco's sales invoice |
| BP-13027 | Billing\| Small Parcel Billing add tracking number error |
| BP-13030 | Billing\| Freight Invoice  not generate by Billing Rule  |
| BP-13051 | Billing\| Freight Invoice Missing DN-order |
| BP-13055 | Billing\| Invoice clone Approve Error |
| BP-13059 | Claim\| Error "ConnectionString is not null" When Click Review |
| BP-13012 | Billing \| Incorrect Item Source Display (Price List vs Global) in Add Item Function |
| BP-13014 | Billing\| Import Price List Function Fails to Recognize Configured Categories in Billing Rule |
| BP-13061 | Billing\| Invoice missing Inbound charge |
| BP-13060 | AP\| Bill Credit Memo Apply - Not Able to Apply to Bills |
| BP-13094 | AP\| Vendor Account - Payment Information Missing in BNP But VRM Has |
| BP-13096 | Dispute\| Credit Memo from Dispute Cannot Be Posted |
| BP-13100 | AP\| LH Trip Not Synced and Driver User Login Failed |
| BP-13107 | Billing\| Material Not Auto Billed For TCL |
| BP-13109 | Invoice Dispute\| Approved Amount and CM Shows $0 |
| BP-13105 | Billing\| Sales Invoice - Redirect User to Login Page When Click on "FilterDetail" |
| BP-13118 | Vendor Account\| Pay to Address Information Not Match to VRM |
| BP-13089 | AR\| Prepayment Customers Details duplicate Charge  |
| BP-13090 | AP\| AI Invoice - UF AI Invoice Page No Data Loading |
| BP-13116 | AR\| Manual Charge - Charge Successfully but Payment Status Shows "Refunded"  |
| BP-13117 | Billing\|Missing Invoice Auto Created  |
| BP-13133 | Billing \| Invoice Export and Recalculation  Error |
| BP-13132 | Billing\| Not Able to Email Invoice |
| BP-13135 | AR\| Sales Invoice - Export Error "Out of Memory" and Needs to Rename File |
| BP-13138 | AP\|Delivery Agent - Not Able to Batch Post Due to AP_ID Missing |
| BP-13164 | Billing \| Small Parcel - Carrier Invoice Stuck in Validating Status |
| BP-13167 | Billing \| Freight Invoice Details Duplicated 10 Times |
| BP-13173 | Billing\| Carrier Invoice details Double calculate  |
| BP-13177 | AP\| Delivery Agent - Invalid Due Date Generated |
| BP-13182 | Billing\| Invoice  did not generate  |
| BP-13181 | GL\| Location list  and location Mapping Missing Location  - 820-Suffolk |
| BP-13189 | AP\| Carrier Pay - Trip Syncing Issue |
| BP-13042 | Billing Bookkeeping\| Import Report Location Error and can not generate invoice  |
| BP-13165 | Billing\| Small Parcel Missing Order |
| BP-13168 | Billing\| Additional freight Invoice missing details  |
| BP-13112 | Small Parcel Billing\|Tracking Numbers Missing Additional Invoices |
| BP-13180 | Billing\| Small Parcel Billing Review Packed Date Filter Not working |
| BP-13039 | Billing\| Prepayment Alert Email Sending Timing Issue |
| BP-13023 | Billing\| Small Parcel Billing-Carrier Reconciliation Incorrectly Shows Missing Customer for Matched Original Invoice |
| BP-13058 | Billing\| Carrier Invoice Reconciliation Details- Upload Missing data Error |
| BP-13240 | Billing\| Invoice export backup blank  |
| BP-13207 | Small Parcel \| 处理 Additional Invoice 中大量 Amount = 0 及 Amount < 0 的异常数据问题 |
| BP-13099 | Billing\| Small Parcel Billing Review - Not Able to Void "Draft" Invoice |
| BP-13234 | Commission\| Approved and Active Commission List - Details Show Line Invalid |
| BP-13256 | AR\| Cash Receipt - Keep Loading When Export Attachments |

### Improvement（123）

| Key | 标题 |
|-----|------|
| BP-10954 | AP\| Vendor Bill and Payment - Search Criteria Enhancements |
| BP-10990 | AP\| Driver Name and Driver Invoice Format Enhancements |
| BP-11694 | Bank\| New Transaction Rule - Need to Support Special Characters 's |
| BP-11552 | AP\| Driver Management - Auto Create User When New Driver Sync from VRM to BNP |
| BP-12656 | RE \| MCP - Improve Performance |
| BP-12265 | AP\| Driver Pay - Auto Re-rate the Trip Amount and Allocation When Orders Updated |
| BP-12818 | DBA\| EXEC dbo.RP_InvoiceCheckReport 1000, Null 执行性能优化 |
| BP-12791 | DBA\|去掉OP_Wise_ShippingReport_TrackingNumber表的重复索引 |
| BP-13032 | Employee DriverPay\|Post大量数据调用TMS API 超时优化 |
| BP-13031 | PortPro 接口 customerPo Number支持导入 |
| BP-13047 | AP\|Delivery Agent Page Ready to Pay Criteria Set up |
| BP-13128 | Support \| TMS 3.0 推送异常 — trip 变更触发 order 频繁同步（4分钟超200次）-接收策略优化 |
| BP-13108 | AP\| Carrier Pay - Remove Transactions When Trip Cancelled or Incompleted |
| BP-13221 | AP\| Vendor Payment - Need to Enhance Loading Performance |
| BP-13225 | AR \| Optimize V4_PU_Auto_GenBilling SP - Query Config Tables Locally in Calculation DB |
| BP-13088 | AP\| Carrier Pay - Transaction Cancelled Logic to Remove the Data |
| BP-13124 | VANTAGE TRANSITION LLC 推送KAFKA数据到DI 超时优化 |
| BP-12989 | 	AP\|Import/Export Enhancements on Delivery Agent Pay Page \| UI/交互实现 \| plan5 |
| BP-13204 | 修复 DeriveFactTypes 中 ST_RS 对 ShippingReport 的依赖映射 |
| BP-13205 | 前端 Recalculate 适配 Trigger 接口 BillingRuleSetId 字段 |
| BP-12893 | AI-Native 回复快捷建议 + Approve 流程与数据需求分析 |
| BP-12889 | LSO Billing Inquiry AI Assistant Spec 设计和全栈代码 Coding |
| BP-13250 | 调研 Outbound Pick 计费逻辑（HD_SR_PIK 存储过程） |
| BP-13249 | 调研 Split Rate 计算逻辑（first/additional 拆分计费） |
| BP-12923 | AP\|Import/Export Enhancements on Delivery Agent Pay Page \| UI/交互实现 \| plan2 |
| BP-12961 | AP\|Import/Export Enhancements on Delivery Agent Pay Page \| UI/交互实现 \| plan4 |
| BP-12945 | AP\|Import/Export Enhancements on Delivery Agent Pay Page \| UI/交互实现 \| plan3 |
| BP-12926 | AP\|Import/Export Enhancements on Delivery Agent Pay Page \| API处理 |
| BP-13017 | BNP & DI Invoice Sending - API Integration |
| BP-13018 | BNP & DI Invoice Sending - UI Implementation |
| BP-13054 | AP\|Delivery Agent - Function Issues on New UI \| Page Processing |
| BP-13179 | BNP 中的部分 invoice 未被拉取到 Netsuite |
| BP-12795 | AI-Navite Spec 规范流程以及后端生成代码、数据库 |
| BP-12805 | AI-Navite Spec 前端规范流程以及生成代码 |
| BP-12879 | AI-Navite 通知和市场价格搜索 |
| BP-12839 | AI-Navite 真实数据处理 |
| BP-12898 | Market Place\| Generating Invoices Based on Billing Rule ID |
| BP-12982 | Billing\| Clarify Note Logic for Imported Receiving & Shipping Reports and Recalculate Rules |
| BP-12993 | BNP Test(Staging)迁移至AWS |
| BP-12901 | BNP LSO 业务逆向分析与梳理（Code Reverse Engineering） |
| BP-12928 | AI-Native 自动生成 Tool 核心层设计并实现 |
| BP-12929 | AI Native kpkg 知识包文档规范设计 |
| BP-13005 | AI Native 知识文档分级读取 |
| BP-13004 | 支持 kpkg 压缩包导入（zip/tar.gz/xz） |
| BP-13003 | AI Native 生成 BNP 知识库文档 |
| BP-12996 | Billing\| Small Parcel - Carrier USPS logic update |
| BP-13006 | AI Native Web 搜索与网页抓取 |
| BP-13007 | AI Native 定时任务系统 |
| BP-13008 | AI Native ChatPage 支持 URL session 跳转 |
| BP-13019 | CLONE - 梳理刷新目前AP数据问题以及AP 数据不一致的原因查找【AP Data】 |
| BP-13026 | AI Native 生成 BNP 本体 |
| BP-13029 | AR\| Sales Document - Need to Correct Invoice PDF Typos |
| BP-13022 | Client Portal \| SyncClaimToBNP Interface - Append Description Field |
| BP-13142 | Billing\| AiAgent\| Aurora UI 菜单调整 |
| BP-13156 | Billing \| BillingCore \| 系统设计 |
| BP-13169 | Billing\| 三方系统推送 Site 信息时，若 BNP 已存在对应 Facility，Location 无法自动关联 |
| BP-13158 | Billing \| BillingCore \| Recognition Engine 技术规格与领域建模 |
| BP-13160 | Billing \| BillingCore \| Pipeline 事务一致性与 BillableRecordType 页面 |
| BP-13159 | Billing \| BillingCore \| Rating 诊断与 Recognition 日志增强 |
| BP-13157 | Billing \| BillingCore \| 系统框架搭建 |
| BP-13161 | Billing \| BillingCore \| Recognition Rule 与 Markup 计算修复 |
| BP-13146 | Billing\| AiAgent\| billing agent openAI 模型调优 |
| BP-13144 | Billing\| AiAgent\| billing agent UI 调整 |
| BP-13152 | Billing\| AiAgent\| Aurora Schedules |
| BP-13187 | 调整FactType逻辑和关联表字段 |
| BP-13185 | 接入Kafka消费，集成去重，DashBoard Wise Push Data Throughput统计（模块化+统一Query参数） |
| BP-13202 | 优化 Pipeline Trace：增加源数据/Mapping数据详情查看，改进 Recognition Rule 未命中诊断 |
| BP-13215 | Trace页面：按DocId追踪老系统Invoice计费结果（BillingItem命中 + 价格展示） |
| BP-13203 | Recognition Rule condition values mismatch with actual WMS payload values |
| BP-13201 | 调研BillingRule到新系统InitializeAsync的转换逻辑 |
| BP-13229 | Pipeline : 实现新billing 系统和老系统之间，根据Charge Code 自动化对比计费差异 |
| BP-13212 | Supplement Recognition Rules from BA Billing Config document for Inbound Offload/Transload |
| BP-13216 | 修复Trace页面Pipeline Runs的Duration时间性能指标显示不正确 |
| BP-13134 | Small Parcel Claim \| Claim Reason: Add "Delivery Guarantee Claim" |
| BP-13226 | Trace 页面 : Pipeline Run Summary 服务化重构以及性能优化。 |
| BP-13246 | Billing \| BillingCore \| RatingLookupField — RANGE_RATE/TIERED_RATE 支持自定义 Bracket Lookup 字段 |
| BP-13242 | Billing \| BillingCore \| Pipeline执行速度优化 |
| BP-13245 | Billing \| BillingCore \| Storage业务场景计算逻辑调研 |
| BP-13227 | Billing \| BillingCore \| 补充 Outbound Qty 表达式（Count/Sum/除法）及 Dimension 配置导入 |
| BP-11457 | Billing\| Carrier Invoice Reconciliation - Service Description for Additional invoice  |
| BP-12909 | Bank\| Wells Fargo - Connect to 2 New Bank Accounts |
| BP-13025 | Small Parcel \| 生产SQL SERVER的历史数据分离 |
| BP-13052 | Fixed Asset\| Asset List - Add Group "Unis Fulfillment\|California\|Moreno Valley" |
| BP-13097 | Small Parcel \| 承运商（Carrier）的服务描述（Service Description）合并逻辑调整 |
| BP-13106 | Bank\| Match Transaction - Journal Entry Should be Updated to Correct Bank Account When User Manually Update the GL Account |
| BP-13111 | Fixed Asset\| Asset List - Add Group "Unis Fulfillment\|IIIinois\|Elwood" |
| BP-13071 | Billing\| AiAgent\|Ontology |
| BP-13075 | Billing\| AiAgent\|定时任务 |
| BP-13214 | AP\| Delivery Agent Pay - 同一个Pro#对应两笔Transaction，需排查重复原因 |
| BP-12677 | Support\|FMS\|提供给FMS方rate调用的SMC3的接口 |
| BP-13176 | API \| OpenAPI 加IAM鉴权 |
| BP-13013 | Marketplace\| Cash Receipt - Need to Auto Generate "GL Impact" and Change Createdby |
| BP-13120 | 调查LGM Soil经常被frozen的原因及解决办法 |
| BP-13188 | Support \| Client Portal invoice 页面中的accountType 针对item需要传companyCode |
| BP-12950 | BNP & DI Invoice Sending Integration Workflow-【CRMC-4025 同步上线】 |
| BP-11364 | Billing\| Question Factors 页面新增校验功能 |
| BP-13220 | RE \| Add Read-Only Permission |
| BP-13236 | Billing \| Invoice Dashboard - BNP 计费发票监控看板 |
| BP-13248 | Billing Agent \| 新增Chat页面和持久化记忆 |
| BP-12800 | Billing\|  check status |
| BP-12976 | Billing LSO\| LSO import Accessorial for User |
| BP-12965 | Billing \| Handle Carrier Invoice Data Cleanup on Vendor Bill Deletion |
| BP-12999 | AR\| Update GL Account for Existing Credit Record Due to Accounting Adjustment |
| BP-12995 | AP\| Delivery Agent - "Note" Not Able to Save and Status Not Auto Update to "Ready to Pay" |
| BP-13021 | 重推Vitacoco210发票-0410 |
| BP-13001 | AR\|Sales Invoice - Change Posting Date to "04/03/2026" |
| BP-13020 | Billing LSO\| LSO import Accessorial for User |
| BP-13050 | AP\|Delivery Agent - Function Issues on New UI |
| BP-13015 | AP Purchase\| PO Missing RN auto generate |
| BP-13040 | Billing\| Handling Invoice missing Offload billing Item |
| BP-13062 | AR\| Sales Invoice Revenue Allocation 604 Failed |
| BP-13095 | Billing LSO\| LSO import Accessorial for User 0424 |
| BP-13127 | AP\| Delivery Agent - Missing Due Date and Invoice Type |
| BP-13122 | Billing \| 4个customer，例如TPV usa 有6个handling的rule，绑定的valleyview，但是从来都没有进入过计算队列 |
| BP-13174 | 排查代码中是否还在使用 Ufinvoice 旧 App ID (a4bf20ba-3eda-4e42-af51-4e962ad8bf47) |
| BP-13196 | AP\| LH Carrier Pay - Missing Vendor Bills Genarated |
| BP-13206 | AP\|Delivery Agent - Missing Orders |
| BP-13199 | Billing\| handling Invoice Missing rush order feee |
| BP-13193 | Commission List\| Duplicate Commission Items Added |
| BP-13171 | AP\| Carrier Pay - Delivery Agent Order Incorrect Status and Driver Pay Duplicate Orders |
| BP-13265 | AP\| Delivery Agent - Delivered Orders Show “In Transit” Status |
| BP-13258 | Billing\| Void 2025 billing period additional freight invoice by accounting required   |
| BP-13254 | GL\| Journal Entry - Duplicate Reversing JE Generated |

---

## CRM-Core（66 项已完成）

### Feature（4）

| Key | 标题 |
|-----|------|
| CRMC-3996 | CC\|增加filter load more等功能，解决性能问题，提升用户体验 |
| CRMC-3995 | CC\|Filter支持字段内多选功能 |
| CRMC-3984 | LD\|列表增加排序功能 |
| CRMC-3862 | CU\|Health Analyst |

### Bug Fix（4）

| Key | 标题 |
|-----|------|
| CRMC-4044 | Support \| BNP - Billing\|Price List customer 下拉框出现空白客人选项 |
| CRMC-4074 | CRM Stag 环境新建CustomerCode自增长异常 |
| CRMC-4093 | CU\|处理Customer中状态为空的数据 |
| CRMC-4073 | IS\| Infrastructure \| 调查并处理异常记录日志中的异常 |

### Improvement（58）

| Key | 标题 |
|-----|------|
| CRMC-4024 | CC\|Pipeline Designer等模块更新错误提示交互方式 |
| CRMC-4043 | LD \| 动态字段排序把下拉值也加进来，同时考虑性能问题 |
| CRMC-4057 | LD\|处理辕海和刘斌遗留的上线的票问题 |
| CRMC-4062 | InfraStructure \| 验证和调整CRM/VRM/IDM的环境变量 |
| CRMC-4082 | DB \| Dashboard对接两个新的BI数据源 |
| CRMC-4058 | InfraStructure \| 处理2张代码审计的Ticket |
| CRMC-4010 | CC\|前端实现Filter多选 |
| CRMC-4011 | CC\|Filter 弹窗横线列表增加分页，优化性能，提升体验 |
| CRMC-3961 | LD\|Activity-Call报表增加拨打人信息变更phone的存储方式以及添加 call 关联的联系人 |
| CRMC-4013 | Aurora \| auror 部署上线功能以及聊天功能对接企业微信同步发送 |
| CRMC-3998 | Aurora \| Planning ticket module  |
| CRMC-4000 | Aurora\| 历史记录对话module |
| CRMC-3999 | Aurora\| dashboard module |
| CRMC-4015 | Aurora \| 重新调整登录页面样式并增加重置密码功能 |
| CRMC-4029 | Aurora \| Skill marketplace |
| CRMC-4030 | Aurora \| planning ticket async |
| CRMC-4040 | Aurora \| 集成对接bitbucket仓库功能 |
| CRMC-4048 | Aurora\| knowledge |
| CRMC-4032 | CC\|接口支持Filter多条件筛选 |
| CRMC-4017 | CC\|变更示例值获取的逻辑，并根据不同类型的字段按照不同的排序规则排序，添加分页功能 |
| CRMC-4003 | CC\| 新增新的 MultiSelect 动态字段类型的基础结构 |
| CRMC-4006 | LD \| 动态字段各个类型字段排序体系建立 |
| CRMC-4026 | LD \| 不同类型动态字段排序规则单独处理、排序持久化 |
| CRMC-4033 | LD \| 前端新建动态字段统一排序控件 |
| CRMC-4055 | CU\|新增Customer Health页面 |
| CRMC-4056 | CU\|Dashboard更新，新增两个饼图，且排版变更 |
| CRMC-3979 | Aurora tasks 权限范围调整 |
| CRMC-4047 | Linker\|CP\|unisco.com注册与CRM数据对接 |
| CRMC-4059 | Linker\|CP\|Client Portal3.0从CRM获取历史Customer数据 |
| CRMC-4025 | CRM\| Deprecate Billing Setup & Retain Billing Code Prefix for UF Logic |
| CRMC-4106 | Billing\| AiAgent\| Aurora Kb 集成 GitNexus |
| CRMC-3966 | Aurora \| Dashboard中查看indev数据需要将pending过之后再改回来的数据展示出来 |
| CRMC-3965 | Aurora \| 进度汇总- 集成类任务进度填写以及汇总 |
| CRMC-3972 | Aurora \| 迭代更新每日需求点记录 |
| CRMC-3986 | Aurora\|追加一个部署清单的功能，每天团队成团在这里提交上线内容 |
| CRMC-4019 | Support \|CMPC USA INC数据同步问题 |
| CRMC-4036 | Support \| 有个人想在crm生产给某个账号加权限 |
| CRMC-4070 | 确认Mail.ReadWrite权限是否可以移除或替换为Delegated级别权限 |
| CRMC-4091 | Support \| 确认Ticket同步机制 |
| CRMC-4094 | CU\|On hold查询逻辑更新 |
| CRMC-4053 | WFE \| 王登交接WFE，以及把他电脑上没有提交生产的项目以及有用的资料弄下来 |
| CRMC-4052 | App \| 刘斌交接 app，以及本sprint上线的票 |
| CRMC-4051 | LD \| 辕海交接jsonb，3cx，动态字段，lead和deal，以及本sprint的上线内容票交接，以及遗留的紧急问题处理 |
| CRMC-4054 | Support\|协助iam排除网关的问题 |
| CRMC-4060 | Support\|①帮Linker ②帮Tracy ③帮Client Portal |
| CRMC-4061 | CU \| 新增v2版本的customer下拉列表 |
| CRMC-4067 | IT Security \| AWS IAM密钥泄漏处理 |
| CRMC-4068 | WFE \| ①WFE处跳转Quick Link到CRM时遇到不同租户时要租户切换映射②customer列表页查询参数可从url中动态获取查询③wfe支持将stage里的字段的值作为link参数传递 |
| CRMC-4064 | Support\|WFE-CRM Auto Create Customer  |
| CRMC-4065 | WFE \| 删掉测试数据 |
| CRMC-4069 | Support\|解决Andy Mi账号问题，然后冻结一部分离职人员的账号 |
| CRMC-4046 | Support\|Preview环境IAM创建租户后没消费到IDM的问题调查处理 |
| CRMC-4080 | DB\|Dashboard生产样式问题 |
| CRMC-4087 | Change Customer Code for Account in CRM Stage 3.0 -- DAGNE DOVER |
| CRMC-4076 | InfraStructure \| 修复 CRM 系统 Email 不支持 unisco 邮箱绑定的问题 |
| CRMC-4049 | Support\|关联BNP账号和IDM账号 |
| CRMC-4089 | Support \| Customer：glorywisdom\| Location \| GW-RC 地址修改，需要清crm缓存地址 - prod 环境 |
| CRMC-4090 | IDM \| 专门出个teams相关的接口文档,并改造teams相关接口解决职责混乱语义不清等问题 |

---

## Rate Engine

该期间暂无已完成工作

---

## VRM（8 项已完成）

### Improvement（8）

| Key | 标题 |
|-----|------|
| VRM-1265 | VRM\| Individual Vendor - Add "Type of Business" - 页面、TAXID格式调整 |
| VRM-1264 | VRM\| Individual Vendor - Add "Type of Business" -Kafka |
| VRM-1261 | VRM\| Individual Vendor - Add "Type of Business"  |
| VRM-1267 | VRM\| UF 3211 Vendor Accounts Need to Be Deactivated |
| VRM-1262 | VRM Preivew 环境维护更新到最新版 |
| VRM-1266 | Support \| FMS-Vendor Management 需要Service Type加入kafka |
| VRM-1269 | VRM\| Vendor Profile - File Category and Individual Fields Requirements Changes |
| VRM-1270 | ST \| 帮BI工程师开通只读账号 |

---

## BI（112 项已完成）

### Feature（51）

| Key | 标题 |
|-----|------|
| BI-633 | cube编辑和使用过程中，需要有一个将字段拖到column中的校验规则 |
| BI-594 | 开源BI平台 redash 使用 |
| BI-464 | DIMENSION字段需要引用变量实现动态修改逻辑 |
| BI-474 | BI - item IAM integration |
| BI-522 | homepage - Write documents related to the report |
| BI-1064 | ChatBI - Support chat with teams |
| BI-1067 | Login - check timeout when reset password |
| BI-1202 | Redash - Build a frontend app on AWS S3 |
| BI-1110 | 优化用户体验（创建cube选择库表时，应将没权限的库表置为不可见） |
| BI-654 | BI - Optimized for mobile phones |
| BI-854 | Agent - Build Preview and Production env |
| BI-971 | accounting的claim脚本增加提交fedex |
| BI-1177 | Redash - Support dark mode for share url |
| BI-868 | 交接accounting的多个自动化项目 |
| BI-2019 | OpenClaw  - The use of OpenClaw in BI |
| BI-1720 | cube - login with AWS |
| BI-402 | BI - Dimension fields support tree structure |
| BI-855 | Cube - Build login page for cube、form、redash and agent |
| BI-892 | Login - optimize |
| BI-1568 | HRM - Mysql integration |
| BI-1159 | 【redash】chatbi 图表参数大模型自定义传参 |
| BI-1019 | Cube - User notification |
| BI-686 | IoT - Samsara integration |
| BI-372 | 【20240816】BI系统及CUBE分享的若干决议与行动项 |
| BI-344 | BI - Support CI/CD |
| BI-351 | BI - Support comapre cube page |
| BI-318 | BI - Spport multi-tenant mode |
| BI-1189 | ChatBI - Support custom chart on the redash |
| BI-1999 | BI - Phase1: Build JDBC for data api |
| BI-1795 | Graph - Build BI Graph Platform |
| BI-1657 | Form - optimize form data search |
| BI-1481 | ChatBI - Support MCP |
| BI-2003 | BI - Reconstruct the datalake platform |
| BI-2112 | 物化工具的升级，驱动开发，acct任务重写 |
| BI-2124 | Accounting \| 整理UT Report List |
| BI-2139 | 小工具开发，accouting项目维护与开发 |
| BI-2119 | Accounting \| view_wise_space_usage_union (VIZIO) |
| BI-2120 | Accounting \| TMS order data |
| BI-2121 | Accounting \| Wise Order Check |
| BI-2123 | Accounting \| UT 业务和数据流转介绍 |
| BI-2122 | Redash \| dashboard 整理 |
| BI-2128 | Accounting \| UT PNL DATA |
| BI-2152 | ns gl line 核对数据 |
| BI-2153 | performance 修改 |
| BI-2154 | 复刻页面 |
| BI-2155 | Accounting \| view_wise_space_usage_union (group by) |
| BI-2156 | Accounting \| Wise Billing Miss Check (MAR) |
| BI-2146 | Accounting \| WMS FTP Report |
| BI-2159 | Athena \| Wms app JDBC |
| BI-2158 | Accounting \| UT Pro Data |
| BI-2160 | Accounting - inventory(with location no.)daily report \| origin data change |

### Bug Fix（2）

| Key | 标题 |
|-----|------|
| BI-578 | 选择枚举字段返回的值进行查询，sql查询数据的值与选择的枚举值不一致（制表符，空格） |
| BI-1674 | 大sql 执行报错，拿不到结果 |

### Improvement（59）

| Key | 标题 |
|-----|------|
| BI-2031 | nl2sql-skill v0.4.0 |
| BI-2113 | 物化平台 |
| BI-2118 | 全新ui |
| BI-2114 | 修复bug |
| BI-2117 | 授权 |
| BI-2116 | jdbc并发 |
| BI-2115 | 新功能 |
| BI-2141 | 优化工具 |
| BI-2142 | 优化系统 |
| BI-2140 | 知识总结 |
| BI-2143 | 新增功能 |
| BI-2145 | accounting small parcel 数据爬取 与claim重构2 |
| BI-2144 | accounting自动化任务与运维与开发1 |
| BI-2149 | JDBC 集成及权限保护问题 |
| BI-2147 | 修复 kiro proxy 异常思考问题 |
| BI-2151 | 新增 opensearch 流程，调整 altas 兼容新流程 |
| BI-2148 | dubhe 上游同步 |
| BI-2178 | Dubhe 上游同步以及 item 模型、品牌化等一些列集成 |
| BI-2179 | Dubhe 新增随安装内置 skill 能力 |
| BI-2177 | Dubhe 与数据查询操作优化 |
| BI-2165 | tms ods 表准备 |
| BI-305 | BI - Research RAG workflow on Amazon OpenSearch Service |
| BI-583 | BI - Where it comes to the download feature, add whether or not to select the subtotal option |
| BI-589 | homepage - form system anchors, document structure definitions |
| BI-590 | homepage - The layout of the homepage is optimized |
| BI-617 | BI - Measure supports dragging and dropping to filter |
| BI-714 | BI - Optimized the display of JSON |
| BI-836 | Cube - Add sort panel for cube page and report page |
| BI-839 | Form - support darkness mode |
| BI-834 | Cognito - Change sender(noreply@verficationemail.com) to bi.helpdesk@item.com when reset password |
| BI-469 | BI - Support batch export report |
| BI-688 | IoT - Unis World Project |
| BI-1033 | cube - 数据回结果顺序与操作顺序不一致的情况 |
| BI-1115 | ChatBI - Add copy button on welcome page |
| BI-1201 | cube - icon in the tree hierarchy |
| BI-1480 | cube - Cube list supports displaying table/view names. |
| BI-450 | BI - Add check process when click delete button |
| BI-396 | BI - Support SSE transfer mode when user query too large data on cube page |
| BI-444 | BI - UI right control |
| BI-477 | BI - The report details page supports mobile display |
| BI-496 | BI - Show view link in the cube list page |
| BI-995 | Cube&Form - Vue email desginer integration |
| BI-811 | BI - External link redirection is supported |
| BI-851 | cube - Dashboards list optimization |
| BI-793 | BI - The email scheduling time can be in hours and minutes |
| BI-1342 | Research_kinesis firehose 同步 rds数据 |
| BI-792 | BI - dashborad adds tags for logical filtering |
| BI-1935 | pg&mysql 安全组限制公网访问 |
| BI-346 | BI - Support percent format on cube page |
| BI-503 | Customize the number of page breaks |
| BI-339 | BI - Support more dimension icon on cube page |
| BI-2130 | MongoDB 联邦 54 仓库物化同步 — order/sps/sd 全量落湖 |
| BI-2131 | Athena 物化工具 TYPE_MISMATCH 修复 + Skills 升级 |
| BI-2129 | WMS 报表复刻 — Billing Check + Tracking Number 底表物化 |
| BI-2135 | MongoDB Lambda 超时调整 + 大集合 COUNT 方法论 |
| BI-2134 | upload_bnp_location Lambda 优化 + prod1 中文乱码修复 |
| BI-2132 | LSO StepFunction 调用关系梳理 + Retry 修复 |
| BI-2133 | 流水线日常监控 — Linker_LSO/prod-start/tms_prod/tms_granular |
| BI-1878 | BI\|LSO PLC Report&OTS Reports生成及导出 |

---

## RP（113 项已完成）

### Feature（22）

| Key | 标题 |
|-----|------|
| RP-706 | 打磨前端cli，统一前端基础底座，实现项目快速搭建 |
| RP-707 | 打磨Spec skills，驱动agent自动决策完善开发 |
| RP-687 | 【HRM重构】iam登录相关功能。 |
| RP-679 | 【HRM】HRM重构前端功能迁移适配新的交互 （主任务） |
| RP-753 | HRM 打卡模块开发 |
| RP-694 | 【HRM重构】人员数据维护功能。 |
| RP-690 | 【HRM重构】同步paylocity系统中部门数据。 |
| RP-691 | 【HRM重构】同步paylocity系统中岗位数据。 |
| RP-689 | 【HRM重构】同步paylocity系统中人员数据。   |
| RP-693 | 【HRM重构】同步paylocity系统facility数据。 |
| RP-692 | 【HRM重构】同步paylocity系统bu数据 |
| RP-695 | 【HRM重构】人员needs review数据处理功能。 |
| RP-733 | 【HRM】core-hr 部分，页面查询相关后端服务开发 |
| RP-728 | 【HRM】hrm 打卡的最新重构和原有业务支撑 |
| RP-726 | 【HRM】hrm重构核心架构hrm core 的前期开发打磨 |
| RP-727 | 【HRM】hrm People 概念 对应的业务开发 |
| RP-729 | 【HRM】同步企微部门数据。 |
| RP-810 | Agency员工离职账号禁用流程 |
| RP-834 | IAM 用户名称异常原因排查 |
| RP-832 | IAM 管理后台角色分配异常bug处理 |
| RP-833 | HRM 本体构建 |
| RP-826 | 【recruit】recruit-backend代码审计2026 |

### Bug Fix（17）

| Key | 标题 |
|-----|------|
| RP-813 | Agency Workforce Check-In 提示 “field invalid：不能为空” 问题修复 |
| RP-837 | hrm/lifecycle/onboarding    页面， 查看 Badge  详情报错 |
| RP-848 | requisition 复制，其他字段都复制了，但是上级没复制 |
| RP-845 | Onboarding  页面， 需要隐藏 |
| RP-842 | Add Talent 流程中 添加照片了，后续流程就不需要再上传照片, 当前check in   步骤还需要上传照片 |
| RP-835 | Employee Lifecycle /Onboarding/comfirm    报错 |
| RP-846 |  chek in 时 ，Failed to create employee in Paylocity |
| RP-847 |  check in  时，绑定离职员工失败 |
| RP-852 | Agency Workforce Check-In  页面，人员名称重复展示 |
| RP-829 | Edit Facility 时，    添加经纬度信息时，输入无效经纬度 后，提示错误信息之后，用户修改为正确经纬度信息，提示信息还展示 |
| RP-831 | wms  新增的仓库，卡夫卡有正确推送，hrm     系统org_facilit  表中查询不到     对应的仓库 |
| RP-854 | 活账号的时候wms   app  账号激活失败 |
| RP-855 |  check in 流程生成工牌步骤，如果重新上传新的照片，生成的工牌应该拿最新的照片去生成，现在还是拿创建talent    时上传的照片生成的工牌 |
| RP-851 | agency  Requisition Detail 中， confirm  按钮去掉，pending agency   去掉 |
| RP-849 |   生成工牌失败 |
| RP-830 | Edit Facility/ Geo Fencing   模块信息，经纬度信息需要支持修改一下 |
| RP-844 |  当Requisition  已经Filled，但是存在 候选人为待审核状态的，点击批量审核，建议前端提示下失败原因 |

### Improvement（74）

| Key | 标题 |
|-----|------|
| RP-681 | HRM重构结构布局整体调整，ui风格适配 |
| RP-682 |  HRM重构迁移原来lms内容 |
| RP-680 | HRM重构开发架子开发搭建 |
| RP-715 | HRM重构 企微人员数据同步到人员快照表中 |
| RP-735 | 【HRM】前端页面所需员工查询与编辑相关接口 |
| RP-747 | HRM重构 提供h5打卡记录查询接口 |
| RP-737 | HRM重构 提供h5登录相关接口 |
| RP-736 | HRM重构 整体项目登录体系结构和逻辑重构 |
| RP-722 | HRM Person Page UI |
| RP-734 | 【HRM】前端页面所需类字典项相关接口 |
| RP-738 | HRM重构  提供H5打卡接口 |
| RP-740 | 【HRM重构】推送打卡数据到Paylocity |
| RP-741 | 【HRM重构】拉取Paylocity打卡数据。 |
| RP-742 | 【HRM重构】考勤规则配置。 |
| RP-748 | HRM重构 提供打卡考勤事件 |
| RP-749 | HRM重构  提供打卡缺卡记录补充逻辑 定时任务触发 |
| RP-752 | 添加hr admin管理模块 |
| RP-724 | HRM Core Front |
| RP-730 | HRM重构 企微人员快照数据同步到业务人员表 |
| RP-739 | HRM重构 增加admin人员以及hr人员维护接口 |
| RP-743 | 【HRM重构】考勤变更记录查询。 |
| RP-744 | 【HRM重构】考勤报告 |
| RP-751 | HRM重构  提供web端打卡列表接口 |
| RP-754 | 打卡UI搭建 |
| RP-771 | HRM打卡二期  打卡定时任务逻辑 处理迟到早退缺卡等情况 |
| RP-772 | HRM打卡二期  打卡事件 用于处理历史打卡数据更新 |
| RP-770 | HRM打卡二期 人员打卡分页page接口 |
| RP-756 | 【HRM】移动端打卡记录考勤异常审批相关功能 |
| RP-759 | 切换企业查询数据，添加hr逻辑调整 |
| RP-760 | People core 跟进测试 |
| RP-765 | HRM打卡二期 仓库facility数据同步 增量全量 |
| RP-766 | HRM打卡二期 仓库facility数据配置 接口 |
| RP-767 | HRM打卡二期 打卡接口 |
| RP-757 | 打卡联调 |
| RP-764 | HRM打卡二期迭代-front |
| RP-781 | 【HRM】打卡二期异常考勤审批系统设计 |
| RP-782 | 【HRM】打卡二期异常考勤审批开发 |
| RP-784 | Onboarding 基础数据相关接口迁移改造 |
| RP-780 | Onboarding 打印工卡流程task相关接口 |
| RP-778 | HRM打卡迭代二期：拉取Paylocity打卡数据本地合并 |
| RP-777 | HRM打卡迭代二期：推送打卡数据到Paylocity |
| RP-776 | HRM打卡迭代二期:考勤报告模块 |
| RP-775 | HRM打卡二期: 考勤规则配置 |
| RP-779 | Onboarding：开通Paylocity账号任务 |
| RP-789 | onboarding基础数据流程针对core person修改 |
| RP-787 | 添加创建工牌的新任务 |
| RP-786 | 添加同步paylocity的新任务 |
| RP-788 | 添加创建document reader 组件 |
| RP-790 | Onboarding 开通iam账号 账号冲突自动重试逻辑 |
| RP-791 | 【HRM】新版 onboarding 入职流程功能开发 |
| RP-792 | 【HRM】新版 onboarding 员工 pending flow 页面功能开发 |
| RP-794 | 【HRM】新版 HRM 整体联调回归问题修复及上线准备 |
| RP-774 | Onboarding 流程iam账号开通发送短信事件逻辑 |
| RP-793 | 【HRM】打卡功能联调及问题修复 |
| RP-795 | 【HRM】打卡功能联调及问题修复 定时任务逻辑重构 |
| RP-809 | 员工扫二维码无法登录 |
| RP-808 | L2S-3506 Paylocity not showing correct time from punch  |
| RP-799 | HRM整体上线并回归修复问题 |
| RP-798 | HRM打卡二期迭代-联调自测 |
| RP-823 | Agency Talent Pool 支持显示工牌及打印 |
| RP-824 | 工牌信息回流 Agency 人才池，支持查看打印 |
| RP-822 | Agency Portal 增加Badge  Print能力 - checkin携带头像信息 confirm工牌task发布事件 |
| RP-820 | Agency Portal 增加Badge  Print能力 - 人才池的添加 编辑增加头像上传 |
| RP-769 | 【HRM】onboarding + Pending Flow |
| RP-763 | HRM打卡迭代二期 |
| RP-768 | 【HRM】[PRD-Onboarding Enhance]Onboarding 优化以适配 Agency 流程 |
| RP-797 | agency onboarding 整体联调自测 |
| RP-796 | onboarding 整体联调自测 |
| RP-814 | Agency company数据同步更新 |
| RP-807 | 处理用户反馈的paylocity问题和扫码问题 |
| RP-819 | Paylocity创建新员工同步IAM账号逻辑更新 |
| RP-815 | Requisition中address信息自动产生 |
| RP-816 | Requisition发布交互优化 |
| RP-818 | Agency增加loaction的筛选项 |

---

## AIAG（22 项已完成）

### Feature（14）

| Key | 标题 |
|-----|------|
| AIAG-2622 | MCP和浏览器集成OPEN CLAW |
| AIAG-2913 | FACTORY CLAUDE的支持 |
| AIAG-2916 | FACTORY CLAUDE的速度优化 |
| AIAG-2910 | FACTORY 多AGENT的RUN支持 |
| AIAG-2909 | FACTORY  单AGENT的RUN支持 |
| AIAG-2907 | FACTORY  增加 FIX AGENT 支持分析 |
| AIAG-2906 | FACTORY RUNTIME 增加会话恢复 |
| AIAG-2900 | FACTORY IDE BUILDE 试验创建agent方案 |
| AIAG-2892 | factory尝试搭建 |
| AIAG-2891 | factory调研 |
| AIAG-2890 | factory方案研究 |
| AIAG-2895 | factory联调 |
| AIAG-2896 | factory上线 |
| AIAG-2897 | factory优化 |

### Improvement（8）

| Key | 标题 |
|-----|------|
| AIAG-166 | Report RPA - update |
| AIAG-637 | Report RPA-Nationwide （WISE 3.0 Support ） |
| AIAG-2854 | 个人助手clawx功能分析 |
| AIAG-2206 | 【AI Personal Assistant】翻译优化：抽取邮件文字，按句并行翻译，而不是整体翻译（只针对邮件原文） |
| AIAG-2859 | 标注平台线上环境问题修复及验证 |
| AIAG-2838 | DEV环境流程跑通测试 |
| AIAG-2844 | 标注平台线上环境功能验证 |
| AIAG-2840 | 标注前端推荐问题优化 |

---

