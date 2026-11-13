# 需求规格

## 术语表

| 术语 | 定义 |
|---|---|
| 顶层业务分类 | `Scene` 枚举值：`drive` 粗门溜车、`play` 粗门玩玩、`wash` 粗门洗车；`fish` 为兼容期保留值，不作为新业务的顶层分类 |
| 子类型 | `Discovery.subType`，固定枚举 `fishing` 钓鱼 / `camping` 露营 / `checkin` 打卡；仅 `play` 下使用，其它场景为 null |
| 兼容值 | `fish` 在 Contract 阶段前继续存在于 enum 与 API 白名单，保证旧包可用；新数据不得写入 `scene=fish` |
| Expand / Migrate / Contract | 数据库变更三阶段，见 DEC-E09 与 `backend/migration-plan.md` |
| 拒列表、留详情 | `CHG-HOME-CATEGORY-001` DEC-002 语义：隐藏场景列表返回空，详情与分享直达保留 |

## 功能需求

### FR-EXP-001 顶层业务分类扩展

- 描述：`Scene` 枚举新增 `play` / `wash`，与 `drive` 共同构成 3 个顶层业务分类；`fish` 保留为兼容值。
- 来源：`SRC-E01`、`SRC-E04`
- 业务规则：新写入的数据 `scene` 只能是 drive/play/wash；读取时仍接受 fish；`rankings.scene` 同步扩展。
- 权限：沿用现有公开读与管理端写权限。
- 失败行为：写入 `fish` 返回 422；未知值返回 422。

### FR-EXP-002 粗门玩玩子类型

- 描述：`play` 下支持 3 个子类型：钓鱼 / 露营 / 打卡，其它场景的子类型为 null。
- 来源：`SRC-E01`
- 业务规则：`scene=play` 时 `subType` 必填且只能取 fishing/camping/checkin；非 play 时 `subType` 必须为 null（服务端强制，不接受静默忽略）。
- 权限：管理端 `route:edit` 可设置；公开接口只读返回。
- 失败行为：非法组合返回 422 `SCENE_SUBTYPE_INVALID`，不落库。

### FR-EXP-003 钓鱼数据回填

- 描述：把现有 `scene=fish` 的 3 条 Discovery、2 条 Ranking、4 个城市的 `City.scenes` JSON、`SystemConfig.scene_tabs` 与 seed 数据迁到 `play` + `subType=fishing`。
- 来源：`SRC-E01`、`SRC-E04`
- 业务规则：回填可预览（dry-run 输出受影响行数与样本）、幂等（重复执行不产生重复迁移）、可审计（记录批次、时间、执行者）；`favorites` 通过 `discovery.scene` 关联，无需改写行。
- 权限：生产写入需针对目标、环境、动作的明确授权。
- 失败行为：预览与实执行行数不一致时中止；任一步失败保留原数据并可恢复。

### FR-EXP-004 后台路线列表 3 个 tab

- 描述：筛选 tab 改为「全部 / 粗门溜车 / 粗门玩玩 / 粗门洗车」，选中「粗门玩玩」时出现二级子类型筛选（钓鱼/露营/打卡）。
- 来源：`SRC-E01`、`SRC-E02`
- 业务规则：tab 与子类型筛选组合成 `scene` + `subType` 查询参数；分页在筛选变化时重置；空数据展示明确空态而非空白表格。
- 权限：`route:read`。
- 失败行为：查询失败展示错误态与重试，保留当前筛选条件。

### FR-EXP-005 后台新建/编辑表单

- 描述：表单支持 3 个顶层场景，选择「粗门玩玩」时显示子类型下拉；钓点专属字段按子类型 fishing 显示，其它场景按路线字段显示。
- 来源：`SRC-E01`、`SRC-E04`
- 业务规则：编辑已有记录时不允许随意改 scene（沿用现有 `lockedScene`）；「新建」按钮按 3 个场景分别提供；提交 payload 带 `scene` 与 `subType`。
- 权限：`route:edit`。
- 失败行为：服务端 422 时逐项提示且不关闭弹窗。

### FR-EXP-006 小程序首页 3 个分类

