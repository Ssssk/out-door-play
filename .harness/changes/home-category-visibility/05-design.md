# 技术设计

> 需求 Gate 与设计 Gate 已于 2026-11-08T07:11:04Z 由用户回复「确认」批准，Q-001 ~ Q-004 已关闭，记录见 `approvals/2026-11-08-requirements-design.md`。本设计已进入实现阶段；Implementation、Verification、Security、UAT、Operations、Release、Completion Gate 仍为 `pending`，不得提前宣称通过。

## 目标与非目标

目标（逐项引用需求）：把首页分类目录从编译期常量改为运行时配置（`FR-CFG-001`），在后台「系统配置」分组提供配置模块（`FR-CFG-002`），服务端拒绝隐藏场景列表但保留详情（`FR-CFG-003`、`FR-CFG-005`），保证白名单、兜底、并发、权限与兼容（`FR-CFG-006` ~ `FR-CFG-011`、`NFR-*`）。

非目标：底部 `tabBar`、城市级覆盖、新增业务场景、Redis/RabbitMQ/新表/Migration、配置审批流与实时推送（见 `02-requirements.md` 非目标）。

设计驱动因素：① 零 schema 迁移；② 默认配置与上线前可见行为完全一致；③ 服务端才是显隐的强制点（`.harness/wiki/09-认证与权限模型.md:21`）；④ 小程序包不能瞬时回滚，服务端先行；⑤ 后台改造遵循最小改动原则。

## 当前流程

1. 小程序首页 `onShow` → `useDiscovery.refreshIfStale()`（30s 节流）→ `outdoorApi.routes(city, scene)` → `GET /v1/routes?city&scene&limit`。
2. `SceneTabs.vue` 用编译期数组 `[{ id:'drive', label:'粗门溜车' }]` 渲染；点击后 `changeScene()` → `loadRoutes()`；`prefetch()` 硬编码预取「另一场景」与 `availableCities` 的当前场景。
3. 服务端 `RoutesController.list` → `RoutesService.list` → `PrismaDiscoveryRepository.list` 按 `scene + status:'online' + city.enabled` 过滤，**从不读取** `City.scenes`。
4. 后台 `CitiesView.vue` 可写 `City.scenes`，但文案声称会影响首页 tab，实际无效。
5. 已有运营配置链路：`SystemConfig(key='qrcodes')` → 公开 `GET /v1/config/qrcodes` → 小程序 `mine` 页 `onShow` 拉取；管理端 `GET/PUT /v1/admin/config/qrcodes`（`config:read` / `config:write`）。

## 目标架构与数据流

```text
[运营] → 管理后台 SceneTabsConfigView.vue
       → PUT /v1/admin/config/scene-tabs (config:write, expectedUpdatedAt)
       → AdminController → AdminService.updateSceneTabs()
       → MySQL system_configs(key='scene_tabs', value Json, updated_at)

[小程序首页/收藏页 onShow]
       → useSceneTabs.refresh() → GET /v1/config/scene-tabs
       → ConfigController.getPublicSceneTabs() → SceneTabsConfigService.publicView()
       → MySQL system_configs 单行主键读（无缓存、字段级兜底）
       → 返回仅启用项 + revision/updatedAt
       → SceneTabs.vue props.tabs；useDiscovery 校正 scene / 裁剪 prefetch / 隔离 listCacheKey

[列表请求] GET /v1/routes?scene=fish
       → RoutesController.list → RoutesService.list
       → SceneTabsConfigService.enabledScenes()（同一次请求内只读一次）
       → scene 不在启用集合 → 直接返回 []（不查 Discovery 表）
       → 否则走既有 PrismaDiscoveryRepository.list

[详情请求] GET /v1/routes/:id、GET /v1/spots/:id
       → 完全不经过 SceneTabsConfigService（保持 FR-CFG-005）
```

