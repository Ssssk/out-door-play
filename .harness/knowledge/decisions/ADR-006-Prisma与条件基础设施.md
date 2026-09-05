---
id: ADR-006
title: 保留 Prisma 并按用例引入 Redis 与 RabbitMQ
type: decision
status: verified
scope: [backend, database, cache, messaging, architecture]
stack: [nestjs, prisma, mysql, redis, rabbitmq]
tags: [ORM, 渐进迁移, 用例驱动, 模块化单体]
owner: 用户（项目负责人）
last_verified: 2026-08-30
related_changes: [CHG-OUTDOOR-V110-001]
---

# 决策上下文

旧项目已使用 Prisma 7、Prisma Migration 与 MySQL 实现多个模块。母体 Harness 以 TypeORM、Redis、RabbitMQ 作为通用参考，但当前项目没有 Redis/MQ 运行依赖，也没有证据证明 ORM 全量替换能带来产品收益。

# 决策驱动因素

- 最大化复用现有 schema、migration 和已实现模块。
- 避免无业务收益的双 ORM、数据迁移和回滚风险。
- 保持模块化单体与 Repository Port 的依赖方向，不让领域层绑定 Prisma。
- 只为真实缓存、会话、限流或异步可靠性需求承担中间件运维成本。

# 候选方案

1. 保留 Prisma，并渐进建立端口与 adapter。
2. 全量迁移 TypeORM。
3. 推倒旧实现并一次性重写。

# 最终决策与批准人

2026-08-30，用户（项目负责人）批准方案 1：保留 Prisma 7 与 Prisma Migration；Redis/RabbitMQ 在后续独立 Change 中由具体用例和 NFR 驱动，禁止空接入。

批准证据：`.harness/changes/prd-v1-1-rebuild/approvals/2026-08-30-requirements-design.md`。

# 权衡和后果

- 优点：交付风险低、现有迁移连续、可按业务切片重构分层。
- 代价：项目 Harness 中母体 TypeORM 术语必须校准；现有 Service 直连 Prisma 需要渐进改善。
- 后果：MySQL 仍是业务真相；Redis 不得成为唯一持久事实；RabbitMQ 不得在没有消费者 Owner、幂等、重试和 DLQ 设计时引入。

# 适用边界与退出条件

适用于当前 NestJS 模块化单体。只有出现合规、组织标准、维护性或性能等可验证约束时，才能通过新 ADR 重开 ORM 选择。出现明确缓存/会话/限流/异步用例时，为 Redis 或 RabbitMQ 创建独立 Change。

# 验证与复核计划

- 每个 Prisma schema 变化使用版本化 Migration，并执行升级/数据核对。
- 垂直 Change 检查 Domain 不依赖 Prisma Client。
- 首次引入 Redis/MQ 时重新执行容量、降级、幂等、运维和供应链评审。

# 关联 Change 与知识

- `CHG-OUTDOOR-V110-001`
- `KB-INBOX-007`（draft，仅作一致性检查清单）
- `KB-INBOX-009`（draft，仅作 MySQL 迁移风险清单）