- 描述：首页分类目录由 `scene_tabs` 配置驱动，默认 3 项全启用（粗门溜车 / 粗门玩玩 / 粗门洗车），支持运营配置显隐、名称、排序。
- 来源：`SRC-E01`、DEC-E05
- 业务规则：白名单扩为 drive/play/wash；隐藏分类仍按 DEC-002「拒列表、留详情」；`SceneTabs.vue` 不再有二元假设。
- 权限：公开读。
- 失败行为：配置接口失败 / 404 / 超时 / 配置损坏时降级到本地兜底仅 `drive`，不展示内置 3 项默认，不阻塞首屏（两层默认，见文末裁决修订）。

### FR-EXP-007 列表与收藏按新分类过滤

- 描述：`GET /v1/routes`、`GET /v1/user/favorites` 接受 drive/play/wash（兼容 fish）与可选 `subType`；隐藏场景返回空数组。
- 来源：`SRC-E01`、`SRC-E03`
- 业务规则：服务端用例层强制过滤，不依赖客户端 tab；`subType` 仅对 play 生效，其它场景传 subType 返回 422。
- 权限：公开 / 登录态沿用既有规则。
- 失败行为：响应 envelope 不变，空数组而非 4xx。

### FR-EXP-008 详情与分享兼容

- 描述：`GET /v1/routes/:id` 支持 drive/play/wash；`GET /v1/spots/:id` 放行 `scene IN (fish, play)` 且 `subType=fishing`；小程序分享链接参数保持不变。
- 来源：`SRC-E03`、DEC-E04
- 业务规则：`prisma-discovery.repository.find` 不再按单一 scene 硬绑定；详情页按 scene + subType 分流，钓鱼仍进 `fishing-detail`，其余进 `route-detail`。
- 权限：公开详情不变。
- 失败行为：未命中返回既有 `DISCOVERY_NOT_FOUND`，不泄漏内部异常。

### FR-EXP-009 首页分类配置适配

- 描述：`SceneTabsConfigService` 白名单、`@ArrayMaxSize`、默认配置与后台 `SceneTabsConfigView` 的「恢复默认」同步扩为 3 项；`revision` 乐观锁不变。
- 来源：DEC-E05、DEC-E06、`SRC-E04`
- 业务规则：配置仍不能凭空新增业务场景；至少 1 个启用分类的不变量保留。
- 权限：`config:read` / `config:write`。
- 失败行为：旧配置中残留 `fish` 项时读取端按默认配置兜底并记录日志，不 500。

### FR-EXP-010 其它数据口径同步

- 描述：`City.scenes` JSON、`Ranking`、seed 数据、后台城市页场景勾选、榜单页场景下拉同步到新枚举。
- 来源：`SRC-E04`
- 业务规则：`City.scenes` 仍只作资料标记，不参与 C 端显隐（`CHG-HOME-CATEGORY-001` DEC-003 不变）。
- 权限：沿用既有城市/榜单权限。
- 失败行为：旧值 fish 在兼容期内可被读取，不阻断页面。

### FR-EXP-011 权限、审计与并发

- 描述：管理端写入继续受 `route:edit` / `config:write` 与服务端 Guard 保护；配置保存沿用 `expectedUpdatedAt` 乐观锁；回填记录操作者与时间。
- 来源：`SRC-E03`、AGENTS.md §8
- 失败行为：403 / 409 / 422 使用稳定错误码，不泄漏内部异常。

### FR-EXP-012 兼容与滚动发布

- 描述：兼容期内 API 接受 `scene=fish` 并映射到 `play` + `subType=fishing`；旧小程序包不因新枚举出现 422 / 白屏；新包 + 旧服回退内置默认。
- 来源：DEC-E02、DEC-E12
- 业务规则：`fish` 只作读取兼容，不作为可写入值；响应中 `scene` 字段返回真实存储值（play），旧包按 `scene !== 'fish'` 走路线详情页仍能渲染。
- 失败行为：兼容映射失败时返回空列表而非 500，并记录日志。

### FR-EXP-013 洗车 / 露营 / 打卡目的地型字段口径