关键取舍：配置读取**不做服务端缓存**（DEC-008）。原因：保存发生在 Admin 进程，若 API 进程各自缓存则无法失效；单行主键查询成本可忽略（`NFR-PERF-001` 用压测验证）。小程序端才保留「上次成功配置」进程内副本，仅用于故障兜底，不用于绕过服务端过滤。

## 业务不变量和状态转换

| 不变量 | 强制点 |
|---|---|
| `scene ∈ {drive, fish}` | 管理端 DTO `@IsIn` + `SceneTabsConfigService` 二次校验 + Prisma `enum Scene` |
| 配置中 `scene` 不重复、`label` 去空白后 1-12、`sort` 为 0-9999 整数 | `UpdateSceneTabsDto` 运行时校验（嵌套 `ValidateNested` + `@Type`）+ 服务端用例 |
| 至少 1 个 `enabled = true` | 管理端 PUT 校验 + 公开读取损坏配置兜底（`FR-CFG-007`） |
| 隐藏场景不出现在任何列表响应 | `RoutesService.list` / `UserService.favorites` 用例层过滤，不依赖客户端 |
| 详情与分享永不因分类显隐被拒 | 详情用例不引用配置服务，回归测试断言 |
| `revision` 单调递增、并发写不静默覆盖 | `updateMany` 条件更新（见下） |

状态转换：`未配置`（读取端返回 DEFAULT）→ `已配置(revision=N)` →（成功保存）`已配置(revision=N+1)`；非法保存与并发冲突均保持原状态；配置 JSON 损坏时读取时临时降级为 DEFAULT，但不改写数据库，运营可在后台重新保存修复。

## 成功、失败、超时、重复与补偿时序

- **成功保存**：`PUT` → Guard 授权 → DTO 校验 → 服务端业务校验 → `updateMany({ where: { key, updatedAt: expectedUpdatedAt }, data: { value: {...items, revision: N+1} } })` → `count === 1` → 返回新 `updatedAt`/`revision` → 前端更新表单 token、清除 dirty、提示「下次进入首页生效」。
- **并发冲突**：两个请求带同一 `expectedUpdatedAt`，先提交者把 `updated_at` 推新，后提交者 `count === 0` → 409 `CONFIG_VERSION_CONFLICT` → 前端 `ElMessage` 提示并自动 `load()` 重拉。不使用 `findUnique` 后直接 `upsert`（会 last-write-wins 覆盖）。
- **首次保存（无记录）**：走 `create`，`key` 唯一约束冲突时按 409 处理；避免 `upsert` 丢失条件检查。
- **重复提交**：前端 `saving` 期间禁用按钮；服务端即使收到两次相同 token，也只有第一次 `count === 1`。
- **读取失败/损坏/超时**：`SceneTabsConfigService` 捕获解析异常 → 记录 `scene_tabs_config_invalid` 日志 → 返回 DEFAULT；公开接口仍 200，不把内部异常透给 C 端。
- **小程序配置请求失败**：`useSceneTabs` 返回 `cached ?? DEFAULT`，`onShow` 继续走既有列表刷新；无阻断弹窗、无空吸顶条。
- **部分成功补偿**：本 Change 无跨服务副作用、无外部写入、无消息投递，不需要 Outbox 或补偿事务；配置误配的止损是后台「恢复默认」（前向修复）。

## 前端设计

### 后台「系统配置」模块（本次用户重点）

采用**方案 B：在「系统配置」分组下新增独立菜单项与路由**（DEC-006），不改动已上线的 `QrConfigView.vue`：

