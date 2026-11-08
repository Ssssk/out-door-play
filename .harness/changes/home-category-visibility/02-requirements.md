# 需求规格

## 术语表

| 术语 | 定义 |
|---|---|
| 首页分类目录 / 场景胶囊 | `apps/mobile/src/components/SceneTabs.vue` 渲染的首页内部分类 tab，非底部 `tabBar` |
| 场景 `scene` | 业务枚举，当前仅 `drive`（溜车）与 `fish`（钓鱼） |
| 分类项 | 配置数组中的一条：`scene` + 显示名称 `label` + 是否启用 `enabled` + 排序值 `sort` |
| 启用分类 | `enabled = true` 的分类项；只有启用分类会出现在首页/收藏页与列表查询中 |
| 隐藏分类 | `enabled = false` 的分类项；列表拒绝、详情保留 |
| 拒列表、留详情 | DEC-002 定义的语义，见 `FR-CFG-003`、`FR-CFG-005` |
| 配置版本 `revision` | 配置值内的整数，每次成功保存 +1，用于乐观锁 |

## 用户与场景

- 运营（具备 `config:read` / `config:write`）：在后台「系统配置 / 首页分类目录」查看与保存分类配置。
- 运营（仅 `config:read`）：只读查看配置，不能保存。
- C 端用户：进入小程序首页/收藏页看到启用分类；通过分享链接打开被隐藏分类的详情。
- 系统：在配置缺失、损坏、服务不可用或滚动发布期保持可用与兼容。

## 功能需求

### FR-CFG-001 首页分类目录由后台配置驱动

- 描述：首页场景胶囊的**显示项、显示名称、顺序**来自运营配置，不再来自 `SceneTabs.vue` 的编译期数组。
- 来源 ID/锚点：`SRC-001`（「就是这个需求」+ 首页截图）、`SRC-004`（默认方案）、`SRC-003`（`SceneTabs.vue:14`）
- 业务规则：配置以 `sort` 升序排列；`sort` 相同按 `scene` 字典序稳定排序；只渲染 `enabled = true` 的项。
- 权限：C 端公开读取，无需登录。
- 数据口径：`scene` 为字符串枚举，`label` 为 1-12 个字符，`sort` 为整数。
- 失败行为：配置读取失败回退内置默认（`DEC-010`），首页仍可渲染，不出现空白吸顶条。

### FR-CFG-002 管理后台「系统配置」模块

- 描述：在「系统配置」分组下新增「首页分类目录」菜单项与页面，展示全部分类项（含隐藏项），支持编辑名称、启停、排序、保存、重置与恢复默认。
- 来源 ID/锚点：`SRC-002`（「在这个后台tab 进行模块设计」+ 后台截图）、`SRC-003`（`router/index.ts:23`、`AdminLayout.vue:20-22`、`QrConfigView.vue`）
- 业务规则：页面沿用 `PageHeader`、`apiGet/apiPut`、loading/saving/dirty 与 `canWrite` 控制；保存成功后提示「下次进入首页生效」。
- 权限：`config:read` 可见页面；`config:write` 才能编辑与保存。
- 数据口径：页面展示 `revision`、`updatedAt`，保存时回传 `expectedRevision`。
- 失败行为：加载失败显示错误态与重试；保存失败保持表单内容、展示稳定错误码映射的中文提示；409 提示刷新后重试并自动重新拉取。

### FR-CFG-003 隐藏分类拒绝列表

- 描述：被隐藏场景的发现列表与收藏列表查询返回成功响应但空数据，且服务端执行过滤。
- 来源 ID/锚点：`SRC-004`（DEC-002）、`SRC-003`（`routes.controller.ts:14-16`、`user.service.ts:66-68`）
- 业务规则：过滤发生在服务端用例层，不依赖客户端隐藏 tab；`GET /v1/routes?scene=<hidden>` 返回空数组而非 404/422；收藏列表同理。
- 权限：公开列表接口不变；收藏接口仍需登录与其既有权限。
- 数据口径：响应 envelope 结构不变，仅 `data` 为空数组，保证旧客户端不崩。
- 失败行为：配置读取失败时按默认配置（DEC-010）过滤，不得放开全部场景。

### FR-CFG-004 名称与排序可配置

