# 技术设计

> **已批准设计**。需求 Gate 与设计 Gate 于 2026-11-08 由用户书面批准（`approvals/2026-11-08-requirements-design.md`），Change 进入 `implementing`；四条冲突裁决与「裁决后的设计修订」为本设计的生效口径。Q-E04 仍开放。生产 ENUM 变更、数据回填与发布仍需针对目标、环境、动作的明确授权，不得在未授权环境执行 Migration 或回填。

## 目标与非目标

目标：把两分类 `drive` / `fish` 扩为三个品牌化业务分类（`drive` 粗门溜车 / `play` 粗门玩玩 / `wash` 粗门洗车），`play` 下设钓鱼/露营/打卡子类型，原钓鱼数据并入 `play/fishing`；后台路线列表与小程序首页均呈现 3 个分类，且已有分享链接、收藏数据不丢失。

非目标：移除 `fish` enum 值（Contract 另开 Change）、洗车独立详情页与门店能力、子类型配置后台、第三层小程序 tab、删除历史数据、引入 Redis/RabbitMQ/新表。

设计驱动因素：① 生产 ENUM 变更不可逆，必须 expand-migrate-contract；② 旧小程序包只认 drive/fish，滚动期必须共存；③ 白名单目前散落在 25+ 文件，必须收敛；④ 后台 `RoutesView.vue` 与后端 `routes.service.ts` 到处是二元假设；⑤ `CHG-HOME-CATEGORY-001` 已实现未发布，作为基线被适配而非另起炉灶。

## 当前流程与目标架构

```text
[现状]
后台 RoutesView tab: [全部 | 溜车(drive) | 钓鱼(fish)]
   → GET /v1/admin/routes?scene=drive|fish
后端 routes.service: route(id)→drive, spot(id)→fish（硬编码）
DB: discoveries.scene ENUM('drive','fish')，无子类型字段
小程序首页: scene==='fish' ? fishing-detail : route-detail

[目标]
后台 RoutesView tab: [全部 | 粗门溜车 | 粗门玩玩 | 粗门洗车]
                      └ 选中「粗门玩玩」→ 二级 [钓鱼 | 露营 | 打卡]
   → GET /v1/admin/routes?scene=play&subType=fishing
后端入口统一 normalizeScene()：fish（兼容读）→ play/fishing
   → 列表/收藏用例按 scene + subType 过滤；详情按 scene 集合放行
DB: discoveries.scene ENUM('drive','fish','play','wash')
    discoveries.sub_type ENUM('fishing','camping','checkin') NULL
    rankings.scene 同步；索引 (city_code, scene, sub_type)
小程序首页: 3 个分类由 scene_tabs 配置驱动
   → item.subType==='fishing' ? fishing-detail?spotId= : route-detail?routeId=
```

**白名单收敛**：新增 `apps/api/src/common/scenes.ts` 作为后端唯一事实来源，导出 `BUSINESS_SCENES = ['drive','play','wash']`、`LEGACY_SCENES = ['fish']`、`PLAY_SUBTYPES = ['fishing','camping','checkin']`、`normalizeScene()` 与 `assertSceneSubType()`。所有 DTO 的 `@IsIn`、服务与 Repository 均引用该模块，避免 `AC-EXP-012` 的漏改。小程序与后台各有等价类型常量，由测试断言与后端一致。

## 业务不变量和状态转换

| 不变量 | 强制点 |
|---|---|
| 新写入 `scene ∈ {drive, play, wash}`；`fish` 仅读兼容 | DTO `@IsIn` + 应用用例二次校验 |
| `scene=play` ⇔ `subType ∈ {fishing,camping,checkin}`；其它场景 `subType === null` | `assertSceneSubType()`，非法组合 422 `SCENE_SUBTYPE_INVALID` |
| 已迁移的钓鱼记录唯一表示为 `play/fishing` | 回填脚本 + 写入约束 + 只读校验 |
| 首页分类配置至少 1 个启用项、`revision` 单调递增 | 沿用 `SceneTabsConfigService`（`CHG-HOME-CATEGORY-001`） |
| 隐藏分类拒列表、留详情 | 沿用 DEC-002，过滤维度增加 play/wash |
| 详情与分享永不因分类变化被拒 | `find(id, scenes[])` 按集合放行 |