| 文件 | 变化 |
|---|---|
| `apps/admin/src/router/index.ts` | children 新增 `{ path: 'system-config/scene-tabs', name: 'SceneTabsConfig', component: () => import('../views/SceneTabsConfigView.vue'), meta: { title: '首页分类目录', group: '系统配置', permission: 'config:read' } }`；沿用现有 `beforeEach` 的 `auth.hasPermission` 校验 |
| `apps/admin/src/layout/AdminLayout.vue` | `allMenus` 的「系统配置」组新增 `{ path: '/system-config/scene-tabs', label: '首页分类目录', icon: <复用已引入图标>, permission: 'config:read' }`；保留原「上传二维码」项不改文案 |
| `apps/admin/src/views/SceneTabsConfigView.vue` | 新增页面，复制 `QrConfigView.vue` 的 `PageHeader + apiGet/apiPut + canWrite + loading/saving/dirty + reset` 结构 |
| `apps/admin/src/types/admin.ts` | 新增 `SceneTabItem` / `SceneTabsConfig` 类型 |
| `apps/admin/src/views/CitiesView.vue` | 仅改 `:103`、`:156` 两处文案（`FR-CFG-010`），不动表单与请求 |

页面结构：

- `PageHeader title="首页分类目录" group="系统配置" description="配置首页场景分类的显示、名称与排序；保存后小程序端下次进入首页生效"`，右上角放「恢复默认」与「保存」按钮（`v-if="canWrite"`）。
- 主体 `el-table`：列依次为「排序」（`el-input-number` 整数 0-9999 或上移/下移按钮）、「场景」（只读 `el-tag` 展示 `drive`/`fish`，附中文说明，不可编辑）、「显示名称」（`el-input` maxlength 12）、「启用」（`el-switch`）、「说明」（静态提示：隐藏后列表不再返回，但已分享详情仍可打开）。
- 顶部信息条：`当前版本 revision` + `最近更新 updatedAt`（ISO 8601 UTC 展示为本地时间），以及 dirty 提示。
- 状态覆盖：loading（`v-loading`）、error（错误态 + 重试按钮）、empty（理论上不出现 0 行；出现时展示「配置缺失，点击恢复默认」）、只读权限（所有输入禁用、按钮隐藏）、弱网（请求超时由 `api/client.ts` 统一提示）、重复提交（按钮禁用）、卸载竞态（离开页面不写回状态）。
- 校验前置：保存前本地检查「至少一个启用」「名称非空」「scene 未重复」；服务端再次校验，返回 422 时逐项提示。
- 「恢复默认」是破坏性操作：二次确认弹窗 → 提交 DEFAULT 配置（仍走 `expectedUpdatedAt`），成功后刷新。
- 图标复用 `@element-plus/icons-vue` 中项目已引入的图标，不新增依赖。

### 小程序端

- `apps/mobile/src/api/outdoor.ts` 新增 `sceneTabs()` → `GET /config/scene-tabs`；`apps/mobile/src/types/domain.ts` 新增 `SceneTabView` / `SceneTabsConfigView`。
- 新增 composable `apps/mobile/src/pages/index/useSceneTabs.ts`（收藏页复用同一模块）：模块级 `cached` + `inflight` 去重 + `active` 标志；`refresh()` 失败返回 `cached ?? DEFAULT_SCENE_TABS`；不引入 Pinia store。
- `apps/mobile/src/components/SceneTabs.vue`：`tabs` 由 prop 传入（`SceneTabView[]`），删除硬编码数组；保留 `<view class="scene-tabs">` 容器（吸顶布局依赖）、`role`/`aria-selected`、300ms 点击节流与全部现有样式。
- `apps/mobile/src/pages/index/useDiscovery.ts`：默认 `scene` 保持 `drive`；配置到达后 `ensureSceneVisible()` 把当前选中校正为首个启用项；`listCacheKey` 追加 `:${revision}`；`prefetch()` 目标改为按启用分类枚举（不再硬编码 `drive`/`fish` 互取）；`onShow` 先 `await sceneTabs.refresh()` 再执行既有 `refreshIfStale()`，配置失败不阻断后者。
- `apps/mobile/src/pages/favorites/index.vue`：接入同一 composable，配置到达后校正 `scene` 并重新 `load()`。
- **明确不改**：两个详情页 `onLoad` / `onShareAppMessage`、`pages/index/index.vue:63-64` 的详情分流逻辑、本地 `data/mock.ts` 兜底、`pages.json`。
- 跨端：`/config/*` 为普通 HTTP 请求，不需要条件编译；H5 与微信小程序共用同一实现，双端构建都必须通过。