- 描述：洗车（`scene=wash`）、露营（`play` + `subType=camping`）与打卡（`play` + `subType=checkin`）是目的地型内容，不是路线；后台新建/编辑表单与小程序展示只保留终点及终点坐标，不展示也不写入驾驶类字段。洗车保留「可洗车型」（`carType`）与「营业时间」（`bestTime`，复用建议时段列），作为该场景的核心筛选信息。
- 来源：用户 2026-11-12 后台截图与明确要求（露营去掉难度、难度等级、建议时段、耗时、路线长、落差、车型、起点、起点坐标，只有终点）；2026-11-13 用户明确要求打卡与露营同口径；2026-11-13 用户确认洗车按目的地型处理、车型作为「可洗车型」保留。
- 业务规则：
  - 后台表单（`RoutesView.vue`）对目的地型（`wash` / `play+camping` / `play+checkin`）隐藏：难度、难度等级、建议时段、耗时、路线长、落差、起点、起点坐标；洗车额外显示「可洗车型」输入框（复用 `carType`，标签为「可洗车型」）。
  - 提交 payload（`routeFormPolicy.buildRoutePayload`）对目的地型记录只含 `endPoint` 与 `endLongitude/endLatitude`（终点坐标同时作为导航与「距你」距离基准）；洗车额外提交 `carType`；终点坐标缺失时不提交坐标键，避免服务端收到 0/0 而导航到错误位置。
  - 服务端（`AdminService.createRoute/updateRoute`）对目的地型记录强制不写入 `difficulty`/`level`/`durationLabel`/`lengthKm`/`elevationM`/`startPoint` 的占位值；洗车保留 `carType` 与 `bestTime`（营业时间），仅露营/打卡清空这两项（`bestTime=''`、`carType=null`）；DTO `difficulty` 改为可选以允许露营/打卡表单不提交。
  - 小程序端（`DiscoveryCard` / `DetailHero` / `route-detail`）对目的地型记录隐藏难度、耗时、路线长、落差、出发地与「查看完整路线」入口；洗车详情额外展示「可洗车型」与「营业时间」。
- 权限：沿用 `route:edit` 与服务端 Guard。
- 失败行为：违反目的地型口径的隐藏字段在服务端被清空，不产生「入门级」「待补充」等假数据。

### FR-EXP-014 目的地型展示字段（价格 / 电话 / 设施）

- 描述：露营 / 打卡 / 洗车目的地型内容补充运营与用户关心的核心信息，并让卡片与钓鱼卡片视觉对称（三指标位）。
- 来源：用户 2026-11-13 梳理「粗门洗车」展示字段时确认「新增字段放 2 期」；2026-11-14 用户确认采用「门票 + 开放时间 + 建议停留」三指标方案。
- 业务规则：
  - **门票/费用（`priceLabel`，2026-11-14 已实现）**：`Discovery` 表新增可空列 `price_label`；后台表单目的地型增加「门票/费用」输入框；小程序卡片与详情头部三指标位展示「门票」，详情「地点信息」展示门票；服务端对目的地型保留该字段（空则留空，不写占位）。
  - **开放时间 / 建议停留（复用 `bestTime` / `durationLabel`，2026-11-14 已实现）**：目的地型不再清空这两项，后台表单目的地型增加「开放时间」「建议停留」输入框；卡片三指标位展示「开放时间」「建议停留」，详情「地点信息」同步展示。
  - **联系电话 / 配套设施标签（`contactPhone` / `facilities`，仍 pending）**：尚未实现，待二期；届时同样以可空列加入 `Discovery` 并三端复用。
- 权限：沿用 `route:edit` 与服务端 Guard。

## 非功能需求

### NFR-MIG-001 迁移安全

- 统计口径：回填预览行数 vs 实执行行数、重复执行后的变更行数、备份点可恢复性。
- 环境：先在与生产同版本的容器化 MySQL 演练，再在生产维护窗口执行。
- 阈值：预览/实执行行数一致；第二次执行变更行数为 0；恢复演练能在 15 分钟内还原。
- 验证方式：dry-run 报告 + 演练记录 + 备份恢复校验，绑定 SQL、SHA、时间、执行者与退出码。

### NFR-COMPAT-001 滚动共存

