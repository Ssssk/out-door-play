# 数据迁移计划

> 所有生产写入均需针对目标、环境与动作的明确授权；本文件是评审稿，当前 `not-run`。

## Schema 与数据变化

- **Expand**：`enum Scene` 新增 `play` / `wash`（保留 `fish`）；新增 `enum PlayType`；`discoveries` 增 `sub_type ENUM(...) NULL` 与索引 `(city_code, scene, sub_type)`；`rankings.scene` 同步 MODIFY。
- **Migrate**：3 条 `fish` Discovery → `play/fishing`；2 条 fish Ranking → `play`；4 城市 `City.scenes` JSON 与 `SystemConfig.scene_tabs` 中 `fish → play`；seed 源码同步。
- **Contract**：不在本 Change。确认 `scene='fish'` 行数为 0 且旧包占比可忽略后另开 Change 移除 enum 值。

## 数据规模和锁影响

- `discoveries` 当前 seed 为 30 条，但生产行数**必须先只读统计**再决定 DDL 策略；不得假设是小表。
- `MODIFY ENUM` 在 MySQL/InnoDB 上加末尾枚举值通常可用 `ALGORITHM=INPLACE, LOCK=NONE`，但需由演练环境实测确认；不支持时安排维护窗口。
- 新增索引与列需评估行数、锁等待、磁盘、复制延迟；必要时按在线变更工具或分批执行。
- 回填为一次性 `UPDATE ... WHERE scene='fish'`，条件带索引前缀，禁止无界更新；大表时按 id 清单分批。

## Expand 步骤

1. 只读统计：`SELECT scene, COUNT(*) FROM discoveries GROUP BY scene;`、`SELECT scene, COUNT(*) FROM rankings GROUP BY scene;`
2. 备份点：全库备份 + 导出受影响 id 清单（3 类：discoveries / rankings / cities / system_configs 的 key）。
3. 演练环境执行 Prisma Migration（生成版本化 SQL），记录行数、锁等待、时长、复制延迟、磁盘占用。
4. 生产执行（需授权）：先 Expand，不触发任何应用行为变化；旧应用仍可读写 `fish`。

## Migrate 步骤

1. dry-run：输出受影响行数与 id 样本（不输出真实用户内容），人工确认与预期一致。
2. 实执行：按 `05-design.md` 的 SQL 顺序执行，记录批次号、时间、执行者、退出码。
3. 只读校验：`SELECT COUNT(*) WHERE scene='fish'` 期望 0；`SELECT COUNT(*) WHERE scene='play' AND sub_type='fishing'` 期望 3；Ranking/城市 JSON/配置逐一核对。
4. 幂等校验：再次执行回填，变更行数期望 0。

## 校验指标

- `scene_tabs` 默认 3 项且不含 `fish`；`City.scenes` 不再含 `fish`。
- 钓鱼分享链接与收藏接口返回 200（`AC-EXP-007`、`AC-EXP-008`）。
- `scene_legacy_mapping` 日志仅在兼容读时触发，无异常激增。

## 回滚或前向修复

- 反向 SQL 限定导出 id 清单，避免把回填后新写入的 `play` 记录误改回 `fish`：
  ```sql
  UPDATE discoveries SET scene='fish', sub_type=NULL
   WHERE scene='play' AND sub_type='fishing' AND id IN (<备份清单>);
  UPDATE rankings SET scene='fish' WHERE id IN (<备份清单>);
  ```
- `City.scenes` JSON 与 `SystemConfig.scene_tabs` 按备份值写回。
- 禁止：`DELETE`、重置 `updated_at`、ORM `synchronize`、无授权的生产写入。
- 若 DDL 需回滚，优先恢复备份点而非逆向 `MODIFY ENUM`（保留 `fish` 本身就是兼容垫）。

## 演练结果

- 状态：`not-run`
- 计划演练：容器化 MySQL（与生产同版本）执行 Expand + Migrate + 幂等校验 + 恢复演练，证据写入 `evidence/`，绑定 SHA、SQL、时间、退出码与报告路径。