## 后端设计

- 分层：`modules/config` 新增 `SceneTabsConfigService`（Application 层用例 + 领域规则：校验、白名单、兜底、投影），`ConfigController` 只新增一个只读方法；`modules/admin` 的 `AdminController` 新增 GET/PUT，`AdminService` 调用同一服务；`modules/routes` / `modules/user` 的 Service 调用 `enabledScenes()`；Domain 逻辑不依赖 Prisma/NestJS 装饰器。
- `PrismaService` 继续由 Infrastructure 层持有；不直接把 `SystemConfig` 实体作为响应返回，统一用 Presenter 投影（`publicView` 不含 `enabled=false` 项与内部备注）。
- 用例输入输出：
  - `publicView(): { revision, updatedAt, items: [{scene,label,sort}] }`
  - `adminView(): { revision, updatedAt, items: [{scene,label,enabled,sort}] }`
  - `update(input, expectedUpdatedAt, actor): adminView`
  - `enabledScenes(): Set<'drive'|'fish'>`
- 事务与并发：单个 `updateMany` 条件更新即为原子边界；不在事务内等待任何外部 HTTP / Redis / MQ（本 Change 也没有这些调用）。无 N+1：列表用例一次请求内只读取一次配置。
- `DEFAULT_SCENE_TABS` 常量只定义在后端一处，小程序端另有一份等价的兜底常量（用于「新包 + 老服务端」）；两者由 `AC-CFG-001`、`AC-CFG-016` 断言一致。

## API、数据、Redis、RabbitMQ

- 新增契约见 `contracts/openapi.yaml`：
  - `GET /v1/config/scene-tabs` → `getPublicSceneTabs`（公开、`security: []`、只返回启用项）
  - `GET /v1/admin/config/scene-tabs` → `getAdminSceneTabs`（`config:read`）
  - `PUT /v1/admin/config/scene-tabs` → `updateAdminSceneTabs`（`config:write`）
- 请求体区分：`items` 为空数组 / 缺失 → 422；`label` 空串与 null → 422；`expectedUpdatedAt` 缺失 → 422。
- 错误码见 `contracts/error-codes.yaml`：`COMMON_VALIDATION_FAILED`(422)、`CONFIG_INVALID`(422)、`CONFIG_VERSION_CONFLICT`(409)；403 沿用现有 `admin-auth` Guard 的稳定错误码，不新增错误码定义。
- 兼容分类：`additive`（新增 3 个接口）+ 既有列表接口**响应收窄**（隐藏场景返回空数组）；收窄只在运营主动隐藏后发生，默认配置下无变化，因此不需要版本号升级（`NFR-COMPAT-001`）。
- 数据：`system_configs` 既有表，键 `scene_tabs`，`value` 为上述 JSON；`updatedAt` 由 Prisma `@updatedAt` 维护并作为并发 token。无 Migration、无回填、无索引变化。
- Redis：**不引入**（DEC-008、ADR-006）。RabbitMQ / 事件：**不引入**（`contracts/events.yaml` 为空并说明理由）。
- 实现阶段必须把 `../../.harness/changes/home-category-visibility/contracts/openapi.yaml` 追加到 `apps/api/src/scripts/verify-openapi-contract.ts` 的 `contractPaths`，否则 `pnpm test:contract` 假通过（DEC-011、`AC-CFG-017`）。

## 安全与隐私

- 服务端 Guard 对每个受保护用例重新授权；前端 `canWrite` 只改善体验，不构成授权。
- 全局 `ValidationPipe({ whitelist, transform, forbidNonWhitelisted })` 保留；新增 DTO 使用 `@IsIn(['drive','fish'])`、`@IsString`、`@Length(1,12)`、`@IsInt`、`@Min/@Max`、`@ArrayMinSize(1)`、`@ValidateNested({ each: true })`。
- `label` 为纯文本，前端用插值渲染，不做 HTML 注入；输入长度受控，日志只记录事件名与 `scene`/`revision`，不记录完整用户输入原文（`NFR-OBS-001`）。
- 公开接口不返回 `enabled=false` 分类、不返回操作者、不返回 `SystemConfig` 原始实体；不引入 Secret 或新权限码。
- 响应 envelope 沿用 `apps/admin/src/api/client.ts` 的 `{ code, message, data, traceId }`，小程序不展示未知内部异常文本。

