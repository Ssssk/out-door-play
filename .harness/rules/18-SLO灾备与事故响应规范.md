# SLO、灾备与事故响应规范

## SLI/SLO

- 核心服务定义可用性、延迟、正确性和业务结果 SLI。
- 每项 SLO 包含查询、目标、窗口、Owner 和错误预算策略。
- 告警必须可行动，包含持续时间、路由、Runbook 和升级条件。

## 容量与降级

- 使用常态、峰值、增长和耐久流量评估 API、MySQL、Redis、RabbitMQ 与第三方容量。
- 明确限流、熔断、降级、功能开关和用户可见行为。
- 容量不足或降级破坏业务不变量时阻塞 Operations Gate。

## 备份与灾难恢复

- 定义数据资产、RPO、RTO、备份频率、保留和恢复 Owner。
- 备份存在不等于可恢复，必须定期执行恢复验证或授权演练。
- MySQL、Redis、Outbox/RabbitMQ、配置、Secret 和制品分别定义恢复边界。
- 未经授权不得执行生产切主、清库、队列重放或故障注入。

## Incident

- 生产事故按 P0-P3 分级，指定 Incident Commander、技术、通信和记录角色。
- 优先保护用户与数据并止损；事实、假设和决定分开记录。
- 生产动作记录授权、操作者、时间、预期、结果和回退。
- 恢复后验证核心业务、数据一致性、积压和延迟副作用，并保持观察窗口。
- 事故完成无责复盘，形成防复发 Change、Runbook 和知识记录。

## Operations Gate

服务 Owner、SLO、容量、Dashboard、告警、Runbook、值班、备份恢复、Incident 计划和发布观察窗口均完成后，Operations Owner 才能批准。
