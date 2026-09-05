---
id: KB-INBOX-007
title: NestJS 业务一致性、缓存与异步消息边界
type: pattern
status: draft
scope: [backend, consistency, messaging]
stack: [nestjs, typeorm, mysql, redis, rabbitmq]
tags: [事务, outbox, 幂等, 乐观锁, cache-aside, dlq]
owner: unassigned
last_verified: null
related_changes: []
---

# 要解决的问题

一个用例同时修改 MySQL、失效 Redis、发布 RabbitMQ 消息时，不存在覆盖三者的普通本地事务。若先提交数据库再“尽力发消息”，会丢关键事件；若在数据库事务里等待 Redis/MQ/HTTP，会扩大锁时间和故障耦合；若把 Redis 锁或 MQ 重试当作正确性保证，仍会出现重复、乱序和数据不一致。

# 来源与去重

- 主要来源：`nestjs-fullstack-miniprogram-onepiece-3.0.zip`，SHA-256 `cc507f16e5e28441ceafd732307a52865cf589da455f0b538fb588a7b0c3c1cc`。
- 条件参考：`microservice-gateway-grpc-onepiece-3.0.zip` 与 `multitenancy-saas-architecture-onepiece-3.0.zip`，当前模块化单体不激活其架构。
- 当前 Harness 已在 Rules 和 `backend-implementation` 中规定 Outbox、幂等和事务边界；本条用于记录问题机制和验证方法，不重复成为规则。

# 使用条件

- 一个业务操作跨 MySQL、Redis 或 RabbitMQ。
- 存在重复请求、并发更新、消息重复/乱序、缓存短暂陈旧或重放需求。
- 业务需要可解释的最终一致性，而不是口头承诺“强一致”。

# 实施方式

1. 先定义业务不变量、系统真相和允许的不一致窗口；MySQL 通常承载持久业务真相。
2. 在 Application Use Case 确定事务边界；Domain 不依赖 NestJS、TypeORM、Redis、RabbitMQ。
3. 同一 MySQL 事务内完成业务写入、条件/版本检查和 Outbox 记录。
4. 事务提交后失效或更新缓存；缓存失败只影响性能/短暂陈旧，不回滚已提交业务。
5. 独立 Publisher 读取 Outbox，以 publisher confirm 推进状态；失败有限重试并可观测。
6. Consumer 以业务幂等键或 `consumer + eventId` 记录处理结果，在本地原子边界完成副作用后 ACK。
7. 为乱序事件使用版本、序列或状态机前置条件；不能只依赖 RabbitMQ 到达顺序。
8. 永久失败进入 DLQ，定义 Owner、告警、查看、修复、限速重放和审计。
9. 对用户暴露 pending/processing/failed 等真实状态，不把异步受理伪装为业务已经完成。

# NestJS/uni-app 技术约束

- Controller 只做协议适配；Application 协调用例；Infrastructure 实现 Repository/Cache/Message Port。
- 竞争写优先数据库唯一约束、条件更新或乐观版本；分布式锁只解决已明确的协调问题。
- Redis Key 必须有 TTL、版本和可重建边界；不能作为缺少持久性设计的唯一账本。
- RabbitMQ 按至少一次设计，不宣称端到端 exactly-once。
- 幂等记录保留周期必须覆盖最大重试/重放窗口；过早过期会重新产生副作用。

# 风险和反例

- 反例：数据库提交后直接 `publish()`，进程崩溃造成永久丢消息。
- 反例：事务内等待 MQ confirm 或远程 HTTP，造成长事务和锁放大。
- 反例：先查库存再更新且无条件约束，假设无并发。
- 反例：消费者收到消息先 ACK，再执行不可逆副作用。
- 反例：DLQ 没有 Owner，只是把故障藏起来。

# 验证清单

- 并发请求、重复 requestId/commandId 不破坏业务不变量。
- 在业务提交、Outbox 提交、发布确认、消费副作用、ACK 各阶段注入崩溃，可恢复且不丢关键结果。
- Redis 不可用、缓存删除失败和缓存击穿时业务真相仍正确。
- 重复、乱序、延迟和 DLQ 重放均有集成测试和 traceId/eventId 证据。

# 失效条件

- 系统真相、事务存储、消息中间件或一致性目标变化。
- 引入跨库事务或外部支付等不可逆副作用，需要重新设计业务幂等和对账。

# 关联实现与证据

- `rules/05-后端工程规范.md`
- `rules/08-Redis规范.md`
- `rules/09-RabbitMQ消息规范.md`
- `skills/backend-implementation/SKILL.md`
- `skills/message-contract/SKILL.md`
- `KB-INBOX-005`