## UI/UX、文案、目标端与可访问性

- 小程序胶囊样式与现有 `SceneTabs.vue` 完全一致（`--chumen-ink` / `--chumen-lime` / `--chumen-canvas`，70rpx 高度、999rpx 圆角），仅数据源变化；保留 `role="tablist"` / `role="tab"` / `aria-selected`。
- 后台页面沿用 Element Plus 与现有 `PageHeader` 面包屑（首页 / 系统配置 / 首页分类目录），不引入新设计 Token。
- 文案口径：
  - 保存成功：`保存成功，小程序端下次进入首页生效`。
  - 隐藏说明：`隐藏后该分类不再出现在首页与列表，已分享的详情仍可打开`。
  - 冲突：`配置已被其他运营更新，请刷新后重试`。
  - 城市页（`CitiesView.vue:156`）：`城市场景标记仅用于资料维护，不影响小程序端显隐；首页分类请到「系统配置 / 首页分类目录」配置`。
  - 城市页 `:103` description 同步改为「城市开关影响该城市数据；场景标记仅用于资料维护」。
  - 后端 `admin.service.ts:344` 注释改为「城市资料场景标记，不参与 C 端显隐」，不改行为。
- 主目标端：微信小程序（体验版/真机）；H5 构建作为回归；后台 Chrome。详见 `frontend/ui-ux-review.md`、`verification/accessibility-test.md`。

## 性能、容量、SLI/SLO 与错误预算

- 公开配置读为单行主键查询，无 join、无分页；列表用例因隐藏场景直接短路返回，反而减少一次查询。
- `NFR-PERF-001`：20 RPS、5 分钟、P95 ≤ 200ms、P99 ≤ 500ms、错误率 < 0.1%。`operations/slo.yaml` 给出 30d 窗口的 SLI 定义；当前仓库无独立 APM，压测样本与集成测试报告作为实现期证据，生产观测能力缺口由 Operations Gate 显式裁决，不写成已通过。
- 小程序端不新增首屏串行阻塞：`onShow` 配置拉取与列表刷新并行发起，配置失败不等待超时；`cached` 命中时零网络请求。

## 可观测性

- 事件名（结构化日志，沿用现有 requestId/traceId）：`scene_tabs_config_invalid`（损坏配置）、`scene_tabs_config_rejected`（校验失败）、`scene_tabs_config_conflict`（并发冲突）、`scene_tabs_list_denied`（隐藏场景列表被拒）、`scene_tabs_config_updated`（成功写入，含操作者与 UTC 时间）。
- 不新增指标基数：`scene` 只有两个值，可作为低基数标签；不把 `label`、操作者 ID 作为高基数指标标签。
- 排障顺序：先看后台 `revision/updatedAt` → 查公开接口返回 → 查 `scene_tabs_list_denied` → 确认小程序 `onShow` 是否拉取到最新 revision。

## 备份恢复、RPO/RTO 与 Incident 响应

- 配置随 `system_configs` 表纳入既有 MySQL 备份；RPO 沿用现有数据库备份策略，RTO 目标 ≤ 15 分钟（通过后台「恢复默认」前向修复，不需要数据库回滚）。
- 误配止损：把配置改回 DEFAULT 即可，用户下次进入首页生效；小程序端本地兜底也是 DEFAULT，因此即使配置服务短暂不可用也可恢复首页。
- 详见 `operations/disaster-recovery.md`、`operations/incident-plan.md`、`release/rollback-plan.md`。

## 应用 CI、供应链、SBOM 与制品

