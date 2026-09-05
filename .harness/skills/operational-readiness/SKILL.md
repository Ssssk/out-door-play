---
name: operational-readiness
description: 在发布前验证 SLI/SLO、容量、告警、Runbook、值班、备份恢复、灾备和依赖降级，形成生产运营就绪 Gate；服务行为变化时使用。
---

# 生产运营就绪

## 触发条件

- 新服务、核心功能、运营活动、数据/MQ变化或高流量发布。
- 改变 SLO、容量、告警、备份、降级、值班或外部依赖。
- Change 准备进入发布 Gate。

## 不适用场景

- 无运行时影响的纯文档修正。
- 未经授权执行生产故障演练或恢复。
- 用“有监控”代替可行动的指标、阈值和 Owner。

## 前置 Gate

- 设计和验证已给出容量、失败、观测和恢复要求。
- 服务、业务、数据、消息和发布 Owner 明确。
- 生产演练需要单独授权、维护窗口和停止条件。

## 必读上下文

1. 发布、数据、Redis、MQ、安全和测试 Rules。
2. 部署拓扑、观测模型、历史事故和 Runbook。
3. 性能结果、迁移/回滚计划和 `operations/` 文件。
4. 目标环境容量、备份策略、值班和供应商 SLA。

## 输入

- 业务 SLI、技术 SLI、SLO、错误预算和测量查询。
- 峰值/常态流量、数据量、资源、队列和增长预测。
- Dashboard、告警、Runbook、备份、RPO/RTO 和值班表。

## 执行步骤

1. 为可用性、延迟、正确性和关键业务结果定义 SLI 查询与 SLO。
2. 确认指标来自真实用户路径，排除健康检查等无效流量。
3. 根据压测和历史峰值评估 API、MySQL、Redis、RabbitMQ 与第三方容量余量。
4. 定义限流、熔断、降级、功能开关和依赖故障用户体验。
5. 建立 Dashboard 和可行动告警，包含阈值、持续时间、Owner 和 Runbook。
6. 核对结构化日志、traceId、业务错误码和 MQ trace 传播。
7. 为 MySQL、Redis、RabbitMQ、发布和关键第三方建立/验证 Runbook。
8. 定义 MySQL 备份/Binlog 恢复，Redis 可重建边界，Outbox/MQ 重放策略。
9. 定义 RPO/RTO，执行授权的恢复演练或记录最近有效证据。
10. 核对值班、升级、Incident Commander、供应商和业务通信链。
11. 设定发布观察窗口、停止/回滚阈值和错误预算策略。
12. 更新 operations 文件并由 Operations Owner 决定 Gate。

## 技术约束

- SLO 必须有可执行查询、窗口和 Owner；“99.9%稳定”不是完整定义。
- 备份存在不等于可恢复，必须有恢复验证和最近演练时间。
- Redis 数据若不可从 MySQL/事件重建，必须按持久数据管理并定义恢复。
- RabbitMQ 积压、重试和 DLQ 必须有容量阈值、告警和安全重放步骤。
- 告警必须可行动，避免无 Owner、无 Runbook 和长期静默告警。
- 未经授权不执行生产故障注入、切主、清库或队列重放。

## 产物

- `operations/operational-readiness.md`、`slo.yaml`。
- `disaster-recovery.md`、`incident-plan.md` 和关联 Runbook。
- 容量、Dashboard、告警、备份恢复和演练证据。
- Operations Gate 决策及残余风险。

## 验证与证据

- SLI 查询能在目标环境返回可解释数据，告警可路由到真实 Owner。
- 容量测试覆盖峰值、耐久和依赖降级，资源瓶颈已识别。
- 恢复证据包含数据点、时间、RPO/RTO 结果和副作用检查。
- 发布/回滚 Runbook 由非作者按步骤演练或桌面推演。

## 停止与升级条件

- 核心服务无 Owner、无告警、无回滚或无法恢复关键数据。
- 压测显示容量不足或降级会破坏业务不变量。
- RPO/RTO 未定义或恢复从未验证。
- 生产演练需要额外授权或可能影响真实用户。

## 禁止事项

- 不把文档存在视为运营就绪。
- 不用单机测试外推生产峰值容量。
- 不执行未授权灾难演练或数据恢复。
- 不由开发者单独批准 Operations Gate。

## 完成定义

SLI/SLO、容量、降级、Dashboard、告警、Runbook、值班、备份恢复、RPO/RTO 和事件链路均可执行且有 Owner；残余风险受控；Operations Gate 可批准发布。
