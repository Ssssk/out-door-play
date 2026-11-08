# 后端领域设计

## 受影响模块和聚合

| 模块 | 变化 | 依赖方向 |
|---|---|---|
| `common/scenes.ts`（新增） | 唯一事实来源：`BUSINESS_SCENES`、`LEGACY_SCENES`、`PLAY_SUBTYPES`、`normalizeScene()`、`assertSceneSubType()` | 被 DTO / 用例 / Repository 引用，不依赖 NestJS 或 Prisma |
| `modules/routes` | `RoutesService` 兼容映射、3 类列表与详情放行；`PrismaDiscoveryRepository` 查询加 subType；`DiscoveryRepository` 端口签名变化 | Controller → Application → Infrastructure |
| `modules/user` | `UserService.favorites()` 兼容映射与投影 | Application → 同一 `common/scenes.ts` |
| `modules/admin` | DTO 白名单、封面分组、`validateCoverRoutes`、`updateCityScenes`、routes 列表查询 | Controller → Application |
| `modules/config` | `SceneTabsConfigService` 白名单 3 项、默认 3 项、残留 fish 兜底 | Controller → Application → Prisma |
| `prisma/schema.prisma` | `enum Scene` 扩展、`enum PlayType` 新增、`Discovery.subType` 与索引、`rankings.scene` 同步 | Infrastructure |

聚合边界：`Discovery` 是内容聚合根；`scene` 与 `subType` 是其分类属性，不是独立实体。`Favorite` 通过 `discoveryId` 关联，不存储 scene，因此无需迁移。`SystemConfig.scene_tabs` 是单一键值聚合，沿用 `revision` / `expectedUpdatedAt` 乐观锁。

## 用例输入/输出

| 用例 | 输入 | 输出 |
|---|---|---|
| `normalizeScene(raw)` | `scene` 字符串（含兼容值 fish） | `{ scene: BusinessScene, subType?: 'fishing' }`，未知值抛 422 |
| `assertSceneSubType(scene, subType)` | 场景 + 子类型 | 通过或抛 `SCENE_SUBTYPE_INVALID` |
| `RoutesService.list(scene, limit, city?, subType?)` | 兼容映射后的参数 | `DiscoveryCard[]`，隐藏分类返回 `[]` |
| `RoutesService.route(id)` | id | `find(id, ['drive','play','wash'])` 的通用详情 |
| `RoutesService.spot(id)` | id | `find(id, ['fish','play'], 'fishing')` 的钓点详情 |
| `UserService.favorites(userId, scene, subType?)` | 同上 | `FavoriteItem[]`，`type` 由 `subType === 'fishing'` 决定 |
| `SceneTabsConfigService.publicView()` | 无 | 3 项默认或配置后的启用分类 |

## 业务不变量和状态转换

- 新写入 `scene ∈ {drive, play, wash}`；`fish` 只读兼容。
- `scene=play` ⇔ `subType ∈ {fishing,camping,checkin}`；其它场景 `subType === null`。
- 首页分类配置至少 1 个启用项、`revision` 单调递增（沿用既有不变量）。
- 兼容期状态：`fish` 数据可存在（未回填）→ 回填后为 `play/fishing` → Contract 阶段移除 `fish` enum 值。
- 服务端过滤是强制点：隐藏分类列表短路返回 `[]`，但详情用例按 id 查询，不受分类显隐影响。

## Repository/服务端口

- `DiscoveryRepository.find(id, scenes: Scene[], subType?: PlayType)`：Infrastructure 实现为 `where: { id, scene: { in: scenes }, ...(subType ? { subType } : {}), status:'online', city:{enabled:true} }`。
- `DiscoveryRepository.list(scene, limit, cityCode?, subType?)`：`where` 增加可选 `subType`，依赖新增 `(city_code, scene, sub_type)` 索引，避免无界扫描。
- 不直接返回 Prisma 实体；`toCard()` / `detail()` 统一投影并输出 `subType`。
- 一次请求内只读取一次 `scene_tabs` 配置，避免 N+1。

## 事务、并发和幂等

- 回填在单个可预览批次内执行，条件 `WHERE scene='fish' AND sub_type IS NULL` 保证幂等；不在数据库事务内等待任何外部 HTTP / Redis / MQ。
- 配置保存沿用 `updateMany({ where: { key, updatedAt } })` 条件更新，`count === 0` → 409。
- 路线创建/更新沿用现有接口，无新增幂等键；重复提交由前端按钮禁用与服务端校验兜底。
- 无 Outbox / 事件重放需求（`contracts/events.yaml` 为空）。

## 领域事件

无。兼容映射、非法子类型、回填批次、隐藏场景拒绝均通过结构化日志记录，日志不构成事件契约。
