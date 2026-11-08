# 生产运营就绪评审

## 服务与业务 Owner

- 服务 Owner：架构 Owner（Q-004 指定）；业务 Owner：产品 Owner（Q-004 指定）；运营配置操作由具备 `config:write` 的运营账号执行。
- 值班与升级路径：发布负责人 / Incident Commander（Q-004 指定），未指定前 Operations Gate 保持 `pending`。

## SLI/SLO、错误预算和基线

- 见 `operations/slo.yaml`：可用性、延迟、正确性三类 SLI，30d 窗口与错误预算策略。
- 基线来自现有 `qrcodes` 单行主键读范式；本 Change 不引入缓存，配置读延迟以 `TEST-PERF-001` 实测为准，**当前无实测数据**。
- 生产无独立 APM：SLI 查询以 Nest 结构化日志 + 集成/压测报告为替代证据，该缺口必须由 Operations Gate 显式裁决，不得写成已通过。

## 容量、限流、降级和功能开关

- 容量：配置恒为 1 行单行主键读，20 RPS × 5min 为验证模型；列表用例在隐藏场景短路后反而减少一次查询。
- 限流：沿用现有 API 全局策略，本 Change 不新增限流规则。
- 降级：配置接口失败时小程序用 `cached ?? DEFAULT`，服务端损坏配置返回 DEFAULT；均不阻断首页。
- 功能开关：不引入代码级开关；「是否开启新分类」由运营配置承担业务灰度，默认配置与旧版行为一致。

## Dashboard、日志、Trace和告警

- 结构化日志事件：`scene_tabs_config_invalid`、`scene_tabs_config_rejected`、`scene_tabs_config_conflict`、`scene_tabs_list_denied`、`scene_tabs_config_updated`，均沿用现有 requestId/traceId。
- 低基数标签仅含 `scene` / `revision`；不以 `label`、操作者 ID 作为指标标签。
- 告警路由见 `operations/slo.yaml`；Dashboard 与告警落地情况为 `not-run`，由 Operations Gate 检查。

## MySQL、Redis、RabbitMQ Runbook

- MySQL：`system_configs` 单行读写；异常时只读核对 `key/revision/updated_at`，不执行 `DELETE`；损坏时用后台「恢复默认」前向修复。
- Redis / RabbitMQ：`not-required`（DEC-008、ADR-006，未引入），无需 Runbook。
- 详细步骤见 `backend/migration-plan.md` 与 `release/rollback-plan.md`。

## 备份恢复和灾难恢复演练

- 配置随既有 MySQL 备份；RPO 沿用现有备份策略，RTO 目标 ≤ 15 分钟（恢复默认或备份恢复）。
- 演练状态：`not-run`，见 `operations/disaster-recovery.md`。

## 值班、升级路径和供应商联系

- 值班：由 Q-004 指定；升级顺序为 运营 → 发布负责人 → 架构/安全 Owner。
- 外部依赖：微信小程序审核/发布平台；无新增第三方供应商。

## 发布观察窗口和退出标准

- 窗口：一个业务日（建议 24h），期间保持 DEFAULT 配置不变更。
- 退出：配置接口错误率与首页列表错误率回到基线、无 0 分类、详情可用、`scene_tabs_*` 日志无异常激增，且产品 Owner 确认。
- 停止阈值见 `release/release-plan.md`。

## 运维负责人结论

- 结论：`pending`
- 证据：全部运营类证据为 `not-run`；Operations Gate 未批准
