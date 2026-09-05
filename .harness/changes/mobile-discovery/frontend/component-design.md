# 前端组件设计

| 组件/页面 | 职责 | Props/Events | 状态归属 | API 依赖 | 测试 |
|---|---|---|---|---|---|

## Pinia 与 composable 变化

## 请求竞态、取消与重复提交

# 前端组件设计

- `BrandHeader`：通过 props 接收城市、loading、fallback；仅负责抽屉与选择事件，Pinia 保存最近城市。
- `useDiscovery`：持有 scene/list/city/status；请求捕获 city/scene/sequence，只有最新且页面 active 的响应可以提交。
- `DiscoveryCard`/`DetailHero`：fish 使用 `depthM`，drive 使用 `elevationM`；可空值展示 `--`；距离统一标记为“参考”。
- `index.vue`：组合 loading、empty、error、fallback/retry，不把空数组与网络失败混为一类。
- 详情页：同 ID 网络失败可本地降级，404/scene 不匹配显示错误；钓点“立即出发”直接使用宿主系统地图。

组件不得自行请求 API；列表排序完全接受服务端顺序。
