# 备份与恢复

> 状态：计划稿，`not-run`。关联 `NFR-MIG-001`、`FR-EXP-003`、`AC-EXP-005`、`AC-EXP-006`、`backend/migration-plan.md`。

## 备份点

- 回填前必须对 `discoveries`、`rankings`、`cities`、`system_configs` 建立可验证的备份点，记录备份时间、位置、校验值与保留期。
- 保存受影响行 id 清单与反向映射清单（原 `scene=fish` → `play + subType=fishing`），恢复 SQL 以 id 清单为限定条件，禁止无条件全表更新。
- 备份点未创建或校验不通过时，TASK-E15 与发布 Gate 保持 `pending`。

## 恢复目标

| 项 | 目标 | 验证方式 |
|---|---|---|
| RTO | 15 分钟内还原 3 条 Discovery、2 条 Ranking 与 4 个城市 JSON | 演练计时 + 只读 SQL 校验 |
| RPO | 回填窗口内不丢失收藏、分享与用户写入 | 演练前后行数与内容对比 |
| 幂等 | 第二次执行回填变更行数为 0 | 两次执行报告对比 |
| 可逆 | 恢复后收藏与分享链接仍可打开 | 目标端人工 + API 集成 |

## 演练步骤（尚未执行）

1. 在与生产同版本的容器化 MySQL 还原备份点，导入同量级数据。
2. 执行 Expand Migration 与回填脚本，记录 dry-run 与实执行行数、SQL 哈希、时间、执行者、退出码。
3. 执行恢复 SQL，按 id 清单还原 `scene=fish`、`subType=NULL`，同步还原 Ranking、`City.scenes` JSON 与 `SystemConfig.scene_tabs`。
4. 校验收藏行未被改写、分享详情 200、列表按兼容映射仍可返回钓鱼内容。
5. 记录演练报告与截图（仅证明可视状态）到 `evidence/`。

## 不可回滚项与升级

- 生产 ENUM 值新增后不通过删除 enum 值回滚，采用 expand-migrate-contract 保持新旧共存；Contract 阶段另开 Change。
- 微信小程序正式包不可瞬时回滚，只能依赖服务端兼容与重新提审，必须在发布 Gate 前明确。
- 出现备份不可恢复、行数不一致或恢复超时时，停止回填并升级给数据库 Owner 与发布负责人。
