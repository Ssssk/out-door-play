# 安全验证计划

> 状态：计划稿，`not-run`。与 `security/supply-chain-review.md` 的分工：本文件定义验证用例，前者记录安全 Gate 与供应链结论。

## 用例

| TEST ID | 用例 | 断言 | 状态 |
|---|---|---|---|
| SEC-V-001 | 越权写入 | 只读账号创建/更新路线与配置均 403，数据库无变更 | `not-run` |
| SEC-V-002 | 非法输入矩阵 | `scene=play,subType=null`、`scene=wash,subType=camping`、新写入 `scene=fish`、未知 subType 全部 422，错误码稳定 | `not-run` |
| SEC-V-003 | 隐藏分类绕过 | 绕过客户端直接请求被隐藏的 play/wash 列表返回空数组，详情仍 200 | `not-run` |
| SEC-V-004 | 兼容映射绕过 | `scene=fish` 映射后仍受隐藏分类过滤约束 | `not-run` |
| SEC-V-005 | 乐观锁并发 | 两个不同 `expectedUpdatedAt` 并发保存，后者 409 且配置未被覆盖 | `not-run` |
| SEC-V-006 | 日志脱敏 | 兼容映射、非法子类型、回填批次、隐藏拒绝四类事件日志不含敏感字段 | `not-run` |
| SEC-V-007 | 回填审计 | dry-run 与实执行批次记录操作者、UTC 时间、SQL 哈希与影响行数 | `not-run` |

## 前置与证据

- 前置：需求/设计 Gate 通过、集成环境真实 MySQL 可用、TASK-E06 / TASK-E11 完成。
- 证据：集成/契约测试输出、日志断言、只读 SQL 校验，绑定 SHA、命令、环境、时间、退出码，写入 `evidence/`。
- 停止：出现 P0/P1 资金、数据或权限风险时停止受影响操作并升级给安全 Owner。
