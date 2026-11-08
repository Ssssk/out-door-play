# CHG-HOME-CATEGORY-001 home-category-visibility：原始请求

## 来源

- 提出人：项目 Owner（用户在会话中提出）
- 日期：2026-11-08
- 关联工单/链接：无外部工单；来源为本会话文字与用户提供的两张截图（首页分类目录截图、运营后台「系统配置」截图）
- `source-baseline.json` 来源 ID：`SRC-001`（首页截图 +「就是这个需求」）、`SRC-002`（后台截图 +「在这个后台tab 进行模块设计」）、`SRC-003`（代码事实基线）、`SRC-004`（此前方案讨论已定口径）
- 原始版本/哈希：两张截图为会话内嵌图片，未落盘，`sha256: null`、`version: unversioned`；代码事实以 2026-11-08 当前工作树文件为准（`git status --short` 显示仅本 Change 目录为新增未跟踪文件）

## 业务目标

让运营在运营管理后台「系统配置」模块内配置小程序首页的**内部分类目录**（场景胶囊：当前仅「粗门溜车」，`fish` 在代码中被注释关闭）的显示/隐藏、显示名称与排序，不再需要通过改代码、重新构建小程序、提交审核发版来调整分类。

受影响用户：

- 运营人员：无需研发介入即可开关分类、调整文案与顺序。
- C 端用户：看到的首页分类与运营配置一致；已分享出去的路线/钓点详情链接仍可打开。
- 研发与测试：分类从「编译期常量」变为「运行时配置」，需要同时保证服务端列表过滤、客户端缓存与预取一致。

预期业务结果：分类调整生效周期从「一次小程序发版」缩短为「后台保存 + 用户下次进入首页」；上线默认配置不改变当前 C 端可见内容。

## 当前现状与证据

| 现状 | 证据（路径为仓库相对路径） |
|---|---|
| 分类目录是编译期硬编码数组 | `apps/mobile/src/components/SceneTabs.vue:12-14`：`const tabs = [{ id: 'drive', label: '粗门溜车' }]`，注释写明「钓鱼场景暂不开放，先只保留粗门溜车」 |
| 组件同时被首页与收藏页复用，删掉会破坏吸顶布局 | `apps/mobile/src/pages/index/index.vue:12`、`apps/mobile/src/pages/favorites/index.vue:5`；`SceneTabs.vue:27` 的 sticky 容器承担头部与列表间距 |
| 场景枚举只有 `drive` / `fish`，不在 Pinia | `apps/mobile/src/types/domain.ts:1`、`apps/api/prisma/schema.prisma:10-13`、`apps/api/src/modules/routes/routes.dto.ts:6` |
| 首页 `onShow` 只刷新列表，不刷新配置；预取硬编码另一场景 | `apps/mobile/src/pages/index/useDiscovery.ts:181-200`（`prefetch` 写死 `drive`/`fish` 互取）、`:208-218`（`onShow → refreshIfStale`） |
| `City.scenes` 字段存在但公开列表/详情查询从不读取 | `apps/api/prisma/schema.prisma:80`；`apps/api/src/modules/routes/prisma-discovery.repository.ts:75-99` 的 `where` 不含 `city.scenes` |
| 后台存在误导文案，声称关闭城市场景会影响首页 tab | `apps/admin/src/views/CitiesView.vue:103`、`:156`；`apps/api/src/modules/admin/admin.service.ts:344` 注释 |
| 已有可复用的运营配置能力 | `apps/api/prisma/schema.prisma:437-444`（`SystemConfig{key,value Json,updatedAt}`）；`apps/api/src/modules/config/config.controller.ts:18-29`（公开 `GET /v1/config/qrcodes`）；`apps/api/src/modules/admin/admin.controller.ts:49-50`（管理端 GET/PUT + `config:read`/`config:write`） |
| 后台「系统配置」分组目前只有一个菜单项 | `apps/admin/src/router/index.ts:23`、`apps/admin/src/layout/AdminLayout.vue:20-22`、`apps/admin/src/views/QrConfigView.vue`（`PageHeader` + `apiGet/apiPut` + `canWrite` 范式） |
| 新契约必须显式登记才会被契约测试检查 | `apps/api/src/scripts/verify-openapi-contract.ts:15-20` 的 `contractPaths` 为硬编码白名单，当前 4 项不含本 Change |