状态转换（数据）：`fish` → `play/fishing`（Expand 后可共存，Migrate 后完成）；Contract 阶段才移除 `fish` enum 值。应用状态：`未迁移`（旧包+旧服）→ `Expand`（新旧枚举共存）→ `Migrate`（数据就位）→ `Contract`（另开 Change）。

## 成功、失败、超时、重复与补偿时序

- **Expand 成功**：Migration 加 enum 值与 `sub_type` 列/索引；旧应用仍可读写 `fish`，新应用可读写 3 类。DDL 前评估行数、锁、磁盘、复制延迟，优先 `ALGORITHM=INPLACE, LOCK=NONE`，不支持时安排维护窗口。
- **Migrate 成功**：dry-run 输出受影响行数与样本 → 人工确认 → 备份点 → 实执行 → 只读校验 → 记录批次。回填幂等：条件 `WHERE scene='fish' AND sub_type IS NULL`，第二次执行 0 行。
- **回填失败**：任一步失败即中止，保留原 `fish` 行（无部分迁移），按 `release/rollback-plan.md` 用备份点与 id 清单恢复；不自动重试。
- **兼容读**：`GET /v1/routes?scene=fish` 在入口映射为 `play + fishing`，返回真实存储 `scene=play`；旧包按 `scene !== 'fish'` 走 route-detail 仍能渲染（不会崩）。
- **详情失败**：`find()` 按 scene 集合查询，未命中返回既有 `DISCOVERY_NOT_FOUND`；分享链接不会因为 scene 改名而 404。
- **重复提交 / 并发**：配置保存沿用 `expectedUpdatedAt` 条件更新；路线创建沿用现有接口，不做额外幂等键。
- **补偿**：无跨服务副作用、无外部消息；补偿手段是备份恢复 + 反向 SQL（限定 id 清单），不做事件重放。

## 数据设计与迁移

### Prisma schema（Expand）

```prisma
enum Scene {
  drive
  fish   // 兼容期保留，Contract 阶段另开 Change 移除
  play
  wash
}

enum PlayType {
  fishing
  camping
  checkin
}

model Discovery {
  // ...既有字段不变
  subType PlayType? @map("sub_type")
  @@index([cityCode, scene, subType])
}
```

`rankings.scene` 因共用 `enum Scene` 自动获得新值，但 **DDL 必须同时 MODIFY 两张表**。

### Migration SQL（Expand，示意）

```sql
ALTER TABLE `discoveries`
  MODIFY `scene` ENUM('drive','fish','play','wash') NOT NULL,
  ADD COLUMN `sub_type` ENUM('fishing','camping','checkin') NULL,
  ADD INDEX `discoveries_city_code_scene_sub_type_idx` (`city_code`,`scene`,`sub_type`);
ALTER TABLE `rankings`
  MODIFY `scene` ENUM('drive','fish','play','wash') NOT NULL;
```

### 回填（Migrate，示意）

```sql
-- dry-run: SELECT COUNT(*) / 样本 id，先输出报告再由人工确认
UPDATE `discoveries`
   SET `scene`='play', `sub_type`='fishing'
 WHERE `scene`='fish' AND `sub_type` IS NULL;
UPDATE `rankings` SET `scene`='play' WHERE `scene`='fish';
```

`City.scenes` JSON（4 城市）与 `SystemConfig.scene_tabs`（含 fish 隐藏项）由脚本读取、替换 `fish → play`、写回前做幂等判断；seed 源码中的 3 条 fish 记录、2 条 fish ranking、`fishingCities` 白名单同步修改。`favorites` 表无 scene 列，通过 `discovery.scene` 关联，无需改写。

**Contract 不在本 Change**：确认 `SELECT COUNT(*) WHERE scene='fish'` 为 0 且旧包占比可忽略后，另开 Change 移除 enum 值并清理兼容映射。

## 后端设计