- 不新增第三方依赖，不改变构建脚本；沿用 `#ifdef MP-WEIXIN` 之外的普通 TS/Vue 实现，H5 与 MP 双端构建均纳入 CI。
- 供应链评审范围限于新增/修改的源文件与契约文件；`security/supply-chain-review.md` 记录 `not-run → 执行后结论`，不预先写通过。
- 契约文件必须被 `pnpm test:contract` 覆盖；CI 证据绑定 SHA、命令、退出码与报告路径。

## 发布、迁移和回滚

1. **API 先行**：部署新接口与列表过滤。此时 `scene_tabs` 无记录，读取端返回 DEFAULT，C 端可见行为零变化；旧小程序包不请求新接口。
2. **管理后台**：部署新菜单与配置页；运营先只查看，不改配置。
3. **小程序**：构建 `mp-weixin` → 上传开发版/体验版 → UAT 真机验收 → 提交微信审核 → 正式发布。服务器 `Deploy production` 不会改变用户手机端已安装包，必须走小程序发布链路。
4. **灰度**：正式发布后保持默认配置观察一个业务日；需要开启钓鱼分类时由运营在后台单独操作，确认 C 端生效后再扩大范围。
5. **回滚**：配置层用「恢复默认」；代码层 API 可 revert（新小程序包回退到 DEFAULT 兜底），小程序包不可瞬时回滚，因此 DEFAULT 与旧版行为一致是安全垫。无数据库回滚、无 Redis Key 处理、无 MQ 兼容问题。

## 备选方案与决策

| 方案 | 优点 | 缺点 | 风险 | 结论 |
|---|---|---|---|---|
| A：在 `QrConfigView.vue` 内加「上传二维码 / 首页分类目录」子 tab | 菜单数量不变，两配置同页 | 需重构已上线页面；二维码上传状态与分类表单状态耦合；路由无法直达指定 tab | 回归面扩大，违反最小改动原则 | 否决 |
| B：系统配置分组新增独立菜单 + 路由 + 页面 | 不动已上线页面；路由/权限/审计清晰；复用 `PageHeader` 与 `apiGet/apiPut` 范式 | 左侧菜单多一项 | 低 | **采用（DEC-006）** |
| C：新建 `home_categories` 表 | 结构化字段、可加外键 | 需要 Prisma Migration、回填与回滚方案，收益不抵成本 | 中 | 否决（DEC-005） |
| D：让 `City.scenes` 真正生效，按城市覆盖 | 看起来复用现有后台开关 | 语义是城市资料而非全局分类；会与二期需求冲突；文案误导需先修 | 中 | 否决，留二期（DEC-003） |
| E：只隐藏客户端 tab，服务端不过滤 | 改动最小 | 直接调用接口仍可取到隐藏内容，构成伪安全（KB-INBOX-006） | 高 | 否决 |
| F：服务端进程内缓存配置或引入 Redis | 减少 DB 读 | 保存无法跨进程失效；ADR-006 禁止无用例引入 Redis | 高 | 否决（DEC-008） |
| G：`revision` 字段做乐观锁 | 语义直观 | `Json` 字段的条件更新依赖 Prisma JSON filter 支持 | 中 | 部分采用：`revision` 用于展示/排障，并发 token 用 `updatedAt` 条件更新 |

## 未决问题

- `01-clarification.md` Q-001 ~ Q-004 已于 2026-11-08 由用户确认关闭；下文仅列实现阶段仍需裁决的事项。
- 生产 APM/告警能力是否足以承载 `operations/slo.yaml` 的 SLI；若不足，由 Operations Gate 给出 `not-required` 或补充观测方案。
- 实现阶段核对 Prisma 7 对 `updateMany` 的 `updatedAt` 条件更新行为；若驱动无法保证，改用带 `revision` 的 JSON 条件更新并同步更新 `AC-CFG-013` 描述（属于实现细节，不改变业务 AC 结果）。
- 本设计不改变需求范围、公开契约口径或数据口径；若评审提出扩大范围，必须回到 `clarifying` 并升级给产品 Owner。
