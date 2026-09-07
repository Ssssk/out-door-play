# 影响分析

| 区域 | 是否影响 | 当前事实 | 拟议变化 | 风险 | 验证 |
|---|---|---|---|---|---|
| uni-app 页面/分包 | 是 | 8 个页面；fish 列表复用首页场景，无独立 fishing page | 按批准范围拆分页面/分包和端能力矩阵 | spec 与 pages.json 不一致 | 路由清单、H5/微信构建、目标端 E2E |
| Vue 组件/Pinia | 是 | 有共享卡片/页头/详情组件与 app store | 按垂直 Change 复用或重构 | 旧组件与新原型漂移 | 组件测试、视觉回归、状态隔离 |
| HTTP API | 是 | `/v1` 下城市、路线、钓点、油价、用户和 admin 接口 | 固定 OpenAPI、错误码、认证、幂等和兼容 | 当前响应协议和 PRD 字段可能漂移 | OpenAPI diff + 契约测试 |
| NestJS 模块 | 是 | health/cities/routes/fuel/user/admin；Controller/Service 直接依赖 Prisma | 按业务能力建立 API/Application/Domain/Infrastructure 边界 | 重构范围大 | 单元、模块和集成测试 |
| MySQL/迁移 | 是 | Prisma schema 与 3 个迁移，MySQL 8.4 本地容器 | ORM 决策后制定兼容迁移 | TypeORM/Prisma 双轨或数据丢失 | schema diff、upgrade、reconcile、restore |
| Redis | 未知 | 未接入 | 仅对明确缓存/会话/限流用例引入 | 空接入增加复杂度 | 降级、TTL、一致性集成测试 |
| RabbitMQ | 未知 | 未接入 | 报表/审核/埋点等确需异步时再设计 | 无消费者 Owner/DLQ | confirm、幂等、重试、DLQ 测试 |
| 权限/隐私 | 是 | 未发现 Guard/JWT/Session；写接口可见 | 设计用户会话、Admin RBAC、资源授权、审计 | P1：未授权写/管理操作 | 401/403/越权/限流/审计测试 |
| 监控/部署 | 是 | requestId envelope；本地 Docker MySQL | 结构化日志、Trace、健康、制品和部署流程 | 无生产拓扑 | 观测验收和故障注入 |
| 旧客户端/消费者 | 是 | H5/微信构建；其他端只有构建入口 | 明确首批目标端和兼容窗口 | 误宣称全端支持 | 目标端矩阵与真机证据 |
| UI/UX、文案、可访问性 | 是 | 已有高对比设计与 HTML 原型 | 以 v1.1 原型和 Wot/Element Token 实现 | 原型版本与代码不一致 | 截图比对、键盘/焦点/对比度 |
| 产品 UAT、目标端可获得性 | 是 | 原 PRD 标 READY，但无 Harness UAT | 每个垂直 Change 冻结候选制品后验收 | 产品范围尚未裁决 | UAT 签收和设备信息 |
| CI、依赖、SBOM、供应链 | 是 | type/test/build 已转绿；组件 CI 与本地小程序插件已存在；project-quality 仍 template；SCA 有遗留风险 | 补 format/lint/contract/integration/e2e/security，并让插件按项目配置执行普通 push 或“本地体验版成功后再 push” | 误加跳过标记会漏发体验版；自动 Git 操作可能覆盖历史 | 临时 bare 远程端到端测试、上传成功/失败阻断、非强制 push、锁文件、SCA/SBOM |
| SLO、容量、告警、Runbook | 是 | 未建立 | 按业务切片量化 | 无法判断发布是否健康 | SLO/告警演练 |
| 备份恢复、灾备、Incident | 是 | 本地 Docker volume；无恢复演练 | 生产方案确定后设计 RPO/RTO | 数据不可恢复风险 | restore drill + Incident tabletop |

## 当前覆盖率结论

- 移动端与 API 已覆盖多数展示主链路，但不是“成品”：真实登录、服务端授权、全面测试、目标端 UAT 和运维缺失。
- 管理后台页面数量较多，但类型检查失败且所有写接口缺少已确认的认证授权。
- 旧实现可作为原型和数据模型资产，不应直接作为发布候选。

