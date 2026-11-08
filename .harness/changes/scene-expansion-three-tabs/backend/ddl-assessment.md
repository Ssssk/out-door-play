# DDL 静态评估（Expand 阶段）

> 状态：**静态评估**，生产/演练库实执行 `not-run`。本机无 `docker`、无 `DATABASE_URL`、3306 无监听，未连接任何数据库；不得把本文件当作已执行证据。

## Migration 文本

`apps/api/prisma/migrations/20261108000000_scene_expansion_expand/migration.sql`：

1. `ALTER TABLE discoveries MODIFY COLUMN scene ENUM('drive','fish','play','wash') NOT NULL`
2. `ALTER TABLE rankings MODIFY COLUMN scene ENUM(...) NOT NULL`
3. `ALTER TABLE discoveries ADD COLUMN sub_type ENUM('fishing','camping','checkin') NULL`
4. `ALTER TABLE discoveries ADD INDEX discoveries_city_code_scene_sub_type_idx(city_code, scene, sub_type)`

## 设计约束

- **只加不删**：保留 `fish` enum 值，保留旧索引 `discoveries_city_code_scene_idx`，新旧应用滚动共存；Contract 阶段另开 Change 才移除。
- `sub_type` 可空，旧行保持 `NULL`，这是回填幂等条件 `WHERE scene='fish' AND sub_type IS NULL` 的前提。
- 枚举值追加在尾部，避免 MySQL ENUM 内部序号变化引发隐式数据改写。
- 不在事务内等待外部确认；回填脚本用单库事务，失败整体回滚。

## 待演练库评估项（全部 `not-run`）

| 项 | 需要采集的值 | 阈值 / 停止条件 |
|---|---|---|
| `discoveries` / `rankings` 行数 | 演练库同量级实际行数 | 大表需评估分批或在线 DDL |
| `MODIFY ENUM` 执行方式 | MySQL 8.4 是否走 INSTANT / INPLACE / COPY | 出现 COPY 或长锁 → 需要维护窗口方案 |
| 锁等待与复制延迟 | `performance_schema`、慢日志、复制延迟秒数 | 超阈值停止并升级数据库 Owner |
| 新增索引耗时 / 磁盘占用 | 执行时长、临时空间、索引大小 | 磁盘不足停止 |
| 备份点与恢复演练 | 备份校验值、15 分钟内还原结果 | 不可恢复 → 发布 Gate 阻塞 |
| 回填 dry-run / 实执行 | 两次行数、影响行数、SQL 哈希、执行者、时间 | 行数不一致 → 停止回填 |

## 发布流水线中的备份点（2026-11-08 补充）

- `.github/workflows/deploy-production.yml` 在 `db:deploy` 之前新增 `Backup production database before schema expansion`：`mysqldump --single-transaction` 输出到宿主机 `backups/pre-scene-expansion-<SHA>.sql.gz` 并校验非空。
- 该步骤提供**备份点**，但备份可恢复性与 15 分钟还原演练仍 `not-run`；恢复演练结论须在发布 Gate 前由人工补写，不得用备份步骤存在代替演练证据。
- 用户正式环境部署指令与动作范围见 `approvals/2026-11-08-production-deploy.md`。

## 执行前置

- Expand Migration 与生产回填均需针对目标、环境、动作的明确授权（Q-E04，授权记录见上）。
- 脚本 `apps/api/src/scripts/backfill-scene-play.ts` 默认 `dry-run`，只有 `--apply` 才写入。
- 恢复方案见 `operations/disaster-recovery.md`；Contract 阶段（移除 `fish`）不在本 Change。
