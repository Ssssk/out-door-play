---
id: KB-INBOX-011
title: 高影响自动化的权限、Dry-run、中止阈值与恢复 Owner
type: pattern
status: draft
scope: [ci, release, migration, testing, operations]
stack: [nestjs, mysql, redis, rabbitmq, github-actions]
tags: [automation, authority, dry-run, abort-threshold, rollback, blast-radius]
owner: unassigned
last_verified: null
related_changes: []
---

# 要解决的问题

数据库迁移、批量回填、自动发布、流量回放、压测、混沌测试和 DLQ 重放虽然可以脚本化，但“脚本能运行”不代表它拥有目标环境权限，也不代表影响可控。高影响自动化需要四项共同控制：明确权限、可审查预演、中止阈值、恢复 Owner。

# 来源与证据等级

- `database-schema-migration-onepiece-3.0.zip`：迁移、回填、恢复。
- `nestjs-devops-cicd-onepiece-3.0.zip`，SHA-256 `b1b504005379e7772bf7007c0196d8e41f1860945d32baddc53168500762f74e`：CI/CD 与部署边界。
- `qa-testing-benchmark-onepiece-3.0.zip`，SHA-256 `941b95cda976bfa599e9c0b2321fd9c7c55ff5d6e8c158cb5ab97113c3b56247`：隔离、负载、混沌和 blast radius。
- 三个来源交叉支持该模式，但未在当前项目执行，状态为 draft。

# 使用条件

- 动作可能修改生产/共享环境、处理大量数据、影响真实用户、触发第三方或产生显著费用。
- 自动化包含迁移、回填、发布、回滚、扩缩容、消息重放、影子流量、压测或混沌注入。
- 需要人在回路做批准、观察或紧急停止。

# 实施方式

1. 权限：绑定明确环境、目标资源、动作、有效期和批准人；默认拒绝模糊的“运行脚本”授权。
2. Dry-run：输出将影响的资源、数量、版本、批次、Diff、估算时间与风险，不产生真实副作用。
3. 中止阈值：在执行前定义错误率、延迟、锁等待、复制延迟、队列积压、成本和数据差异阈值；阈值可机器读取。
4. 恢复 Owner：指定谁判断恢复、使用哪个备份/回滚/前向修复、RTO/RPO 和验证查询。
5. 使用最小批次、灰度/金丝雀和逐步扩大；每一步都有观察窗口和继续批准条件。
6. 运行记录绑定 Change、代码/制品 digest、配置、执行者、开始结束时间、命令摘要、退出码和结果。
7. 自动停止后保持现场和证据，不静默重试直到绿色。

# NestJS/uni-app 技术约束

- CI 的 Secret 只以受控引用注入，不输出值，不赋予无关环境权限。
- 测试、压测和影子流量不得默认指向生产；真实流量复制需要数据脱敏和批准。
- RabbitMQ/DLQ 重放保持原 eventId、验证 Consumer 幂等并限速。
- MySQL 回填按稳定游标分批，不能使用无界单事务；Redis 清理不能用模糊通配目标执行危险删除。
- 应用商店上传、外部通知和生产部署都是外部动作，流水线存在不等于获准执行。

# 风险和反例

- 反例：使用 `--force`、`reset` 或全量重跑掩盖失败。
- 反例：dry-run 与真实运行使用不同过滤条件/版本，预演不具代表性。
- 反例：只有回滚脚本，没有恢复演练和 Owner。
- 反例：失败后流水线自动无限重试，扩大 blast radius。

# 验证清单

- 在隔离环境执行 dry-run → 小批次 → 触发阈值 → 自动停止 → 恢复 → 验证全链路。
- 确认无授权时任务 fail closed，不能通过默认环境变量落到生产。
- 验证阈值采集失败时采取保守停止，而不是继续运行。
- Reviewer 能从证据重建执行对象、版本、影响、停止原因和恢复结果。

# 失效条件

- CI/CD 平台、云权限模型、部署拓扑、备份方案或中间件变化。
- 动作影响等级变化但控制配置未更新。

# 关联实现与证据

- `rules/17-应用CI与供应链安全规范.md`
- `rules/18-SLO灾备与事故响应规范.md`
- `skills/ci-quality-gate/SKILL.md`
- `skills/deploy-verify/SKILL.md`
- `skills/database-migration/SKILL.md`
- `KB-INBOX-009`