- 描述：运营可修改启用/隐藏分类的显示名称与 `sort`，保存后按新值渲染。
- 来源 ID/锚点：`SRC-001`、`SRC-004`
- 业务规则：`label` 去除首尾空白后长度 1-12，禁止空串；`sort` 为 0-9999 整数；同一次保存内 `scene` 不得重复。
- 权限：`config:write`。
- 数据口径：`scene` 不可编辑，只作为稳定标识；`label` 为 UTF-8 字符串，不做 HTML 渲染。
- 失败行为：校验不通过返回 422 且不落库，前端逐项提示。

### FR-CFG-005 留详情与分享直达

- 描述：隐藏分类的路线详情、钓点详情、收藏条目详情与分享链接仍可打开。
- 来源 ID/锚点：`SRC-004`（DEC-002）、`SRC-003`（`routes.service.ts:17-23`、两个详情页 `onLoad`/`onShareAppMessage`）
- 业务规则：`GET /v1/routes/:id`、`GET /v1/spots/:id`、路线地图页、分享路径参数一律不引入分类显隐判断；本地 mock 兜底数据保持可用。
- 权限：沿用现有公开详情与登录态收藏规则，不新增限制。
- 数据口径：详情响应字段与结构保持不变。
- 失败行为：详情接口不可用与本 Change 无关，按既有错误码处理。

### FR-CFG-006 场景白名单约束

- 描述：管理端写入的 `scene` 只能取 `drive` / `fish`，后台不能凭空创建业务场景。
- 来源 ID/锚点：`SRC-004`（DEC-004）、`SRC-003`（Prisma `enum Scene`、`routes.dto.ts:6`、`admin.service.ts:403`）
- 业务规则：DTO 运行时校验 + 服务端用例二次校验；未知值返回 422 `CONFIG_INVALID`。
- 权限：`config:write`。
- 数据口径：白名单与 Prisma `enum Scene` 保持一致；新增场景需独立 Change。
- 失败行为：整笔保存拒绝，不产生部分写入。

### FR-CFG-007 至少保留一个启用分类

- 描述：保存时与读取时都保证至少 1 个启用分类，避免首页出现无分类的空状态。
- 来源 ID/锚点：`SRC-004`（服务端兜底口径）、`SceneTabs.vue:13` 布局依赖注释
- 业务规则：管理端 PUT 中 `enabled = true` 的项数量为 0 时返回 422；公开读取遇到损坏配置（无启用项、字段缺失、`scene` 未知）时回退内置默认。
- 权限：不适用（服务端不变量）。
- 数据口径：内置默认见 DEC-010。
- 失败行为：返回明确错误；已有配置不被覆盖。

### FR-CFG-008 小程序端刷新与兜底

- 描述：小程序在首页/收藏页 `onShow` 拉取配置，进程内保留上次成功值，失败时按 DEC-009 回退。
- 来源 ID/锚点：`SRC-003`（`useDiscovery.ts:208-218`、`favorites/index.vue:43`）、DEC-009
- 业务规则：并发 `onShow` 只发起一个请求；卸载后不写回状态；配置变化后校正当前选中场景为首个启用项，并让列表缓存失效。
- 权限：公开接口。
- 数据口径：配置版本 `revision` 参与列表缓存 key，避免隐藏场景数据从缓存复活。
- 失败行为：网络超时/404/5xx 一律回退兜底值，不弹阻断性错误，不阻塞列表加载。

### FR-CFG-009 收藏页、预取与缓存收口

- 描述：收藏页复用同一份配置；首页预取目标按启用分类裁剪；列表缓存按配置版本隔离。
- 来源 ID/锚点：`SRC-003`（`favorites/index.vue:5`、`useDiscovery.ts:20-22,181-200`、`common/listCache.ts`）
- 业务规则：隐藏场景不出现在收藏页 tab、不被预取、不因缓存命中而展示；配置刷新后旧版本缓存不再命中。
- 权限：收藏接口沿用登录态。
- 数据口径：`listCacheKey` 追加 `revision`。
- 失败行为：配置回退默认时缓存 key 使用默认版本号，保证与默认过滤一致。

### FR-CFG-010 修正后台误导文案

- 描述：修正「关闭城市场景会影响小程序首页 tab」的文案与后端注释，指向新配置模块。
- 来源 ID/锚点：`SRC-003`（`CitiesView.vue:103,156`、`admin.service.ts:344`）、DEC-003
- 业务规则：`City.scenes` 的读写行为不变，仅说明其「城市资料标记」语义；文案明确指向「系统配置 / 首页分类目录」。
- 权限：文案对具备城市页权限的后台账号可见。
- 数据口径：不涉及数据变化。
- 失败行为：不适用。

### FR-CFG-011 权限、审计与并发控制

