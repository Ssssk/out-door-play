---
id: KB-INBOX-009
title: MySQL 在线 Schema 变更与批量回填安全 Runbook
type: runbook
status: draft
scope: [backend, database, migration]
stack: [nestjs, typeorm, mysql]
tags: [expand-contract, ddl, backfill, lock, rollback, restore]
owner: unassigned
last_verified: null
related_changes: []
---

# 适用症状与目标

用于规划大表列新增/重命名/类型变化、索引变化和历史数据回填，目标是在新旧应用共存期间保护可用性和数据完整性。本记录不授权生产执行。

# 来源与方言修正

- 来源：`database-schema-migration-onepiece-3.0.zip`，SHA-256 `d87498f15e7df5203b255a62eba7db23dd950edae9d455781643c0eebc2dbde5`。
- 可吸收经验：expand-migrate-contract、锁/延迟预算、分批回填、对账、恢复验证和危险 DDL 检查。
- 明确拒绝：源模板中的 PostgreSQL `SET lock_timeout`、`statement_timeout`、`CREATE/DROP INDEX CONCURRENTLY` 和相应触发器语法。当前基线为 MySQL，必须按实际 MySQL 版本、InnoDB 能力和迁移工具确认语法与锁行为。

# 权限和前置检查

- 需求与设计 Gate 已通过；表 Owner、数据口径、保留规则和兼容窗口明确。
- 生产动作需要发布 Gate 和针对环境/语句的独立授权；本 Runbook 默认只读/隔离环境。
- 已知 MySQL 精确版本、表行数/大小、增长、主键、索引、典型 QPS、复制拓扑、备份状态和 RTO/RPO。
- 已验证备份可恢复，而不只是“备份任务显示成功”。

# 只读诊断步骤

1. 导出当前 schema、索引、外键、字符集、排序规则和相关 Entity/Repository 使用点。
2. 获取表大小、行数估算、数据分布、热点时段、慢查询和关键 EXPLAIN。
3. 识别新旧应用会同时访问的列和写入路径，建立兼容矩阵。
4. 按实际 MySQL 版本查询目标 DDL 的 algorithm/lock 能力；不凭通用经验假设 online。
5. 检查磁盘/临时空间、复制延迟、长事务和 metadata lock 风险。

# 处理步骤

1. Expand：新增兼容结构，不删除/改义旧结构；新列优先允许 null 或可安全默认。
2. 发布可同时读写新旧结构的应用；双写只在有对账和退出策略时采用。
3. Migrate：按主键范围或稳定游标分批回填；每批独立提交、可重入、有限速和 checkpoint。
4. 每批记录扫描范围、影响行数、耗时、错误、复制延迟和当前 checkpoint。
5. Reconcile：验证 null、唯一性、总量、校验和/聚合、异常样本和业务不变量。
6. 切换读取到新结构，观察完整窗口；保留回退读取能力。
7. Contract：确认所有旧应用和隐藏调用方退出后，在独立 Change 中删除旧结构。
8. 更新 Entity、Migration、Wiki 数据模型、发布/回滚和证据。

# 停止、升级与回滚条件

- metadata lock 等待、复制延迟、错误率、磁盘增长或业务延迟超过已批准阈值时立即停止新批次。
- 出现不明异常数据、校验差异、不可恢复转换或旧应用仍在访问旧列时不得 Contract。
- 回滚可能丢失新格式数据时，不能声称 `down` 可安全恢复；转为经批准的前向修复/恢复方案。
- 无法确认目标环境或连接可能指向生产时停止。

# 完成验证

- 空库与已有版本库 upgrade 通过；可行时执行 revert 后再 upgrade。
- 新旧应用在兼容窗口内均能读写，关键查询计划和延迟满足预算。
- 重复执行回填不重复修改数据；中断后从 checkpoint 恢复。
- 对账结果、异常处理、备份恢复演练和观察窗口均有证据。

# 审计和证据

- Change/TASK/AC、代码 SHA、Migration ID、MySQL 版本、环境和执行者。
- 迁移前后 schema、行数、校验摘要、锁等待、复制延迟、开始结束时间和退出码。
- 生产命令不直接写入通用知识；在获批 Change 中按环境生成并复核。

# 失效条件与复核周期

- MySQL、TypeORM、云数据库产品或复制拓扑升级后重新验证。
- 表规模、QPS、RTO/RPO 或部署策略显著变化后重新评估。
- 晋级为 verified 前，必须在接近真实规模的隔离环境完成演练并由 DBA/后端 Reviewer 复核。

