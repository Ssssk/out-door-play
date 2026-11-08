# 影响分析

以 2026-11-08 当前工作树代码为事实基线；Wiki 为早期基线，与代码冲突处以代码为准（`01-clarification.md` 已登记）。

| 区域 | 是否影响 | 当前事实 | 拟议变化 | 风险 | 验证 |
|---|---|---|---|---|---|
| uni-app 页面/分包 | 是 | `pages/index/index.vue:12` 与 `pages/favorites/index.vue:5` 复用 `SceneTabs.vue`；`pages.json` 首页启用下拉刷新 | 两页接入配置 composable、`onShow` 刷新配置、选中态校正；不改页面路径与分包 | 组件吸顶容器依赖布局，删掉会塌陷 | 目标端人工 + H5/MP 双端构建；`AC-CFG-002`、`AC-CFG-007`、`AC-CFG-018` |
| Vue 组件/Pinia | 是 | `SceneTabs.vue:14` 硬编码 `tabs`；`scene` 不在 Pinia，只在 composable / 页面 `ref` / `types/domain.ts` | `SceneTabs.vue` 改为接收 `tabs` prop；新增 `useSceneTabs.ts` composable（进程内上次成功值 + 兜底）；新增配置类型；不引入新 Pinia store | props 变更影响两个调用页；小程序端属性名需 camelCase 透传 | 组件测试 + TypeScript 类型检查；`AC-CFG-001`、`AC-CFG-011` |
| HTTP API | 是 | 公开 `GET /v1/config/qrcodes`；管理端 `GET/PUT /v1/admin/config/qrcodes`；`GET /v1/routes`、`GET /v1/user/favorites` 按 scene 过滤 | 新增 `GET /v1/config/scene-tabs`、`GET/PUT /v1/admin/config/scene-tabs`；列表与收藏查询增加隐藏场景过滤；详情接口不变 | 新契约未登记会被 `test:contract` 漏检；响应结构变化会破坏旧客户端 | 契约测试 + 集成测试；`AC-CFG-003`、`AC-CFG-017` |
| NestJS 模块 | 是 | `modules/config` 仅一个 `ConfigController`；`modules/routes`、`modules/user`、`modules/admin` 各自处理 scene | `modules/config` 增加配置读取/校验服务（供公开与列表用例复用）；`admin` 增加 GET/PUT；`routes`/`user` 用例层调用过滤 | 用例层重复读取配置导致 N 次 DB 查询；Controller 承载业务规则 | 单元/集成测试 + 分层评审；`FR-CFG-003`、`NFR-PERF-001` |
| MySQL/迁移 | 是（仅数据） | `system_configs(key, value Json, updated_at)` 已存在，无新字段 | 复用既有表，新增 `key = scene_tabs`；首次保存时 `upsert`，未配置时读取端兜底；零 schema 迁移、零回填 | 配置 JSON 损坏或 0 个启用项 | 集成测试故障注入；`AC-CFG-009`、`AC-CFG-010` |
| Redis | 否 | 未接入（ADR-006）；`common/listCache.ts` 是客户端本地缓存，不是 Redis | 不引入；服务端按主键直读，不做进程内缓存 | 多实例进程内缓存无法在保存时失效，已按 DEC-008 排除 | 设计评审 + `NFR-PERF-001` 压测 |
| RabbitMQ | 否 | 未接入 | 不引入事件；配置变更靠 `onShow` 拉取生效 | 无实时推送，接受「下次进入生效」口径 | 产品 UAT 确认；`FR-CFG-008` |
| 权限/隐私 | 是 | `config:read` / `config:write` 已存在；`admin-auth.guard.ts:36` 服务端校验；管理端 Cookie + CSRF | 新接口沿用既有权限码与 Guard，不新增权限码；公开接口无鉴权且只返回启用项 | 仅隐藏前端按钮构成伪安全；公开接口泄漏内部备注 | 集成测试越权用例 + 安全评审；`AC-CFG-012`、`NFR-SEC-001` |
| 监控/部署 | 是 | 现有 Nest 日志含 requestId/traceId；服务器 `Deploy production` 只更新 API/数据 | 增加四类配置事件日志；发布顺序 API → 后台 → 小程序审核发布 | 小程序包不可瞬时回滚；服务器部署不会让 C 端看到新分类 | 日志断言 + 发布检查单；`AC-CFG-016`、`AC-CFG-019` |
| 旧客户端/消费者 | 是 | 旧包不请求配置接口；首页只显示 `drive`；`GET /v1/routes` 与收藏接口现有调用方未改变 | 默认配置与现状一致；公开响应 additive；隐藏场景列表返回空数组而非错误 | 旧包+新服 / 新包+旧服 的兼容窗口 | 四组合矩阵；`NFR-COMPAT-001`、`AC-CFG-016` |
| UI/UX、文案、可访问性 | 是 | `SceneTabs.vue:2-4` 已有 `role`/`aria-selected`；`CitiesView.vue:103,156` 文案误导 | 新增后台配置页（表格 + 启停 + 排序 + 保存态）；修正城市页文案；保留 a11y 属性与 70rpx 触控高度 | 后台表单状态不完整（loading/empty/error/脏数据）；提示语义误导 | 后台 E2E + UI/UX 评审 + 可访问性检查；`AC-CFG-015`、`AC-CFG-018` |
| 产品 UAT、目标端可获得性 | 是 | 微信小程序需体验版/真机；H5 与小程序为两套构建 | UAT 在小程序体验版与后台分别验收；H5 构建不得失败 | 审核周期、体验版二维码、真机环境不可用 | UAT 记录；`AC-CFG-002`、`AC-CFG-018` |
| CI、依赖、SBOM、供应链 | 是（最小） | `contractPaths` 为硬编码白名单；无新增第三方依赖 | 实现阶段登记 `../../.harness/changes/home-category-visibility/contracts/openapi.yaml`；不新增依赖 | 契约登记遗漏导致假通过 | `pnpm test:contract` 输出证据；`AC-CFG-017` |
| SLO、容量、告警、Runbook | 是 | 无独立 APM；`operations/slo.yaml` 为模板占位 | 定义公开配置读 SLI/SLO 与配置误配的止损 Runbook（恢复默认） | 生产观测能力不足时阈值无法直接取证 | Operations Gate 显式裁决；`AC-CFG-019` |
| 备份恢复、灾备、Incident | 是（轻量） | `system_configs` 随数据库备份；配置可由后台一键恢复默认 | 无 schema 变更；配置误配通过「恢复默认」前向修复，不执行数据库回滚 | 误下线分类影响首页可用性 | 恢复演练记录 + 回滚计划 |
| 测试回归核心链路 | 是 | 已有 `useDiscovery.spec.ts`、`DiscoveryCard.component.spec.ts`、API e2e 与集成测试 | 增加配置读取/过滤/并发/兼容用例；回归首页列表、收藏、详情、分享、城市管理 | 改动 `SceneTabs.vue` props 导致既有组件测试失败 | 全量单元测试 + 回归清单 |
