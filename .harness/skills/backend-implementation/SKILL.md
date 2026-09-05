---
name: backend-implementation
description: 按批准设计实现 NestJS 模块、领域用例、TypeORM、MySQL、Redis 与 RabbitMQ 适配器；仅用于需求和设计 Gate 已通过的后端任务。
---

# NestJS 后端实现

## 触发条件

- Change 已批准，任务明确要求新增或修改 NestJS 后端行为。
- Bugfix 有稳定复现、正确行为和批准的修复边界。
- 重构已定义行为不变量和回归方案。

## 不适用场景

- 需求或设计 Gate 未通过。
- 需要先决定 API、数据迁移、缓存或消息策略。
- 生产手工修数、部署或数据库操作。

## 前置 Gate

- `status.yaml.state` 为 `approved` 或 `implementing`。
- 任务有 TASK ID，并关联 FR/AC；依赖任务和契约已经完成。
- API、数据、缓存、消息、安全和迁移变化已有设计或明确标记不适用。
- 已检索相关 NestJS、TypeORM、Redis、RabbitMQ 经验和事故。

## 必读上下文

1. 当前 Change 的需求、AC、影响分析、设计、任务、契约和测试计划。
2. 后端、TypeScript、API、MySQL、Redis、MQ、安全和测试 Rules。
3. 后端架构、领域、接口、数据、Key、事件、权限、错误码和观测 Wiki。
4. 修改模块及其调用方、测试、迁移、配置和历史知识。

## 输入

- 已批准 TASK、FR/NFR/AC、设计和契约。
- 当前模块代码、测试基线和可用开发环境。
- 明确的兼容窗口、容量目标与禁止修改范围。

## 执行步骤

1. 确认任务依赖和修改边界，记录工作前基线测试结果。
2. 从领域不变量和应用用例开始，定义输入、输出、错误与事务边界。
3. 实现 Domain Entity/Value Object/Policy，不引入 NestJS、TypeORM 或基础设施依赖。
4. 实现 Application Command/Query/Use Case，通过端口访问 Repository、Clock、ID、事件等能力。
5. 实现 API 层 Controller、DTO、Guard/Policy、Presenter，只做协议适配。
6. 实现 TypeORM Repository、Mapper 和必要 Migration；显式处理 null、枚举、Decimal、bigint 和锁。
7. 按设计实现 Redis Cache Aside、TTL、序列化、失效、降级和观测。
8. 按设计实现 Outbox、Publisher、Consumer、幂等、重试、ACK、DLQ 和 trace 传播。
9. 使用稳定业务错误映射 HTTP 错误码；未知异常保留 requestId 并避免泄漏内部信息。
10. 添加结构化日志、业务指标、延迟、失败和队列指标，不记录密钥与敏感数据。
11. 编写/更新单元、集成、契约和必要并发测试；运行受影响套件。
12. 更新任务状态、契约、迁移计划和 evidence，不自行批准实现 Gate。

## 技术约束

- Module 公开最小 Provider；禁止通过全局模块隐藏业务依赖和形成循环依赖。
- Controller 不写业务规则；Application 管理用例；Domain 不依赖框架；Infrastructure 实现端口。
- DTO 使用 class-validator/class-transformer 的运行时规则，禁止仅依赖 TypeScript interface。
- 异常必须显式映射；禁止在业务深层直接抛任意 HTTP 异常造成协议耦合。
- 事务仅包含同一 MySQL 数据库工作，不在事务内调用 HTTP、Redis 或等待 MQ confirm。
- 竞争资源使用条件更新、乐观锁或经设计批准的悲观锁；不得“先查后改”假设无并发。
- `synchronize: true` 禁止用于生产；Schema 变化必须使用版本化 TypeORM Migration。
- Repository 查询避免 N+1、无界列表和隐式全表扫描；分页排序必须稳定。
- Redis Key 有命名空间、版本、所有者和 TTL；缓存故障不得破坏业务真相。
- RabbitMQ 按至少一次投递；消费者先验证、再幂等处理、成功后 ACK；无限重试禁止。
- ConfigModule 启动时校验必需配置；不得提交真实 Secret 或输出到日志。

## 产物

- NestJS 模块、领域、应用、API 和基础设施代码。
- DTO、Presenter、Repository/Mapper、Migration、缓存与消息适配器。
- 更新后的 OpenAPI、错误码、事件、任务和测试代码。
- 命令、环境、提交 SHA、测试结果与制品位置等证据。

## 验证与证据

- 运行格式、Lint、TypeScript 类型检查、单元测试和构建。
- 涉及 MySQL/Redis/RabbitMQ 时使用真实或容器化基础设施执行集成测试。
- 校验 API 实现与 OpenAPI、错误码一致，事件实现与 schema 一致。
- 验证成功、校验失败、权限拒绝、重复请求、并发冲突、超时和依赖失败。
- 检查日志中无敏感值，指标和 requestId/traceId 可支持排障。

## 停止与升级条件

- 实现需要改变需求、AC、公开契约、数据口径或批准架构。
- 出现未设计的数据丢失、并发、缓存一致性、消息兼容或安全风险。
- 需要生产凭证、生产写入、新基础设施或外部系统授权。
- 无法构造可靠测试环境或关键测试持续不稳定。

## 禁止事项

- 不绕过 Gate 直接实现，不扩大 TASK 范围顺手重构无关模块。
- 不用 `any`、非空断言或吞异常掩盖契约问题。
- 不通过删除、跳过或弱化测试获得绿色结果。
- 不把计划、未运行命令或模拟输出写成真实证据。

## 完成定义

任务范围内代码符合分层和技术硬约束；契约、迁移、缓存和消息实现同步；相关自动化测试通过并有真实证据；无未升级的设计偏差；任务可以进入实现 Gate 审查。