## 初始范围

- 包含：
  - 首页内部分类目录的显隐、显示名称、排序由后台配置驱动（配置落在既有 `SystemConfig`，键 `scene_tabs`）。
  - 运营管理后台「系统配置」分组下新增「首页分类目录」模块（页面 + 菜单 + 路由 + 权限沿用 `config:read` / `config:write`）。
  - 公开只读配置接口、管理端读写接口、稳定错误码与并发控制。
  - 小程序端消费配置：首页、收藏页、预取与列表缓存收口；配置失败回退到内置默认。
  - 服务端按配置拒绝对隐藏场景的列表/收藏查询，但保留详情与分享直达。
  - 修正后台 `City.scenes` 相关误导文案与后端注释。
- 不包含：
  - 底部 `tabBar` 的显隐、名称、图标与顺序（另一个独立能力，见 `apps/mobile/src/pages.json`）。
  - `City.scenes` 城市级分类覆盖（二期，DEC-008）。
  - 后台自行新增 `drive`/`fish` 之外的业务场景（一期仅允许配置已知枚举，DEC-004）。
  - 分类配置的版本历史、审批流、定时发布、灰度到指定人群。
  - Redis / RabbitMQ / 新表 / Prisma Migration（ADR-006：无批准用例不引入）。
  - 详情页按分类二次鉴权、已收藏内容的数据清理或迁移。

## 约束与风险

- 目标平台：微信小程序（主目标端，需真机/体验版证据）、uni-app 同时编译 H5（不得因条件编译缺失导致 H5 构建失败）；运营管理后台为 Web（Vue 3 + Element Plus）。
- 兼容约束：默认配置必须与上线前可见行为一致（仅 `drive`「粗门溜车」显示），保证「新服务端 + 旧小程序包」「旧服务端 + 新小程序包」滚动期无可见差异。
- 发布约束：小程序端代码变更必须重新构建、上传、提交微信审核并发布；服务器 `Deploy production` 只更新 API/数据，不改变用户手机端已安装包。
- 数据约束：复用 `system_configs` 既有表与 `Json` 字段，零 schema 迁移；未写入配置记录时读取端必须兜底。
- 权限约束：管理端写入复用 `config:write`，读取复用 `config:read`；公开接口无鉴权但只返回启用分类，不暴露内部标识与运营备注。
- 主要风险：只隐藏客户端 tab 而不做服务端过滤会构成伪安全（KB-INBOX-006 提示的兼容性误判）；隐藏场景的数据可能从 `listCache` / `prefetch` 复活；并发保存互相覆盖；配置错误导致 0 个启用分类。

## 成功信号

- 运营在后台关闭某分类并保存后，小程序端下次进入首页不再显示该分类；重新打开后恢复。
- 隐藏分类的 `GET /v1/routes?scene=<hidden>` 与收藏列表查询返回空数据（成功响应、空列表），而 `GET /v1/routes/:id`、`GET /v1/spots/:id` 与分享直达仍返回 200。
- 后台保存后无需小程序发版即可改变分类；上线默认状态下首页可见分类与上线前一致。
- 无 `config:write` 的后台账号只能查看，不能保存；并发保存产生明确冲突提示而非静默覆盖。
- `pnpm test:contract` 覆盖本 Change 的 3 个新增接口（契约已登记进 `contractPaths`）。

## Change 分类与强度

- 类型：`feature`
- 风险：`medium`（涉及公开接口、跨模块行为与 C 端可见性，但零 schema 变更、默认配置保持现状）
- 是否需要 UAT、性能、安全供应链、Operations Gate：
  - UAT：需要（产品需在小程序体验版与后台分别验收）。
  - 性能：需要轻量验证（公开配置读为单行主键查询，P95 目标见 `NFR-PERF-001`）。
  - 安全供应链：需要（新增管理端写接口与输入校验；无新增依赖，按 `not-required` 之外的最小评审执行）。
  - Operations Gate：需要（配置错误时的止损方式、回滚按钮与观察窗口）。
