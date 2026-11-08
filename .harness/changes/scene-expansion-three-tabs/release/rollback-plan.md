# 回滚计划

> 状态：计划稿，`not-run`。回滚同样属于需授权的操作；当前未执行任何回滚或恢复动作。

## 可回滚项

| 项 | 回滚方式 | 前置 | 验证 |
|---|---|---|---|
| 管理后台构建产物 | 回退到上一版本静态产物 | 保留上一版本制品 digest | 旧后台能读取兼容期数据、不出现 500 |
| API 应用版本 | 回退到上一版本（旧枚举白名单） | Expand 阶段未删除 `fish`、响应结构不变 | 旧包 + 旧服与旧包 + 新服矩阵通过 |
| `SystemConfig.scene_tabs` | 用备份点中的旧配置值还原，或按 DEC-E05 默认 3 项重建 | 记录旧 `revision` 与值 | 配置读取不 500、revision 连续 |
| 回填数据 | 按 id 清单执行反向恢复 SQL（见 `operations/disaster-recovery.md`） | 备份点可恢复、反向映射清单完整 | 收藏/分享/详情只读校验通过 |

## 不回滚项

- 生产 ENUM 已新增的 `play` / `wash` 不通过删除 enum 值回滚；按 expand-migrate-contract 保留共存，Contract 阶段另开 Change。
- `sub_type` 列与 `(city_code, scene, sub_type)` 索引在兼容期保留，避免二次 DDL 风险。
- 微信小程序正式包不可瞬时回滚，只能依赖服务端兼容能力并重新提审；发布 Gate 前必须书面接受该风险。

## 决策与升级

- 触发条件：见 `operations/incident-plan.md` 的 P0/P1；dry-run 与实执行行数不一致、备份不可恢复、旧包 422。
- 决策人：发布负责人会同数据库 Owner、产品 Owner；AI 只提供只读检查与建议，不自行选择回滚路径。
- 回滚后必须重新执行受影响范围的只读校验与目标端验证，并记录到 `evidence/`；不得把回滚成功当作业务验收通过。
