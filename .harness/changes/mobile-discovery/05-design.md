# 技术设计

> 2026-09-05：用户在收到推荐口径后要求继续开发并在改完后运行项目；按该指令进入增量实现。独立验证、安全、UAT 和发布 Gate 不随之自动通过。

## 目标与非目标

- 目标：冻结城市、公开列表、路线/钓点详情契约；修复排序、字段、竞态与状态缺口。
- 非目标：schema 变更、真实定位/地图 SDK、油价供应商、后台内容写入、Redis/MQ。

## 当前流程

`index.vue -> useDiscovery -> outdoorApi -> RoutesController/Service -> Prisma`；BrandHeader 直接读本地城市，Controller/Service 返回 Prisma 完整 record。

## 目标架构与数据流

`page -> useDiscovery(use case state) -> outdoorApi -> API DTO/Presenter -> DiscoveryQueryService -> Repository port -> Prisma adapter -> MySQL`。城市走相同查询边界；fallback 只在客户端显式降级分支使用。

## 业务不变量和状态转换

- 只公开 enabled city 与 online Discovery；route/spot endpoint scene 隔离。
- Top N 按 `rank asc, distanceKm asc, id asc`；limit 1..20。
- 页面状态 `initializing -> loading -> content|empty|fallback|error`；city/scene 变化 latest-wins，旧响应不可覆盖。

## 成功、失败、超时、重复与补偿时序

- 每次 load 分配序号并捕获 city/scene；最终只提交最新序号结果。
- 首次失败使用对应 scene fallback 并显示离线推荐提示；已有成功内容刷新失败时保留内容并显示可重试错误。
- 不自动重试；GET 由用户重试。页面卸载只通过 latest-wins/active 标志阻止回写。

## 前端设计

- 页面与分包：不新增页面；首页组合城市、场景、列表状态，详情保持现有路由。
- 组件与状态：BrandHeader 接收 cities/loading/fallback 并发出选择；DiscoveryCard 使用 scene-specific 指标；Pinia 只保存最近城市。
- API 与错误处理：`outdoorApi` 映射稳定 Presenter；`ApiError` 映射 404/422/网络；fallback 带 UI 标识。
- 跨端兼容：使用 uni API/Wot popup；H5 键盘增强通过 `tabindex`/keydown，微信触控单独验收。

## 后端设计

- 模块与分层：Controller/DTO/Presenter；DiscoveryQueryService；repository token/port；Prisma adapter。
- 用例与领域规则：查询服务校验公开可见性并映射 Presenter；Repository 只选择允许字段。
- 事务与并发：只读，无事务；稳定排序与 take 防无界查询。

## API、数据、Redis、RabbitMQ

- 兼容现有 `/v1/cities`、`/v1/routes`、`/v1/routes/{id}`、`/v1/spots/{id}`；新增 operationId 和明确 schema。
- 无 migration；`depthM` 是现有可空列，只对 fish Presenter 暴露。Redis/RabbitMQ not-required。

## 安全与隐私

公开只读，无认证；运行时校验 query/path；Presenter 不返回 status/rankWeight/impressions/clicks/关联或审计字段；不采集位置和 PII。

## UI/UX、文案、目标端与可访问性

城市使用内联抽屉；“距你”改“参考”；空/错误/fallback 有文字和重试；H5 卡片支持 Enter/Space；目标端 H5+微信。

## 性能、容量、SLI/SLO 与错误预算

请求最大 20 条；不采用未定义环境的 200ms 作为通过标准。生产 SLO/容量仍由 Operations Owner 决定。

## 可观测性

沿用 traceId/稳定错误码；不新增高基数标签。E2E 记录请求路径、状态和页面结果。

## 备份恢复、RPO/RTO 与 Incident 响应

无数据写或 schema 变化；应用回滚恢复旧查询/UI。生产全局 RPO/RTO 不在本 Change 内批准。

## 应用 CI、供应链、SBOM 与制品

执行 active 总门禁；Vite 既有 2 high 保持 fail-closed，不新增运行时依赖。

## 发布、迁移和回滚

先部署兼容 API，再发布客户端；回滚客户端与 API 均无需数据回滚。未完成 Security/UAT/Release Gate 不发布。

## 备选方案与决策

| 方案 | 优点 | 缺点 | 风险 | 结论 |
|---|---|---|---|---|
| A 服务端真相 + 显式 fallback | 数据可运营，故障可浏览 | 需清楚标识陈旧数据 | 用户误认实时 | 采用 |
| B 仅服务端，失败空白 | 真相单一 | 弱网不可用 | 体验差 | 不采用 |
| C 合并 server/mock | 内容看似丰富 | 无法判断来源/下线 | 错误与合规 | 禁止 |

## 未决问题

真实定位、品牌地图和生产 SLO 延期到供应商/Operations Change；不阻塞本地只读 discovery 实现，但阻塞相关发布承诺。

