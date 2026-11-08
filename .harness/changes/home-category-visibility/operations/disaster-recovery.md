# 备份与灾难恢复

## 数据资产和依赖

- 唯一新增数据资产：`system_configs` 中 `key = scene_tabs` 的一行 JSON 配置（可选，首次保存才创建）。
- 依赖：MySQL/InnoDB 既有备份与 Binlog、Nest API、管理后台、小程序端内置 DEFAULT 常量。
- 非资产：小程序进程内 `cached` 与 `listCache` 是可重建派生状态，不作为持久真相（ADR-006 原则）。

## RPO、RTO和责任人

- RPO：沿用现有 MySQL 备份策略；配置变更本身可通过后台重新保存重建。
- RTO 目标：≤ 15 分钟。首选「恢复默认」前向修复（分钟级），无需等待备份恢复。
- 责任人：发布负责人 / Operations Owner（Q-004 指定）。

## MySQL备份、Binlog和恢复验证

- 无 DDL、无回填，不改变备份范围；`scene_tabs` 行随全库备份与 Binlog 覆盖。
- 恢复验证：恢复后若无该行，公开接口返回 DEFAULT，首页只显示「粗门溜车」；若有该行，`revision` 与 `updated_at` 应与备份点一致。
- 禁止：不对 `system_configs` 执行 `DELETE`、不重置 `updated_at`、不使用 ORM `synchronize`。

## Redis可重建数据与持久化策略

- `not-required`：DEC-008 / ADR-006 未引入 Redis；服务端无配置缓存，无 Key/TTL/雪崩处理。

## RabbitMQ消息、Outbox与重放策略

- `not-required`：无事件、无 Outbox、无重放需求；`contracts/events.yaml` 为空。

## 配置、Secret和制品恢复

- 配置：后台「恢复默认」二次确认后提交 DEFAULT，仍走 `expectedUpdatedAt` 条件更新，`revision` 递增可审计。
- Secret：本 Change 不新增 Secret；管理端沿用既有 Cookie/CSRF 配置。
- 制品：API / 后台 / 小程序按 `release/rollback-plan.md` 回滚；小程序包不可瞬时回滚，依赖 DEFAULT 与旧版行为一致。

## 演练步骤、停止条件和证据

1. 在测试环境写入三类损坏配置（缺字段、未知 `scene`、0 个启用项），验证公开接口仍返回 DEFAULT 且日志出现 `scene_tabs_config_invalid`。
2. 执行「恢复默认」，验证 `revision` 递增、后台与公开接口一致、小程序下次进入首页恢复。
3. 模拟配置接口 5xx 与弱网，验证小程序 `cached ?? DEFAULT` 兜底、无重试风暴。
4. 停止条件：出现数据被删除、详情不可用或生产环境被误连时立即停止并升级给发布负责人。
5. 证据：`evidence/` 中记录 SHA、命令、环境、时间、退出码与结果摘要。

## 最近演练结论

- 状态：`not-run`
