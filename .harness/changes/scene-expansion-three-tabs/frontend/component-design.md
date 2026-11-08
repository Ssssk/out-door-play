# 前端组件设计

| 组件/页面 | 职责 | Props / 状态 | API 依赖 | 测试 |
|---|---|---|---|---|
| `RoutesView.vue`（改造，后台） | 3 个顶层 tab + play 二级子类型筛选 + 3 个新建入口 + 表单场景/子类型 | `sceneFilter`、`subTypeFilter`、`form.scene`、`form.subType`、`lockedScene` | `/admin/routes` GET/POST/PATCH | 浏览器 E2E：筛选组合、新建 3 类、非法组合提示、空态 |
| `SceneTabsConfigView.vue`（适配，后台） | 首页分类目录配置，默认 3 项 | 沿用 `config`/`revision`/`expectedUpdatedAt` | `/admin/config/scene-tabs` GET/PUT | 后台 E2E：3 项保存、恢复默认、409 |
| `CitiesView.vue` / `RankingsView.vue`（适配，后台） | 城市/榜单场景下拉同步 3 值 | 沿用现有表单 | 既有接口 | 回归：下拉选项与保存 |
| `SceneTabs.vue`（不改结构，小程序） | 渲染服务端下发的 3 个分类胶囊；本地故障兜底时仅渲染 `drive` | `tabs: SceneTabView[]`、`modelValue: Scene` | 无 | 组件测试：3 项渲染、兜底仅 1 项、选中态、a11y |
| `useSceneTabs.ts`（适配，小程序） | 白名单扩 3 项；**两层默认**：服务端默认 3 项（仅契约对齐），本地故障/旧服兜底仅 `drive` | 模块级 `config` / `inflight`，拆分 `SERVER_DEFAULT` 与 `FALLBACK` | `/config/scene-tabs` | 组件测试：404/5xx/损坏配置/旧服一律降级到仅 `drive`，不得回退内置 3 项 |
| `useDiscovery.ts`（适配，小程序） | 缓存 key 加 subType、预取按启用分类、选中态校正 | `scene`、`sceneTabs`、`enabledScenes` | `/routes`、`/config/scene-tabs` | 既有 spec 扩展：3 类预取、隐藏分类不预取 |
| `pages/index/index.vue`（适配，小程序） | 按 scene + subType 分流详情 | `openDetail` | 无新增 | 目标端人工：3 类卡片分流 |
| `pages/favorites/index.vue`（适配，小程序） | 按 `FavoriteItem.type` / subType 分流 | `scene`、`items` | `/user/favorites` | 组件测试：收藏分流 |
| `fishing-detail/index.vue`（适配，小程序） | 钓鱼详情与分享参数保持不变 | `onLoad` 的 `spotId` | `/spots/:id`、`/user/favorites?scene=play` | 目标端人工：分享直达 |
| `route-detail/index.vue`（适配，小程序） | 承载 drive / play 非钓鱼 / wash 详情 | `onLoad` 的 `routeId` | `/routes/:id` | 目标端人工 |

## 状态归属与共享

- 后台不引入新 Pinia store；筛选与表单状态留在页面局部 `ref`。
- 小程序分类配置继续由 `useSceneTabs.ts` 的模块级共享快照承载，首页与收藏页共用；`subType` 筛选状态留在各自页面。
- `Scene` / `PlayType` 类型在 `apps/mobile/src/types/domain.ts` 与 `apps/admin/src/types/admin.ts` 各自定义，与后端 `common/scenes.ts` 由契约测试与静态检索断言一致。

## 请求竞态、取消与重复提交

- 后台筛选变化重置 `page=1` 并重新加载；请求进行中禁用重复触发，失败保留筛选条件与错误态重试入口。
- 小程序 `onShow` 配置请求沿用 `inflight` 去重与卸载保护；配置刷新与列表刷新并行；失败一律降级到 `FALLBACK_SCENE_TABS`（仅 `drive`），不用内置 3 项默认。
- `listCacheKey` 从 `routes:${city}:${scene}:${revision}` 扩展为 `routes:${city}:${scene}:${subType ?? 'all'}:${revision}`，避免子类型筛选命中错误缓存。
- 所有异步交互覆盖 loading、empty、error、无权限、弱网、重复提交、卸载竞态（`AGENTS.md` §7）。