- 分层不变：`Controller` 只做校验与委派；`RoutesService` / `UserService` / `AdminService` 承载用例；`PrismaDiscoveryRepository` 在 Infrastructure 层。
- `discovery.repository.ts` 接口改为 `find(id: string, scenes: Scene[], subType?: PlayType)`；`list(scene, limit, cityCode?, subType?)` 增加可选子类型；保留 `DiscoveryScene` 类型但扩为 4 值。
- `RoutesService`：
  - `list()`：先 `normalizeScene()`，再按 `sceneTabs.enabledScenes()` 与 `subType` 过滤；隐藏分类短路返回 `[]`。
  - `route(id)`：`find(id, ['drive','play','wash'])`，排除 `fishing` 子类型专属字段走通用投影。
  - `spot(id)`：`find(id, ['fish','play'], 'fishing')`，保留水深/岸线/钓具等字段。
  - `toCard()` / `detail()`：投影判断从 `scene === 'fish'` 改为 `subType === 'fishing'`，并输出 `subType` 字段。
- `UserService.favorites()`：同样 `normalizeScene()`；`FavoriteItem.type` 由 `subType === 'fishing' ? 'spot' : 'route'` 决定，`subtitle` 去掉二元假设。
- `AdminService`：`createRoute` / `updateRoute` / `routes` / `validateCoverRoutes` / `updateCityScenes` 的 scene 白名单统一引用 `common/scenes.ts`；默认封面按 3 类分组。
- `SceneTabsConfigService`：`SCENE_WHITELIST` 扩为 3 项、默认配置 3 项全启用、`@ArrayMaxSize(3)`、残留 `fish` 配置读取时兜底并记录 `scene_tabs_config_invalid`。
- 结构化日志事件：`scene_legacy_mapping`、`scene_subtype_invalid`、`scene_backfill_batch`、`scene_tabs_list_denied`；低基数标签，不记录用户输入原文。

## API 与契约

- 既有接口扩展（delta）：
  - `GET /v1/routes?scene=&subType=`、`GET /v1/user/favorites?scene=&subType=`：scene 枚举 + 可选 subType。
  - `GET /v1/routes/:id`、`GET /v1/spots/:id`：内部按 scene 集合放行，对外路径与参数不变。
  - `GET /v1/admin/routes?scene=&subType=`、`POST/PATCH /v1/admin/routes`：scene 枚举 + subType。
  - `GET /v1/config/scene-tabs`、`GET/PUT /v1/admin/config/scene-tabs`：默认 3 项、items 上限 3。
- 新错误码：`SCENE_SUBTYPE_INVALID`（422，`FR-EXP-002`）；`COMMON_VALIDATION_FAILED` 与 `CONFIG_VERSION_CONFLICT` 沿用。
- 契约文件：`contracts/openapi.yaml` 登记已确认 operationId 的 3 个 scene_tabs 接口与 `getFishingSpotDetail`；其余既有接口 delta 在实现阶段先核对运行时 operationId 再补入，避免编造。实现阶段必须把该契约追加到 `apps/api/src/scripts/verify-openapi-contract.ts` 的 `contractPaths`（DEC-E11）。
- 兼容分类：`breaking-compatible`（枚举收窄为扩展 + 响应新增 `subType` 字段，additive；`fish` 读兼容）。

## 前端设计

### 运营后台「路线列表」

- 筛选区：`[全部 | 粗门溜车 | 粗门玩玩 | 粗门洗车]`，选中 `play` 时显示二级 `[全部 | 钓鱼 | 露营 | 打卡]`；`sceneFilter` / `subTypeFilter` 变化重置 `page=1` 并重新加载。
- 新建按钮 3 个：`+ 新建溜车路线`、`+ 新建玩玩路线`、`+ 新建洗车路线`；`openCreate(scene)` 按场景初始化表单。
- 表单：`form.scene`（3 值）+ `form.subType`（仅 play 显示，且必选）；`collectPayload()` 按 `subType === 'fishing'` 决定钓点字段组，其余按路线字段组；`lockedScene` 编辑时保持不变。
- 场景标签 `sceneLabel()` 改为映射表而非三元表达式；空数据展示引导文案（`AC-EXP-004`）。
- 「系统配置 / 首页分类目录」页：默认 3 项、`sceneName()` 映射表、「恢复默认」文案改为「仅按默认 3 个分类显示」。
- 城市页、榜单页场景下拉同步 3 值；`City.scenes` 仍只作资料标记。

### 小程序

