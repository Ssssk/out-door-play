# 前端页面流

## 目标平台

| 端 | 范围 | 是否需目标端证据 |
|---|---|---|
| 微信小程序 | 首页、收藏页分类胶囊；配置拉取；列表/预取/缓存；详情直达 | 是（体验版/真机，主目标端） |
| H5（uni-app 构建） | 同一份实现，不依赖小程序专属 API | 是（构建与冒烟，不作主验收端） |
| 运营管理后台 Web（Chrome） | 新增「首页分类目录」配置页、菜单、路由、权限 | 是（浏览器 E2E） |
| App | 不在本期支持矩阵 | 否（`not-required` 由产品 Gate 裁决） |

## 页面/路由/分包变化

- 小程序：**不新增页面、不改 `pages.json`、不改分包、不改底部 `tabBar`**；只改组件 props、composable 与两个既有页面。
- 分享路径不变：`/pages/route-detail/index?routeId=...`、`/pages/fishing-detail/index?spotId=...`、路线地图页 `routeId` 参数保持原样（`FR-CFG-005`）。
- 后台：`apps/admin/src/router/index.ts` 新增 `system-config/scene-tabs`（`name: SceneTabsConfig`，`meta.permission: config:read`）；`apps/admin/src/layout/AdminLayout.vue` 的「系统配置」组新增菜单项 `/system-config/scene-tabs`「首页分类目录」；原 `/system-config`「上传二维码」保持不变。
- 后台面包屑由 `PageHeader` 自动生成：`首页 / 系统配置 / 首页分类目录`。

## 用户流程

1. 运营登录后台 → 左侧「系统配置」→「首页分类目录」→ 页面 `GET` 拉取全量配置，展示 `revision` / `updatedAt` 与表格。
2. 运营编辑名称、启停、排序 → 本地校验 → 点击保存 → `PUT` 带 `expectedUpdatedAt` → 成功提示「保存成功，小程序端下次进入首页生效」，表单 token 刷新；冲突则提示并自动重拉。
3. C 端用户冷启动或从其他页面返回首页/收藏页 → `onShow` 拉取公开配置 → 更新胶囊与选中态 → 并行刷新列表；隐藏场景不出现在 tab、列表与预取中。
4. C 端用户从聊天打开已分享的隐藏场景详情 → 详情页 `onLoad` 按既有参数加载，完整渲染，不出现分类下线阻断。
5. 运营误配 → 点击「恢复默认」二次确认 → 提交 DEFAULT → C 端下次进入首页恢复。

## 加载、空、错、权限和弱网状态

| 场景 | 小程序首页/收藏页 | 后台配置页 |
|---|---|---|
| Loading | 使用 `cached ?? DEFAULT` 立即渲染，不显示骨架屏；列表保持既有 loading 逻辑 | `v-loading` 覆盖表格，按钮禁用 |
| 空 | 理论上不出现 0 个分类；服务端兜底保证至少 1 项 | 配置记录缺失时 GET 返回 DEFAULT 全量项；若返回 0 行展示「配置缺失，点击恢复默认」 |
| 错误 | 配置 404/5xx/超时/损坏 JSON → 静默回退，不弹阻断弹窗，记录 `console` 级诊断信息 | 错误态卡片 + 重试按钮；保存失败保持表单内容与 token |
| 无权限 | 公开接口无鉴权，不涉及 | `config:read` 缺失由路由 Guard 跳 Forbidden；仅 read 账号输入禁用、保存/恢复默认按钮隐藏 |
| 弱网 | 请求超时走兜底；不重试风暴；列表请求不等待配置 | 沿用 `api/client.ts` 15s 超时与统一错误提示 |
| 重复提交 | 配置请求 `inflight` 去重 | `saving` 期间按钮禁用；服务端条件更新兜底 |
| 卸载竞态 | `onUnload` 后不写回状态、不触发 `changeScene` | 离开页面不写共享状态 |

## Wot Design Uni 组件与主题使用

- 小程序端不新增基础组件，保留 `SceneTabs.vue` 的原生 `view` / `button` 与现有 CSS 变量（`--chumen-ink`、`--chumen-lime`、`--chumen-canvas`、`--chumen-muted`、`--chumen-top-inset`）；不复制 Wot Design Uni 组件实现。
- 后台使用既有 Element Plus（`el-table`、`el-input`、`el-input-number`、`el-switch`、`el-tag`、`el-button`、`ElMessage`、`ElMessageBox`），不新增 UI 依赖。
- 配置页不引入新设计 Token；沿用 `PageHeader` 与既有 panel 样式。

## 跨端差异和真机验证

- 本 Change 不使用平台专属能力，无需 `#ifdef MP-WEIXIN`；H5 与小程序共用同一请求与组件实现，双端构建都要通过。
- 小程序端属性一律使用 camelCase props（`tabs`、`modelValue`），避免小程序编译对 kebab-case 属性透传的不确定性（历史经验见本次会话 AdSlot 组件）。
- 真机/体验版必须验证：胶囊吸顶与安全区（含状态栏/胶囊区）、`onShow` 返回后配置生效、下拉刷新、隐藏场景详情分享直达、弱网兜底。
- 后台必须验证：Chrome 键盘操作与可见焦点、409 冲突提示、只读账号视图、恢复默认二次确认。
- 小程序改动必须重新构建上传并发版后才能被线上用户看到；服务器部署不改变已安装代码包（`release/release-plan.md`）。