- 描述：管理端读取受 `config:read` 保护、写入受 `config:write` 保护；每次成功写入记录操作者与时间；并发写入用 `revision` 乐观锁。
- 来源 ID/锚点：`SRC-003`（`admin.controller.ts:49-50`、`admin-auth.guard.ts:36`）、DEC-007
- 业务规则：Guard 在服务端重新授权，不依赖前端隐藏按钮；`expectedRevision` 与当前值不一致返回 409；重复提交相同 `expectedRevision` 只有第一次成功。
- 权限：`config:read` / `config:write`（角色映射见 `admin-auth.constants.ts`）。
- 数据口径：`updatedAt` 为 ISO 8601 UTC 字符串；审计信息沿用现有管理端日志记录方式。
- 失败行为：403/409/422 使用稳定错误码，不泄漏内部异常文本。

## 非功能需求

### NFR-PERF-001 公开配置读延迟

- 统计口径：新增 `GET /v1/config/scene-tabs` 服务端处理耗时（不含网络），MySQL 单行主键查询，无缓存。
- 环境：与现有集成测试相同的容器化 MySQL / InnoDB；并发 20 RPS、持续 5 分钟。
- 阈值：P95 ≤ 200ms，P99 ≤ 500ms，错误率 < 0.1%。
- 验证方式：集成测试采样 + 压测脚本报告，绑定当前 SHA 与命令；生产观测能力缺失时由 Operations Gate 显式裁决。

### NFR-RELI-001 配置不可用时的可用性

- 统计口径：配置接口 404 / 5xx / 超时 / 配置 JSON 损坏四类故障注入下，首页首屏可渲染率。
- 环境：uni-app 微信小程序目标端 + 本地 API。
- 阈值：四类注入下首屏可渲染率 100%，且不出现无分类的空白吸顶条。
- 验证方式：组件测试 + 目标端人工用例，故障注入结果写入 `evidence/`。

### NFR-SEC-001 服务端授权与输入校验

- 统计口径：管理端 GET/PUT 的越权与非法输入用例。
- 环境：API 集成测试（真实 Guard + 真实 MySQL）。
- 阈值：无 `config:write` 的保存 100% 被拒绝；非法 `scene`、空 `label`、超长 `label`、非整数 `sort`、未知字段 100% 返回 422 且无落库；响应不返回 `SystemConfig` 原始实体。
- 验证方式：集成测试 + 契约测试 + 安全评审记录。

### NFR-COMPAT-001 滚动发布与旧客户端兼容

- 统计口径：四种组合（旧包+旧服、旧包+新服、新包+旧服、新包+新服）下首页可见分类与详情可达性。
- 环境：小程序体验版/开发者工具 + 本地/测试 API。
- 阈值：默认配置下四种组合首页均只显示「粗门溜车」；新包+旧服在配置接口 404 时回退默认；详情在四种组合下均可打开。
- 验证方式：目标端人工矩阵 + E2E 用例。

### NFR-OBS-001 可观测与审计

- 统计口径：配置读取失败、配置校验失败、并发冲突、列表因隐藏场景被拒绝四类事件。
- 环境：现有 Nest 日志（含 requestId/traceId）。
- 阈值：四类事件均可在日志中按事件名检索，且不含 `label` 以外的用户输入原文、不含任何 Secret；管理端写入记录操作者与时间。
- 验证方式：日志断言测试 + 安全评审。

### NFR-A11Y-001 可访问性与触控

- 统计口径：分类胶囊的语义角色、选中态、触控区域与后台表格键盘可达性。
- 环境：微信小程序目标端 + 后台 Chrome。
- 阈值：胶囊保留 `role="tablist"` / `role="tab"` / `aria-selected`；触控高度不低于现状 70rpx；后台输入与开关可键盘操作并有可见焦点。
- 验证方式：组件测试 + 可访问性人工检查记录。

## 非目标

- 底部 `tabBar` 配置、首页其他模块（Banner、榜单、加油站/充电站）的显隐配置。
- 城市维度分类覆盖（`City.scenes` 生效）、分人群灰度、定时发布、配置审批流与版本历史页面。
- 新增 `drive`/`fish` 之外的业务场景及其详情页、数据模型、审核流程。
- 引入 Redis、RabbitMQ、新数据库表、Prisma Migration 或新的全局状态管理库。
- 对已下线分类的数据做删除、归档或收藏清理。
- 小程序端配置变更的实时推送（一期采用 `onShow` 拉取）。

