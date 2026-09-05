---
id: KB-INBOX-010
title: 日志、指标与 Trace 的关联、基数和隐私边界
type: pattern
status: draft
scope: [backend, observability, operations]
stack: [nestjs, opentelemetry, prometheus, rabbitmq, redis, mysql]
tags: [traceId, requestId, metrics, cardinality, redaction, SLO]
owner: unassigned
last_verified: null
related_changes: []
---

# 要解决的问题

日志、指标和 Trace 如果各自存在但无法关联，事故时仍需要人工猜测；若把 userId、orderId、完整 URL、异常正文或请求体放入指标标签/Span，又会产生高基数成本和隐私泄漏。可观测性必须同时解决诊断、成本、可靠性和数据最小化。

# 来源与证据等级

- 来源：`opentelemetry-observability-onepiece-3.0.zip`，SHA-256 `aa7e0b28eac817592240beb37c5a85f508c653b4b2403944dabbe20df594bf61`。
- 可吸收候选：W3C trace context、RED/USE、结构化日志、信号关联、基数预算、隐私脱敏和 Collector 韧性。
- 当前项目运行证据：`not-run`。

# 使用条件

- NestJS API、后台 Job、RabbitMQ Publisher/Consumer、MySQL/Redis 调用需要统一诊断。
- Change 定义了 SLI/SLO、错误预算、性能或容量验收。
- 系统需要跨 HTTP 与异步消息追踪。

# 实施方式

1. HTTP 入口创建或验证 trace context，同时生成稳定 requestId；不盲信外部传入的高权限 baggage。
2. 结构化日志包含 timestamp、level、service、environment、requestId/traceId、operation、stable error code 和脱敏上下文。
3. RabbitMQ 信封传播 trace context/eventId；Consumer 创建消费 Span，并保留 producer/consumer 关联。
4. 指标标签只使用有界集合，例如 route template、method、status class、error code、consumer、result；高基数标识放日志或 Trace。
5. HTTP 使用 RED（rate/errors/duration），资源使用 USE（utilization/saturation/errors）；业务指标必须有 Owner 和口径。
6. 对采样、导出失败、队列积压和 Collector 不可用定义降级；遥测故障不能阻塞核心业务或造成内存无界增长。
7. 告警关联 Runbook、Owner、严重级别、持续时间和恢复条件，避免单点瞬时噪声。

# NestJS/uni-app 技术约束

- 禁止在 log/metric/span 中记录 Token、密码、Cookie、完整身份证/手机号、支付凭证和未经批准的请求体。
- URL 使用 route template，不用含 ID 的原始 path 作为指标 label。
- `traceId` 用于关联，不替代业务幂等键或审计 ID。
- RabbitMQ 重试应记录 attempt 和最终归宿，但不要给每个 messageId 创建指标 label。
- 客户端遥测需要用户、隐私和上架政策批准；强制更新/埋点不由本知识自动授权。

# 风险和反例

- 反例：Prometheus label 使用 userId/orderId/messageId，导致时间序列爆炸。
- 反例：为了“完整 Trace”采集请求/响应全文和认证头。
- 反例：Exporter 阻塞请求主链路，Collector 故障拖垮业务。
- 反例：Dashboard 漂亮但没有 SLO、Owner、阈值或处置 Runbook。

# 验证清单

- 从一次 uni-app 请求可定位 NestJS、MySQL/Redis 和 RabbitMQ 消费链路。
- 断开 Collector/Exporter，业务仍可用且遥测缓冲有硬上限。
- 指标标签基数有预算和告警，压测期间不随请求 ID 线性增长。
- 自动化扫描与抽查确认敏感字段已脱敏。
- 告警演练能从告警到 Runbook、Owner 和验证查询闭环。

# 失效条件

- OTel SDK/Collector、监控后端、采样策略、隐私规则或服务拓扑变化。
- 新增标签或采集字段未经基数和数据分类复核。

# 关联实现与证据

- `wiki/12-可观测性模型.md`
- `rules/13-发布回滚与可观测性.md`
- `skills/operational-readiness/SKILL.md`
- `skills/incident-response/SKILL.md`

