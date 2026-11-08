# 数据迁移计划

## Schema 与数据变化

- **无 Prisma Migration、无 DDL、无索引变化、无数据回填。**
- 复用既有 `system_configs(key VARCHAR(64) PK, value JSON, updated_at)`（见 `apps/api/prisma/schema.prisma:437-444`）。
- 新增一个逻辑键值 `key = 'scene_tabs'`，`value` 结构见 `backend/domain-design.md`。
- 首次保存前数据库无该记录；`ConfigController` / `SceneTabsConfigService` 读取时返回内置 DEFAULT（`drive` 启用、`fish` 隐藏），保证零迁移上线。
- 首次保存由后台 `PUT` 触发：`create()` 写入；并发创建时的唯一键冲突按 409 处理。

## 数据规模和锁影响

- 单行主键读写，数据量恒为 1 行（配置整体替换，不按分类拆行）。
- `updateMany` 条件更新只锁单行，无大表 DDL、无全表扫描、无复制延迟评估需求。
- 读取为 `findUnique` 主键查询，无 join、无分页；`NFR-PERF-001` 的 20 RPS 压测远低于单行主键读能力。

## Expand / Migrate / Contract 步骤

- Expand：不适用（无新列/新表/新枚举值）。
- Migrate：不适用（无回填；配置记录按需由运营首次保存创建）。
- Contract：不适用（不删除或重命名字段）。
- 兼容窗口依赖「读取端兜底」而非 schema 共存：新 API + 无配置记录 = 旧行为；旧小程序包不请求新接口。

## 校验 SQL/指标

实现阶段由集成测试与只读核对完成，不执行生产写入：

- `SELECT \`key\`, JSON_EXTRACT(value, '$.revision') AS revision, updated_at FROM system_configs WHERE \`key\` = 'scene_tabs';`
- 断言：`items` 数组内 `scene` 只含 `drive`/`fish`、无重复、`enabled=true` 项 ≥ 1、`label` 非空且长度 ≤ 12、`sort` 为整数。
- 指标：`scene_tabs_config_invalid` 日志计数应为 0；并发保存压测中 409 计数与预期一致；配置保存后公开接口 `revision` 递增 1。

## 回滚或前向修复

- 配置误配：后台「恢复默认」按钮提交 DEFAULT（仍走 `expectedUpdatedAt` 条件更新），属于**前向修复**，不执行数据库回滚、不删除记录、不还原备份。
- 代码回滚：API revert 后新接口消失，小程序按 `AC-CFG-011` 回退 DEFAULT；`system_configs` 中残留的 `scene_tabs` 行对旧代码无副作用（旧代码不读该键），无需清理。
- 数据丢失：配置随既有 MySQL 备份恢复；恢复后若记录不存在，读取端返回 DEFAULT，首页仍可用。
- 禁止：不对 `system_configs` 执行 `DELETE`、不重置 `updated_at`、不使用 ORM `synchronize`。

## 演练结果

- 状态：`not-run`
- 计划演练：在测试环境构造损坏 JSON、0 个启用项、未知 `scene` 三类数据，验证公开接口仍返回 DEFAULT；再执行一次「恢复默认」验证 `revision` 递增且 C 端下次进入首页恢复。
- 演练证据路径：`evidence/`（执行后登记，绑定 SHA、命令、时间与退出码）。
