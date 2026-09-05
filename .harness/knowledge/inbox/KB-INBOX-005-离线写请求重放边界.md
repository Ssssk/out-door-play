---
id: KB-INBOX-005
title: 离线写请求重放的幂等、冲突与失败归宿
type: pattern
status: draft
scope: [frontend, backend, offline, consistency]
stack: [uni-app, vue3, nestjs, mysql]
tags: [离线队列, 弱网, 重放, 幂等, 冲突, outbox]
owner: unassigned
last_verified: null
related_changes: []
---

# 要解决的问题

弱网下直接丢弃用户操作会损害体验，但把所有非 GET 请求保存并在联网后自动重放，会造成重复下单/支付、旧表单覆盖新状态、凭证过期、越权重放和无限失败。离线队列不是通用请求缓存，而是跨前后端设计的业务命令队列。

# 来源与冲突修正

- 来源：`uniapp-vue3-wot-design-uni-onepiece-3.0.zip` 的 `offlineQueue.ts` 与 3.0 domain overlay。
- SHA-256：`862487b717fdb2dc59ad569b68fb7f45897fe4c82f31e01d15bd1c1c1f95977c`。
- 源代码注释声称可用于“非幂等写操作不丢失”，而 3.0 overlay 又限定“仅显式幂等且有冲突策略的操作可自动重放”。本条采用后者，并把前者记录为危险反例。

# 使用条件

- 产品明确要求离线编辑、弱网暂存或后台补交。
- 服务端为命令定义业务幂等键、版本/前置条件和重复响应语义。
- 用户能够看到 queued、syncing、conflict、failed、completed 状态。

# 实施方式

1. 按业务命令建立白名单，不按 HTTP method 泛化；支付、下单、扣费、删除等默认不自动重放。
2. 任务信封至少包含 commandId、operationType、payloadVersion、createdAt、actor/session reference、resourceVersion、attempts 和过期时间。
3. 本地只保存业务必需字段，敏感数据按数据分类处理；会话切换时隔离或清理旧用户队列。
4. NestJS 以 commandId/业务键提供持久幂等；在 MySQL 原子边界内保存幂等结果和业务副作用。
5. 使用乐观版本、ETag 或业务前置条件检测“离线期间状态已变化”，返回稳定冲突错误。
6. 重放串行或按资源分区有界并发，使用指数退避和抖动，但总次数、总时长和过期时间必须有上限。
7. 区分可重试瞬态错误与永久错误；永久失败进入用户可见失败箱，不静默丢弃。
8. 支持取消、查看、手动重试和冲突解决；记录审计但不记录 Secret/完整 PII。

# NestJS/uni-app 技术约束

- 前端生成的 commandId 不能替代服务端授权；每次重放重新验证当前身份和资源权限。
- 自动重放只适用于服务端明确声明的幂等命令，客户端不得自行推断。
- 网络恢复事件只触发调度，不代表服务可用；仍需超时、熔断和有限重试。
- 队列升级需要 payloadVersion 迁移或废弃策略，不能用新代码盲读旧结构。
- 发生冲突时不得 last-write-wins 覆盖关键数据，除非业务明确批准。

# 风险和反例

- 反例：把所有 POST/PUT 写入本地并顺序重放。
- 反例：超过三次直接删除且不告知用户。
- 反例：重放时复用过期 Token 或跨账号发送旧队列。
- 反例：只在客户端去重，服务端没有唯一约束/幂等记录。

# 验证清单

- 同一 command 重放 2 次、并发 20 次，业务副作用仍只发生一次。
- 离线期间服务端资源被其他设备修改时返回可解释冲突，不覆盖新值。
- 断网、超时、进程强杀、应用升级、账号切换和队列损坏均有确定恢复行为。
- 敏感数据检查、队列容量/过期、失败箱和可观测指标通过。

# 失效条件

- API 幂等、认证、资源版本或业务冲突策略变化。
- 宿主存储限制/安全能力变化，或操作被重新分类为高风险。

# 关联实现与证据

- `rules/04-前端工程规范.md`
- `rules/06-API与错误协议规范.md`
- `skills/api-contract-design/SKILL.md`
- `skills/frontend-implementation/SKILL.md`
- `KB-INBOX-007`

