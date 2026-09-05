# 技术设计

> 状态：已批准。2026-08-30 由用户（项目负责人）批准 Requirements Gate 和本架构方向；实现、安全、UAT、运维与发布仍需后续 Gate。

## 目标与非目标

- 目标：建立一条从 v1.1.0 PRD 到垂直 Change 的重建流水线，最大化复用可验证的旧资产。
- 非目标：在本 Change 完成所有业务编码，或为了模板一致性无收益地替换基础设施。

## 当前流程

`uni-app / Vue Admin → NestJS Controller/Service → Prisma → MySQL`。H5/微信可构建，Admin typecheck 失败；无正式认证、Redis、RabbitMQ、CI、UAT 和生产运维证据。

## 目标架构与数据流

批准基线：

```text
mobile uni-app + admin Vue
  -> versioned OpenAPI / stable errors
  -> NestJS modular monolith
       -> Application/Domain ports
       -> Prisma Repository adapter -> MySQL
       -> Redis only for approved cache/session/rate-limit cases
       -> Outbox/RabbitMQ only for approved asynchronous cases
```

后续按垂直业务 Change 渐进分层，不做一次性全仓重写。Prisma 7 与 Prisma Migration 为项目数据访问基线。

## 业务不变量和状态转换

- 上下架、封禁、审核、收藏和报表任务必须使用稳定状态机与资源授权。
- 客户端隐藏入口不构成授权。
- 榜单、油价和统计口径由服务端确定，前端不自行修正业务结果。

## 成功、失败、超时、重复与补偿时序

在后续 Change 中逐业务定义；写操作必须包含幂等/并发，异步操作必须包含 pending/failed、重试与人工恢复。

## 前端设计

- 页面与分包：保持一级 Tab 与二级详情边界；正式范围采用批准的 17 份业务需求。
- 组件与状态：页面只组合用例；API、composable、Pinia 和宿主适配分离。
- API 与错误处理：从 OpenAPI 生成/校验类型，稳定错误码映射，不展示内部异常。
- 跨端兼容：首批为 H5 + 微信小程序；位置、导航、上传等使用能力适配和目标端证据。

## 后端设计

- 模块与分层：按 discovery、city、fuel、identity/profile、admin-content、analytics/report 划分模块化单体。
- 用例与领域规则：Controller 只适配；Application 管用例；Domain 不依赖 ORM。
- 事务与并发：MySQL 为业务真相；Prisma 实现 Repository Port，Schema 变化只通过 Prisma Migration；竞争写使用唯一约束、条件更新或批准的锁策略。

## API、数据、Redis、RabbitMQ

- API 根保持 `/v1` 兼容，是否调整由公开契约 Change 决定。
- 当前 Prisma 数据模型作为迁移起点；字段变化必须由垂直 Change 的业务规则与版本化 Migration 驱动。
- Redis/MQ 为条件能力，不在无用例时强制部署。

## 安全与隐私

- 用户与 Admin 分离认证；Admin 默认拒绝、RBAC + 资源策略。
- 私钥和本地 env 不进入 Git/Evidence；管理写、导出和审核记录 actor、reason、before/after。

## UI/UX、文案、目标端与可访问性

- v1.1.0 prototype 是视觉参考，但版本/页面冲突裁决后才冻结。
- Wot Design Uni 用于 mobile，Element Plus 用于 admin；共用品牌 token，不混用组件库。

## 性能、容量、SLI/SLO 与错误预算

待每个业务切片给出数据规模与量化指标；不继承 PRD 中无测量环境的绝对时间作为已批准 NFR。

## 可观测性

保留 requestId，补结构化日志、低基数指标和 W3C Trace；禁止采集 Token/请求全文。

## 备份恢复、RPO/RTO 与 Incident 响应

生产托管方式未定，保持阻塞。MySQL 上线前必须有恢复演练。

## 应用 CI、供应链、SBOM 与制品

先修复 typecheck 与零测试，再激活项目质量门禁；构建制品绑定 commit/digest。

## 发布、迁移和回滚

后续 Change 小步灰度。ORM 迁移若批准，采用双轨兼容/数据校验方案，不在单次发布中破坏现有表。

## 备选方案与决策

| 方案 | 优点 | 缺点 | 风险 | 结论 |
|---|---|---|---|---|
| A 保留 Prisma，适配 Harness | 复用现有迁移与代码、交付快 | 需要将母体 TypeORM 术语项目化 | 规则与实际代码漂移 | **已批准** |
| B 迁移 TypeORM | 与母体默认一致、Repository 实现统一 | 重写 schema/migration/repository，短期无直接产品价值 | 数据迁移和双轨风险高 | 不采用；未来只能由独立 ADR 重开 |
| C 全部推倒重写 | 表面结构整洁 | 丢失已实现资产、反馈周期长 | 范围失控、回归不可知 | 不推荐 |

## 实施顺序

1. 修复 Admin 类型检查、建立最小单测与真实 CI Gate。
2. 创建 `admin-foundation` Change，冻结管理端认证、RBAC、审计和权限测试。
3. 创建移动端发现、加油、身份资料等垂直 Change，逐条绑定 PRD 来源与 AC。
4. 在真实缓存/异步需求出现时单独评审 Redis/RabbitMQ，不预建空模块。

## 未决问题

Q-008（真实数据供应商）和 Q-009（未提交工作树恢复点）保留为分阶段风险；它们不阻塞质量基线，但会阻塞相关业务发布或覆盖式重构。