- `types/domain.ts`：`Scene` 扩为 4 值（含兼容 fish）、新增 `PlayType`、`RouteCard.subType?: PlayType | null`、`FavoriteItem.subType`。
- `useSceneTabs.ts`：白名单 3 项；**两层默认**（服务端默认 3 项 / 本地故障兜底仅 `drive`）；`useDiscovery.ts` 的 `listCacheKey` 加入 `subType`，`prefetch` 按启用分类裁剪（已有逻辑保留）；配置失败降级到仅 `drive`，详见「裁决后的设计修订」。
- `SceneTabs.vue` 不改结构，仅由 props 接收 3 项；`SceneTabsConfigView` 已可配置显隐/名称/排序。
- 详情页分流：`(item.scene === 'play' || item.scene === 'fish') && item.subType === 'fishing'` → `fishing-detail?spotId=`；其余 → `route-detail?routeId=`。收藏页同规则，但优先用 `FavoriteItem.type`。
- `mock.ts` 3 条钓点补 `scene: 'play', subType: 'fishing'`；`fishing-detail` 的 `favorites('fish')` 改为 `favorites('play')` 并兼容旧服。
- **不新增页面**（DEC-E07）；H5 与 MP 双端构建都要通过。

## 安全与隐私

- 服务端 Guard 对每个受保护用例重新授权；前端隐藏按钮不构成授权。
- DTO 保留 `whitelist` / `forbidNonWhitelisted` / `transform`，新增 `subType` 用 `@IsIn` + `@ValidateIf` 组合校验；`assertSceneSubType()` 二次执行。
- 回填脚本不输出真实用户数据样本（只输出 id 与行数），不记录 Secret；日志沿用 requestId/traceId。
- 不新增 Secret、权限码或第三方依赖。

## UI/UX、文案、目标端与可访问性

- 品牌文案：粗门溜车 / 粗门玩玩 / 粗门洗车；子类型：钓鱼 / 露营 / 打卡。
- 空态：`该分类暂无内容，去后台新建一条吧`（小程序）/ `暂无符合条件的路线`（后台）。
- 3 个 tab 保留 `role="tablist"` / `role="tab"` / `aria-selected`；二级筛选可键盘操作并有可见焦点；触控高度不低于现状 70rpx。
- 主目标端微信小程序（体验版/真机）；H5 回归；后台 Chrome。App 端 `not-required` 由产品 Gate 裁决。

## 性能、容量、SLI/SLO 与观测

- 新增 `(city_code, scene, sub_type)` 索引前评估现有行数与 DDL 锁；列表查询 P95 目标 ≤ 200ms（`NFR-PERF-001`）。
- 回填为一次性批处理，须记录行数、锁等待、执行时长、复制延迟、磁盘占用；禁止无界更新，必要时按 id 分批。
- SLI/SLO 见 `operations/slo.yaml`；生产 APM 缺口由 Operations Gate 显式裁决，不写成已通过。

## 备份恢复、RPO/RTO 与 Incident

- 回填前创建备份点并导出受影响 id 清单；RPO 沿用现有 MySQL 备份，RTO 目标 ≤ 15 分钟（反向 SQL 限定 id 清单）。
- 误迁移止损：停止写入 → 按清单反向恢复 → 只读校验 → 重新执行回填；不删除任何数据。
- 详细见 `operations/disaster-recovery.md`、`operations/incident-plan.md`、`release/rollback-plan.md`。

## 发布、迁移和回滚

1. **Expand Migration**（需生产授权与备份点）→ 2. **API 发布**（含兼容映射，默认配置 3 项）→ 3. **数据回填**（维护窗口、dry-run 先行）→ 4. **管理后台发布** → 5. **小程序构建上传 → 体验版 UAT → 微信审核 → 正式发布**。
2. 停止阈值：回填行数不符、5xx 上升、分享详情不可用、首页 0 分类、配置接口错误率 > 0.1%。
3. 回滚：数据层用备份点 + id 清单反向恢复；代码层 API/后台 revert；小程序包不可瞬时回滚，依赖默认配置与兼容映射兜底。
4. 服务器 `Deploy production` 不改变用户手机端代码包；C 端 3 个 tab 必须等小程序正式发布。
5. `CHG-HOME-CATEGORY-001` 不单独发布（DEC-E10），与本 Change 一起验证与发布。

