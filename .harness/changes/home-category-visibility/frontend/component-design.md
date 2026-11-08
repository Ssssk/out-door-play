# 前端组件设计

| 组件/页面 | 职责 | Props/Events | 状态归属 | API 依赖 | 测试 |
|---|---|---|---|---|---|
| `SceneTabsConfigView.vue`（新增，后台） | 分类配置的查看、编辑、保存、重置、恢复默认；权限与状态展示 | 无 props；内部 `loading / saving / dirty / error / canWrite / form / token` | 页面局部 `ref`（沿用 `QrConfigView.vue` 范式，不进 Pinia） | `GET/PUT /v1/admin/config/scene-tabs` | 后台 E2E：保存生效、只读权限、409、重复提交、错误态 |
| `PageHeader.vue`（复用，后台） | 面包屑与标题 | `title="首页分类目录"`、`group="系统配置"`、`description`；默认插槽放按钮 | 无 | 无 | 快照/渲染断言 |
| `SceneTabs.vue`（改造，小程序） | 渲染分类胶囊、吸顶容器、选中态、点击节流与 a11y | 新增 `tabs: SceneTabView[]`；保留 `modelValue: Scene` 与 `update:modelValue` | 无内部业务状态（仅 `lastClick` 节流时间戳） | 无（由父级注入配置） | 组件测试：空/单项/多项、隐藏项不渲染、选中态、a11y 属性、点击节流 |
| `useSceneTabs.ts`（新增 composable，小程序） | 拉取配置、进程内缓存、去重、失败兜底、卸载竞态保护 | `refresh(): Promise<SceneTabsConfigView>`、`current: Ref<SceneTabsConfigView>`、`enabledScenes: ComputedRef<Scene[]>` | 模块级 `cached` / `inflight` + 页面生命周期 `active` | `GET /v1/config/scene-tabs` | 组件测试：404/5xx/超时/损坏 JSON、并发 `onShow`、卸载后不写状态 |
| `useDiscovery.ts`（改造，小程序） | 首页列表、缓存、预取、场景切换、选中态校正 | `scene / changeScene / loadRoutes` 保持不变；内部接入 `useSceneTabs` | composable 内 `ref` | `GET /v1/routes`、`GET /v1/config/scene-tabs` | 既有 `useDiscovery.spec.ts` 扩展：预取裁剪、缓存 key 含 revision、配置失败仍加载列表 |
| `pages/index/index.vue`（改造，小程序） | 首页生命周期与用例组合 | 向 `SceneTabs` 传 `:tabs`；`openDetail` 分流逻辑不变 | 页面局部 | 无新增 | 目标端人工 `AC-CFG-001`、`AC-CFG-002` |
| `pages/favorites/index.vue`（改造，小程序） | 收藏页生命周期与用例组合 | 向 `SceneTabs` 传 `:tabs`；配置到达后校正 `scene` 并 `load()` | 页面局部 `ref` | `GET /v1/user/favorites`、配置接口 | 组件测试 + 目标端人工 `AC-CFG-007` |
| `CitiesView.vue`（文案修正，后台） | 城市资料维护 | 不变 | 不变 | 不变 | 后台人工核对 `AC-CFG-015` |

## Pinia 与 composable 变化

- **不新增 Pinia store**。`scene` 目前只在 composable、页面局部 `ref` 与 `types/domain.ts` 中（`apps/mobile/src/stores` 检索 `scene` 为 0 命中），为一份低频、跨两个页面共享的只读配置引入全局 store 会扩大状态面。
- 新增 `apps/mobile/src/pages/index/useSceneTabs.ts`，被首页与收藏页共用；模块级 `cached` 与 `inflight` 保证同一时刻只有一个配置请求，页面卸载后通过 `active` 标志阻止过期响应写回。
- 后台沿用 `apps/admin/src/stores/auth.ts` 的 `hasPermission`，不新增权限状态。
- 小程序 `listCacheKey` 从 `routes:${cityCode}:${scene}` 扩展为 `routes:${cityCode}:${scene}:${revision}`，避免隐藏场景数据从旧缓存复活（`FR-CFG-009`）。

## 请求竞态、取消与重复提交

- 小程序 `onShow` 可能连续触发：`useSceneTabs.refresh()` 用模块级 `inflight` Promise 复用请求；配置刷新与列表刷新并行发起，配置失败不 `await` 阻塞列表，避免首屏串行等待。
- 页面 `onUnload` 置 `active = false`，迟到的配置响应不写回 `current`，也不触发 `changeScene`（卸载竞态）。
- 配置到达时若当前 `scene` 已隐藏，一次性校正为首个启用项并重新加载列表；校正使用去重判断，避免 `watch` 与 `onShow` 互相触发死循环。
- 后台 `saving` 期间禁用保存/恢复默认按钮；请求失败保留表单内容与 `expectedUpdatedAt`，409 时自动 `load()` 重拉并清空 dirty；离开页面不写回任何共享状态。
- 弱网与超时由现有 `apps/admin/src/api/client.ts`（15s timeout）与小程序 `common/request.ts` 统一处理；前端不实现自定义重试风暴，配置接口失败一律走兜底。
- 所有异步交互覆盖 loading、empty、error、无权限、弱网、重复提交与卸载竞态，符合 `AGENTS.md` §7。
