# 安全与供应链评审

> 状态：计划稿，`not-run`。安全 Gate 需产品安全与软件供应链证据齐备，P0/P1 关闭或阻塞后方可通过；AI 不得代批。

## 依赖与制品

- 本 Change 拟不新增运行时依赖、不引入 Redis / RabbitMQ / 新表；若实现阶段出现依赖变化，必须另起范围说明并重新评审。
- 待执行命令（均未运行）：`pnpm security:secret`、`pnpm lint`、`pnpm security:sbom`、`pnpm test:audit-policy`、`pnpm security:audit`，以及 `node .harness/scripts/run-project-quality.mjs`（接入 active 后）。
- 待产生证据：SBOM 文件、审计例外清单、Secret 扫描报告、各命令退出码与时间，写入 `evidence/`。
- 制品：API / 后台 / 小程序构建产物 digest，冻结 UAT 候选时记录；当前尚无制品。

## 产品安全评审项

| 编号 | 检查项 | 关联 | 状态 |
|---|---|---|---|
| SEC-E-001 | 管理端写入受 `route:edit` / `config:write` 与服务端 Guard 保护，只读账号返回 403 | FR-EXP-011、AC-EXP-016 | `not-run` |
| SEC-E-002 | DTO 运行时校验拒绝未知 scene、非法 subType 组合与新写入 fish，且不落库 | NFR-SEC-001、AC-EXP-003 | `not-run` |
| SEC-E-003 | 响应不直接返回 Prisma 实体；错误响应使用稳定错误码，不展示内部异常堆栈 | NFR-SEC-001、AC-EXP-003 | `not-run` |
| SEC-E-004 | 配置保存沿用 `expectedUpdatedAt` 乐观锁，并发冲突 409，不出现后写覆盖 | FR-EXP-011、AC-EXP-010 | `not-run` |
| SEC-E-005 | 结构化日志不含 Secret、Token、密码或用户输入原文；可按 requestId/traceId 检索 | NFR-OBS-001、AC-EXP-016 | `not-run` |
| SEC-E-006 | 回填脚本可预览、可审计、幂等；生产执行需针对目标、环境、动作的明确授权与备份点 | FR-EXP-003、AC-EXP-005 | `not-run` |
| SEC-E-007 | 兼容映射 `fish → play + fishing` 不被用于绕过隐藏分类过滤 | FR-EXP-012、AC-EXP-010 | `not-run` |

## 供应链与阻塞条件

- P0/P1 安全问题未关闭 → 安全 Gate 保持 `pending`，发布 Gate 不得通过。
- 审计例外必须记录理由、范围、期限与补救方案，不得静默跳过失败检查。
- 不得把计划、模拟输出、旧报告或人工口述写成已执行证据。

## 结论

尚未执行任何安全或供应链检查，无通过结论；当前 `not-run`。
