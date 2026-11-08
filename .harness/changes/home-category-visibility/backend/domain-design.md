# 后端领域设计

## 受影响模块和聚合

| 模块 | 变化 | 依赖方向 |
|---|---|---|
| `modules/config` | 新增 `SceneTabsConfigService`（校验、白名单、兜底、投影、启用集合），`ConfigController` 新增 `GET scene-tabs` | Controller → Application Service → `PrismaService`（Infrastructure） |
| `modules/admin` | `AdminController` 新增 GET/PUT `config/scene-tabs`；`AdminService` 调用 `SceneTabsConfigService.update()` | Controller → Application → 同一 Config 服务；Guard 在 Controller 之前 |
| `modules/routes` | `RoutesService.list()` 在查询前调用 `enabledScenes()`，隐藏场景短路返回 `[]` | Application → Config 服务；**详情用例不引用** |
| `modules/user` | `UserService.favorites()` 同样短路返回 `[]` | Application → Config 服务 |
| `modules/admin-auth` | 无变化 | 复用 `config:read` / `config:write` 与 `RequireAdminPermissions` |
| Prisma schema | 无变化 | 复用 `SystemConfig(key, value Json, updatedAt)` |

聚合边界：配置是**单一键值聚合**（`scene_tabs`），不是按分类拆分的实体集合；所有写入以整份 `items` 替换，避免部分更新导致中间态。`City.scenes` 属于城市资料聚合，本 Change 不参与其读写行为。

## 用例输入/输出

| 用例 | 输入 | 输出 | 调用方 |
|---|---|---|---|
| `publicView()` | 无 | `{ revision, updatedAt, items: [{scene,label,sort}] }`，仅启用项 | 公开 `GET /v1/config/scene-tabs` |
| `adminView()` | 无 | `{ revision, updatedAt, items: [{scene,label,enabled,sort}] }`，全量 | 管理端 GET |
| `update(input, expectedUpdatedAt, actor)` | `items[]`、`expectedUpdatedAt`、操作者 | 新的 `adminView()`；失败抛 409/422 | 管理端 PUT |
| `enabledScenes()` | 无 | `Set<'drive' \| 'fish'>` | `RoutesService.list`、`UserService.favorites` |

`DEFAULT_SCENE_TABS`（读取端兜底，同时是「恢复默认」的内容）：

```text
revision = 0
updatedAt = null
items = [
  { scene: 'drive', label: '粗门溜车', enabled: true,  sort: 10 },
  { scene: 'fish',  label: '粗门钓鱼', enabled: false, sort: 20 }
]
```

## 业务不变量和状态转换

- `scene ∈ {drive, fish}`、`scene` 不重复、`label` 去首尾空白后 1-12 字符、`sort` 为 0-9999 整数、`revision` 非负整数。
- `enabled=true` 的项至少 1 个；排序按 `sort` 升序、同值按 `scene` 字典序，保证响应稳定。
- 状态：`unset`（无记录）→ `configured(N)` → `configured(N+1)`；校验失败/并发冲突保持原状态；JSON 损坏时读取时降级为 DEFAULT 但**不改写数据库**，由运营重新保存修复。
- 隐藏场景的列表响应是「成功 + 空数组」，不是错误；这是对外契约的一部分，避免旧客户端把 4xx 当作故障。

## Repository/服务端口

- 端口方法：`readConfig(): Promise<SceneTabsConfig | null>`、`writeConfig(value, expectedUpdatedAt): Promise<boolean>`（布尔表示条件更新是否命中）。
- Prisma 实现：`findUnique({ where: { key: 'scene_tabs' } })`；写入用 `updateMany({ where: { key, updatedAt: new Date(expectedUpdatedAt) }, data: { value: nextValue } })`，无记录时用 `create()` 并捕获唯一键冲突为 409。
- 不直接返回 `SystemConfig` 实体；统一投影为 `publicView/adminView`，`publicView` 不暴露 `enabled=false` 项。
- 不新增 Repository 查询：列表用例在一次请求内调用一次 `enabledScenes()`，避免 N+1。

## 事务、并发和幂等

- 写入边界是单个 `updateMany` 条件更新；不在数据库事务内等待任何外部 HTTP / Redis / RabbitMQ（本 Change 均无）。
- 并发 token 是 `updatedAt`（Prisma `@updatedAt` 自动推进），`count === 0` 判定冲突；`revision` 只用于展示与排障，避免依赖 Prisma JSON 条件过滤的兼容性。
- 幂等：相同 `expectedUpdatedAt` 的重复 PUT 只有第一次成功，第二次 409（可预期失败，不产生重复记录）；不做「静默成功」式幂等，以便运营察觉并发。
- 读取无副作用：损坏配置只记录日志并返回 DEFAULT，不自动修复数据库。

## 领域事件

无。DEC-008 与 ADR-006 决定不引入 RabbitMQ；`contracts/events.yaml` 为空。成功写入、校验失败、并发冲突、隐藏场景拒绝均通过结构化日志记录（`05-design.md` 可观测性），日志不构成事件契约。