## 备选方案与决策

| 方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| 单层枚举 drive/play/wash，把钓鱼/露营/打卡塞进 `tags Json` | 少一列、少一次 DDL | 无法强校验、无法稳定筛选、无法保证 `play` 与子类型的组合不变量 | 否决（DEC-E01） |
| 新增 `subType` 显式枚举列 | 可校验、可索引、可筛选、可迁移 | 多一列与一次 DDL | **采用** |
| 直接把 `fish` 改名 `play` 并移除 enum 值 | 数据模型最干净 | 旧包立即 422、无法滚动共存、违反 `AGENTS.md` §9 | 否决（DEC-E02/E09） |
| 保留钓鱼为第 4 个顶层 tab | 改动最小 | 与用户「3 个 tab」口径冲突 | 否决 |
| 新增洗车/玩玩独立详情页 | 体验可定制 | 扩大发版范围与审核风险、一期无数据 | 否决（DEC-E07） |
| 子类型也做小程序第三层 tab | 筛选更细 | 用户未要求、UI 复杂度上升 | 否决（DEC-E08） |
| 把 `CHG-HOME-CATEGORY-001` 单独先发布 | 交付节奏快 | 与新枚举/默认配置冲突，旧包与新服不一致 | 否决（DEC-E10） |

## 未决问题

- Q-E04（生产回填授权与维护窗口）仍开放；Q-E01 ~ Q-E03 与四条冲突已于 2026-11-08 逐条裁决并落盘，待需求/设计 Gate 书面确认。
- 裁决后的设计修订见下节；需求/设计 Gate 已批准，实现按 `06-tasks.md` 依赖顺序推进；生产 Migration 与回填仍需单独授权。

## 裁决后的设计修订（2026-11-08）

1. **两层默认（冲突 2）**：`useSceneTabs.ts` 拆分为「服务端默认 3 项」（仅用于契约对齐与测试）与「本地故障兜底仅 `drive`」（用于配置接口 404 / 5xx / 超时 / 配置损坏 / 旧服）。`normalize()` 白名单扩为 `drive` / `play` / `wash`，但服务端下发含 `fish` 的旧配置仍按校验失败处理并走兜底；`.catch()` 与损坏配置路径一律返回 `FALLBACK_SCENE_TABS`，**不得**返回内置 3 项默认。`SceneTabsConfigService.DEFAULT_ADMIN_SCENE_TABS` 改为 3 项全启用；「恢复默认」提交该 3 项。`NFR-COMPAT-001` 与 `AC-EXP-014` 阈值按「新包+新服 3 项、其余组合至少 `drive` 可用且无 422」修订。
2. **详情与过滤（冲突 3）**：`route(id)` / `spot(id)` 保持不调用 `enabledScenes()`，只把 `find(id, scene)` 改为 `find(id, scenes[], subType?)`；`scene=fish` 兼容映射在 `list()` / `favorites()` 入口完成后仍必须命中 `enabledScenes()` 短路；`toCard()` / `detail()` 中水深、岸线、海拔等字段判定改为 `subType === 'fishing'`。
3. **白名单与 enum（冲突 1）**：`common/scenes.ts` 导出 `BUSINESS_SCENES`（3 值，可写）与 `LEGACY_SCENES`（`fish`，只读）；DTO `@IsIn(BUSINESS_SCENES)`，读取 DTO 接受 `SceneQuery`（4 值）；`enum Scene` 在 Expand 期为 4 值，业务写入白名单是其子集。运营不能通过配置新增 scene。
4. **发布归属（冲突 4，方案 A）**：`CHG-HOME-CATEGORY-001` 的代码并入本 Change，不单独完成 / 发布；其验证、UAT、安全、发布证据归入本 Change 的验证计划与发布 Gate 记录，DEC-E12 覆盖原 DEC-012 的发布顺序；上一 Change 的 Gate 值不自动推进。
- 实现阶段核对 MySQL 版本对 `MODIFY ENUM` 的在线 DDL 支持；若不支持，须在发布 Gate 前给出维护窗口方案。
- 契约中既有接口的 operationId 需实现阶段核对后再补入 delta，不得编造。
