# 影响分析

| 区域 | 是否影响 | 当前事实 | 拟议变化 | 风险 | 验证 |
|---|---|---|---|---|---|
| uni-app 页面/分包 | 是 | 首页与两个详情页已注册 | 补全状态、准确文案和重试；不新增路由 | 旧响应覆盖、fallback 混淆 | composable/组件/H5 E2E、双端 build |
| Vue 组件/Pinia | 是 | BrandHeader 读静态城市，DiscoveryCard 错用水深 | API 城市、scene-specific 指标、latest-wins | 持久化旧 city 不在 enabled 名单 | unit/component |
| HTTP API | 是 | 4 个公开 GET 存在但未冻结 | DTO、Presenter、operationId、稳定 404/422 | 旧客户端字段兼容 | runtime OpenAPI + E2E |
| NestJS 模块 | 是 | RoutesService/City Controller 直接 Prisma | 最小 Application Service + Prisma repository adapter | Provider 注入/查询回归 | unit + MySQL integration |
| MySQL/迁移 | 否 | City/Discovery 字段足够 | 只改查询与 select，不改 schema | 当前索引 `[cityCode,scene]` 后接 status/order 可能需观察 | integration + query review |
| Redis | 否 | 未采用 | 不引入 | 无 | 架构设计 not-required |
| RabbitMQ | 否 | 未采用 | 不引入 | 无 | 架构设计 not-required |
| 权限/隐私 | 是 | 公开只读 | Presenter 最小字段；不读取位置 | 内部权重/状态泄露 | contract/security review |
| 监控/部署 | 低 | requestId 已有 | 不新增部署；证据记录错误码 | 无生产指标 | 本地日志；Operations pending |
| 旧客户端/消费者 | 是 | mobile 使用完整 Prisma shape | 保留字段名并新增可选 `depthM`；不删除字段 | 排序行为修正可见 | H5/微信 build + API regression |
| UI/UX、文案、可访问性 | 是 | loading 有，empty/error/fallback 不完整 | 增加状态区、重试、参考距离、键盘语义 | 视觉偏差 | component + H5 人工/UAT |
| 产品 UAT、目标端可获得性 | 是 | H5 已可跑，微信仅构建 | H5 E2E；微信真机仍 pending | 不能用 H5 替代微信 | 分离证据 |
| CI、依赖、SBOM、供应链 | 低 | active gate；Vite 2 high | 不新增运行时依赖 | 安全总 Gate仍失败 | full quality gate |
| SLO、容量、告警、Runbook | 未知/发布阻塞 | 无生产基线 | 本 Change 只设置 limit 上限和稳定查询 | 不能宣称生产性能 | Operations Owner 后续 |
| 备份恢复、灾备、Incident | 无新增 | 无 schema/写入 | 无迁移与数据写 | 生产发布仍需全局能力 | Release 保持 pending |