- 统计口径：旧包+旧服 / 旧包+新服 / 新包+旧服 / 新包+新服 四组合下首页、列表、详情、分享可用性。
- 阈值：四组合无 5xx、无白屏、分享详情 200；`scene=fish` 请求在兼容期返回钓鱼内容。
- 验证方式：目标端矩阵 + API 集成测试。

### NFR-SEC-001 服务端授权与输入校验

- 统计口径：非法 scene/subType 组合、越权写入、未知字段。
- 阈值：100% 被拒绝且无落库；响应不返回 Prisma 实体；日志不含 Secret。
- 验证方式：集成测试 + 契约测试 + 安全评审。

### NFR-PERF-001 查询性能

- 统计口径：新增 `(city_code, scene, sub_type)` 索引后的列表查询 P95/P99。
- 阈值：P95 ≤ 200ms（与既有列表基线一致），回填期间不出现长锁。
- 验证方式：集成测试采样 + 压测报告；大表 DDL 需评估行数、锁与复制延迟。

### NFR-OBS-001 可观测与审计

- 统计口径：兼容映射、非法子类型、回填批次、隐藏场景拒绝四类事件。
- 阈值：可按事件名与 requestId/traceId 检索，日志低基数、不含用户输入原文。
- 验证方式：日志断言测试 + Operations Gate 检查。

### NFR-A11Y-001 可访问性

- 统计口径：3 个 tab 与二级子类型筛选的语义角色、选中态、触控区域与键盘可达性。
- 阈值：保留 `role="tablist"` / `aria-selected`，后台筛选可键盘操作并有可见焦点。
- 验证方式：组件测试 + 目标端/浏览器人工检查。

## 非目标

- Contract 阶段移除 `fish` enum 值（另开 Change）。
- 「粗门洗车」门店、预约、支付与独立详情页。
- 子类型配置后台、子类型独立小程序 tab、子类型版本历史。
- 底部 `tabBar`、`City.scenes` 城市级显隐生效、配置审批流。
- 删除钓鱼历史数据、收藏数据或分享链接。
- 引入 Redis / RabbitMQ / 新表。

## 来源追踪

| FR/NFR | 来源 ID | 锚点 |
|---|---|---|
| FR-EXP-001 | SRC-E01、SRC-E04 | 用户裁决 / `schema.prisma:10-13` |
| FR-EXP-002 | SRC-E01 | 「粗门玩玩就包括：钓鱼、露营、打卡」 |
| FR-EXP-003 | SRC-E01、SRC-E04 | 用户裁决 / `seed.ts:33-66,69-75,144-151` |
| FR-EXP-004 | SRC-E01、SRC-E02 | 后台路线列表截图 / `RoutesView.vue:254` |
| FR-EXP-005 | SRC-E01、SRC-E04 | 用户裁决 / `RoutesView.vue:44-51,166-190` |
| FR-EXP-006 | SRC-E01、SRC-E03 | 用户裁决 / DEC-010 冲突 |
| FR-EXP-007 | SRC-E01、SRC-E03 | 用户裁决 / DEC-002 |
| FR-EXP-008 | SRC-E03、SRC-E04 | `routes.service.ts:27-33`、`fishing-detail:48-53` |
| FR-EXP-009 | SRC-E03、SRC-E04 | `scene-tabs-config.service.ts:31,34-41`、`SceneTabsConfigView.vue:10-12` |
| FR-EXP-010 | SRC-E04 | `CitiesView.vue`、`RankingsView.vue`、`prisma/seed.ts` |
| FR-EXP-011 | SRC-E03 | `admin-auth` Guard、配置乐观锁 |
| FR-EXP-012 | DEC-E02、SRC-E04 | `AGENTS.md` §9 / 旧小程序包白名单 |
| FR-EXP-013 | 2026-11-12 / 2026-11-13 截图与明确要求 | 用户截图 / `RoutesView.vue`、`routeFormPolicy.ts`、`admin.service.ts` |
| FR-EXP-014 | 2026-11-13 梳理「粗门洗车」字段口径 | 用户诉求 / `02-requirements.md` FR-EXP-013 |
| NFR-MIG-001 | AGENTS.md §9、§13 | 迁移与破坏性操作约束 |
| NFR-COMPAT-001 | DEC-E02、DEC-E12 | 滚动共存窗口 |
| NFR-SEC-001 | AGENTS.md §8 | 运行时 DTO 校验与服务端授权 |
| NFR-PERF-001 | SRC-E04 | `discoveries_city_code_scene_idx` 现有索引 |
| NFR-OBS-001 | AGENTS.md §12 | 证据与真实性 |
| NFR-A11Y-001 | SRC-E04 | `RoutesView.vue:253-256`、`SceneTabs.vue:2-4` |