## 来源追踪

| FR/NFR | 来源 ID | 来源锚点 | 版本 | Owner确认 |
|---|---|---|---|---|
| FR-CFG-001 | SRC-001、SRC-004、SRC-003 | 首页截图 / 默认方案 / `SceneTabs.vue:12-14` | 2026-11-08 会话 + 当前工作树 | Q-001 Gate 核对 |
| FR-CFG-002 | SRC-002、SRC-003 | 后台截图 / `router/index.ts:23`、`QrConfigView.vue` | 2026-11-08 会话 + 当前工作树 | Q-001 Gate 核对 |
| FR-CFG-003 | SRC-004、SRC-003 | DEC-002 / `routes.controller.ts:14-16`、`user.service.ts:66-68` | 2026-11-08 会话 + 当前工作树 | Q-001 Gate 核对 |
| FR-CFG-004 | SRC-001、SRC-004 | 首页截图 / 默认方案 | 2026-11-08 会话 | Q-001 Gate 核对 |
| FR-CFG-005 | SRC-004、SRC-003 | DEC-002 / `routes.service.ts:17-23`、详情页 `onLoad` | 2026-11-08 会话 + 当前工作树 | Q-001 Gate 核对 |
| FR-CFG-006 | SRC-004、SRC-003 | DEC-004 / Prisma `enum Scene`、`routes.dto.ts:6` | 2026-11-08 会话 + 当前工作树 | Q-001 Gate 核对 |
| FR-CFG-007 | SRC-004、SRC-003 | 服务端兜底口径 / `SceneTabs.vue:13` | 2026-11-08 会话 + 当前工作树 | Q-001 Gate 核对 |
| FR-CFG-008 | SRC-003、DEC-009 | `useDiscovery.ts:208-218`、`favorites/index.vue:43` | 当前工作树 | Q-001 Gate 核对 |
| FR-CFG-009 | SRC-003 | `useDiscovery.ts:20-22,181-200`、`common/listCache.ts` | 当前工作树 | Q-003 产品取舍 |
| FR-CFG-010 | SRC-003、DEC-003 | `CitiesView.vue:103,156`、`admin.service.ts:344` | 当前工作树 | Q-001 Gate 核对 |
| FR-CFG-011 | SRC-003、DEC-007 | `admin.controller.ts:49-50`、`admin-auth.guard.ts:36` | 当前工作树 | Q-001 Gate 核对 |
| NFR-PERF-001 | SRC-003 | `config.controller.ts:18-29` 单行主键读范式 | 当前工作树 | Q-004 Operations Gate |
| NFR-RELI-001 | DEC-009、SRC-003 | `pages/mine/index.vue:71-74` 配置失败回退范式 | 当前工作树 | Q-001 Gate 核对 |
| NFR-SEC-001 | SRC-003、`.harness/wiki/09-认证与权限模型.md:21` | 服务端必须重新授权 | 当前工作树 | Q-001 Gate 核对 |
| NFR-COMPAT-001 | DEC-010、DEC-012 | 默认配置与发布顺序 | 2026-11-08 会话 | Q-004 发布 Gate |
| NFR-OBS-001 | `AGENTS.md` §12、`NFR-SEC-001` | 证据与真实性、日志脱敏 | 仓库契约 | Q-004 Operations Gate |
| NFR-A11Y-001 | SRC-003 | `SceneTabs.vue:2-4` 现有 a11y 属性 | 当前工作树 | Q-001 Gate 核对 |

## 依赖与假设

- 依赖既有 `SystemConfig` 表、`config:read` / `config:write` 权限码、管理端 Cookie + CSRF 会话、`apiGet/apiPut` 封装、小程序 `request` 封装与 `listCache`。
- 假设 `scene` 枚举在二期之前不会新增；若新增，需独立 Change 同步 Prisma enum、DTO、后端服务、小程序类型与详情页路由。
- 假设小程序端可以接受「下次进入首页生效」而非实时推送。
- 假设后台与 API 为同一数据库（现有 `qrcodes` 即如此），不存在跨库配置同步。
- 假设微信小程序审核与发布通道可用（DEC-012），否则 C 端改动只能停留在体验版验收。

## 未决问题

Q-001 ~ Q-004 已于 2026-11-08T07:11:04Z 由用户回复「确认」关闭，`source-baseline.json` 已标记 `verified`，需求 Gate 与设计 Gate 已批准；详见 `01-clarification.md` 与 `approvals/2026-11-08-requirements-design.md`。