## 依赖与假设

- 依赖 `CHG-HOME-CATEGORY-001` 已落地但尚未发布的代码作为基线（DEC-E10）。
- 假设「粗门洗车」与「露营/打卡」一期允许空数据状态（Q-E01）。
- 假设生产可获得维护窗口与备份点（Q-E04）。
- 假设兼容期至少一个发布周期，之后另开 Change 移除 `fish`。
- 假设小程序审核与发布通道可用。

## 冲突裁决后的口径修订（2026-11-08）

以下为用户逐条裁决后的**生效口径**；与本文件上文中不一致的表述，以本节为准。裁决全文见 `01-clarification.md`。

1. **FR-EXP-001 / FR-EXP-009（冲突 1）**：`DEC-004` 的「新增场景需要独立 Change」已由本 Change 满足；`FR-CFG-006` 修订为「业务写入白名单 ⊆ `enum Scene` 值集合，兼容值 `fish` 只读不写」。本次范围固定 `drive` / `play` / `wash` 三个顶层值；「后台不能凭空新增业务场景」的治理边界保留，运营仍不能自造 scene。
2. **FR-EXP-006（冲突 2，两层默认）**：**服务端下发默认**为 3 项全启用（粗门溜车 / 粗门玩玩 / 粗门洗车）；**小程序本地故障/旧服兜底**仍为仅 `drive`。新包白名单扩为 3 值，但配置接口失败 / 404 / 超时 / 配置损坏时**降级到仅 `drive`**，不得用内置 3 项默认替代；「恢复默认」按钮提交的是服务端 3 项默认。残留含 `fish` 的旧配置按服务端 3 项默认兜底。
3. **FR-EXP-008（冲突 3）**：详情端点永不引入分类显隐判断，只把单 scene 硬编码换成 `find(id, scenes[])` 集合放行；`scene=fish` 兼容映射为 `play + fishing` 后仍必须走 `enabledScenes()` 短路（隐藏「粗门玩玩」时旧包 `scene=fish` 同样返回空数组）；钓点专属字段（水深 / 岸线 / 钓具）按 `subType === 'fishing'` 判定，而非 `scene === 'fish'`。
4. **FR-EXP-012（冲突 2 联动）**：「新小程序包 + 旧服务端」场景下，本地兜底仅 `drive`，不向旧服请求 `scene=play` / `wash`，避免 422；旧包 + 新服由白名单过滤后仍只显示 `drive`。
5. **NFR-COMPAT-001（阈值修订）**：四组合均须无 5xx、无白屏、无 422；其中「新包 + 新服」显示 3 个分类，其余组合**至少 `drive` 可用**且钓鱼分享详情可打开；`scene=fish` 请求在兼容期返回钓鱼内容（未被隐藏时）。原「四种组合首页均只显示粗门溜车」的旧阈值不再适用。
6. **发布归属（冲突 4，方案 A）**：`CHG-HOME-CATEGORY-001` 的代码并入本 Change，不单独完成 / 发布；其验证、UAT、安全与发布证据归入本 Change 的验证计划与发布 Gate 记录，发布顺序按 DEC-E12 覆盖原 DEC-012。

## 未决问题

Q-E01 ~ Q-E03 与四条已批准 Change 冲突已于 2026-11-08 由用户逐条裁决、并在需求 Gate / 设计 Gate 书面确认生效（`approvals/2026-11-08-requirements-design.md`），Change 进入 `implementing`。Q-E04 仍开放（发布 Gate 前确认）；Implementation 及之后 Gate 仍为 `pending`。
