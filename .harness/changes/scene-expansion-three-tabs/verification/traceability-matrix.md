# 需求追踪矩阵

> 状态：需求/设计 Gate 已批准，Change 为 `implementing`。`02-requirements.md` 的每条 FR/NFR 与 `03-acceptance-criteria.md` 的每条 AC 均在下表出现。下表矩阵行针对**目标端 / 真实 MySQL 演练 / E2E / UAT** 仍为 `not-run`；已执行的本地静态、单元、契约与构建检查另见文末「已执行的本地检查」，不得据此把矩阵行标成 `passed`。

## 需求 → 验收 → 设计 → 任务 → 测试

| 需求 ID | 验收 ID | 设计位置 | 任务 ID | 测试 ID | 证据 | 状态 |
|---|---|---|---|---|---|---|
| FR-EXP-001 | AC-EXP-001、AC-EXP-012 | `05-design.md`、`backend/domain-design.md`、`contracts/openapi.yaml` | TASK-E04、TASK-E05、TASK-E12 | TEST-E-001、TEST-E-004、TEST-E-017 | 尚无 | `not-run` |
| FR-EXP-002 | AC-EXP-002、AC-EXP-003 | `05-design.md`、`backend/domain-design.md` | TASK-E04、TASK-E06、TASK-E08 | TEST-E-002、TEST-E-004、TEST-E-011 | 尚无 | `not-run` |
| FR-EXP-003 | AC-EXP-005、AC-EXP-006 | `backend/migration-plan.md` | TASK-E03、TASK-E15 | TEST-E-009 | 尚无 | `not-run` |
| FR-EXP-004 | AC-EXP-001、AC-EXP-004 | `frontend/component-design.md` | TASK-E08 | TEST-E-011、TEST-E-012 | 尚无 | `not-run` |
| FR-EXP-005 | AC-EXP-002、AC-EXP-003 | `frontend/component-design.md` | TASK-E08 | TEST-E-004、TEST-E-011 | 尚无 | `not-run` |
| FR-EXP-006 | AC-EXP-001、AC-EXP-004、AC-EXP-011 | `frontend/component-design.md`、`frontend/page-flow.md` | TASK-E07、TASK-E09、TASK-E10 | TEST-E-002、TEST-E-011、TEST-E-012 | 尚无 | `not-run` |
| FR-EXP-007 | AC-EXP-003、AC-EXP-009、AC-EXP-010 | `05-design.md`、`backend/domain-design.md` | TASK-E05、TASK-E06 | TEST-E-003、TEST-E-006、TEST-E-007 | 尚无 | `not-run` |
| FR-EXP-008 | AC-EXP-007、AC-EXP-008 | `05-design.md`、`frontend/page-flow.md` | TASK-E05、TASK-E09 | TEST-E-005、TEST-E-012 | 尚无 | `not-run` |
| FR-EXP-009 | AC-EXP-010、AC-EXP-011 | `05-design.md` | TASK-E07、TASK-E10 | TEST-E-002、TEST-E-003、TEST-E-011 | 尚无 | `not-run` |
| FR-EXP-010 | AC-EXP-012 | `04-impact-analysis.md` | TASK-E07 | TEST-E-001、TEST-E-017 | 尚无 | `not-run` |
| FR-EXP-011 | AC-EXP-010、AC-EXP-016 | `05-design.md` | TASK-E11 | TEST-E-007、TEST-E-016 | 尚无 | `not-run` |
| FR-EXP-012 | AC-EXP-009、AC-EXP-014 | `05-design.md`、`release/release-plan.md` | TASK-E06、TASK-E14、TASK-E16 | TEST-E-006、TEST-E-013 | 尚无 | `not-run` |
| NFR-MIG-001 | AC-EXP-005、AC-EXP-006、AC-EXP-015 | `backend/migration-plan.md`、`operations/disaster-recovery.md` | TASK-E02、TASK-E03、TASK-E15 | TEST-E-009、TEST-E-010 | 尚无 | `not-run` |
| NFR-COMPAT-001 | AC-EXP-009、AC-EXP-014 | `05-design.md`、`release/release-plan.md` | TASK-E14、TASK-E16 | TEST-E-006、TEST-E-013 | 尚无 | `not-run` |
| NFR-SEC-001 | AC-EXP-003、AC-EXP-012、AC-EXP-016 | `05-design.md`、`verification/security-review.md` | TASK-E06、TASK-E11 | TEST-E-004、TEST-E-016 | 尚无 | `not-run` |
| NFR-PERF-001 | AC-EXP-015 | `verification/performance-test.md`、`backend/migration-plan.md` | TASK-E02 | TEST-E-010 | 尚无 | `not-run` |
| NFR-OBS-001 | AC-EXP-016 | `05-design.md`、`operations/operational-readiness.md` | TASK-E11 | TEST-E-007、TEST-E-016 | 尚无 | `not-run` |
| NFR-A11Y-001 | AC-EXP-016 | `frontend/ui-ux-review.md`、`verification/accessibility-test.md` | TASK-E08 | TEST-E-014 | 尚无 | `not-run` |
| FR-CFG-006（上游引用） | AC-EXP-012 | `02-requirements.md`「冲突裁决后的口径修订」第 1 条 | TASK-E04、TASK-E12 | TEST-E-001、TEST-E-017 | 尚无 | `not-run` |

## 验收 → 测试 → 目标端

| 验收 ID | 主测试 ID | 目标端 / 环境 | 验证方式 | 状态 |
|---|---|---|---|---|
| AC-EXP-001 | TEST-E-011、TEST-E-012 | 微信真机 + 后台 Chrome | 人工 + 后台 E2E | `not-run` |
| AC-EXP-002 | TEST-E-004、TEST-E-011 | 后台 Chrome + 演练 MySQL | E2E + 只读 SQL | `not-run` |
| AC-EXP-003 | TEST-E-004、TEST-E-016 | 演练 MySQL | 集成 + 契约 + 安全 | `not-run` |
| AC-EXP-004 | TEST-E-011、TEST-E-012 | 微信真机 + 后台 Chrome | 人工 + E2E | `not-run` |
| AC-EXP-005 | TEST-E-009 | 演练 MySQL | dry-run 报告 + 只读 SQL | `not-run` |
| AC-EXP-006 | TEST-E-009 | 演练 MySQL | 恢复演练记录 | `not-run` |
| AC-EXP-007 | TEST-E-005、TEST-E-012 | 微信真机 + 集成环境 | 人工 + 集成 | `not-run` |
| AC-EXP-008 | TEST-E-005 | 演练 MySQL | 集成（真实 MySQL） | `not-run` |
| AC-EXP-009 | TEST-E-006、TEST-E-013 | 集成环境 + 四组合矩阵 | 集成 + 目标端矩阵 | `not-run` |
| AC-EXP-010 | TEST-E-003、TEST-E-007 | 集成环境 + 后台 Chrome | 集成 + E2E | `not-run` |
| AC-EXP-011 | TEST-E-002、TEST-E-011 | 后台 Chrome + 微信真机 | 单元 + E2E + 人工 | `not-run` |
| AC-EXP-012 | TEST-E-001、TEST-E-017 | 本地工作树 | 静态检索 + 构建 | `not-run` |
| AC-EXP-013 | TEST-E-008 | 本地构建产物 | 契约测试 + 反证 | `not-run` |
| AC-EXP-014 | TEST-E-013、TEST-E-012 | 四组合目标端矩阵 | 人工 + E2E | `not-run` |
| AC-EXP-015 | TEST-E-010 | 演练 MySQL | 压测/DDL 评估报告 | `not-run` |
| AC-EXP-016 | TEST-E-007、TEST-E-014、TEST-E-016 | 后台 Chrome + 微信真机 | 集成 + 日志断言 + 人工 | `not-run` |

## 产品 UAT 覆盖

用户可见需求全部进入产品 UAT：3 个分类、子类型新建与筛选、空态、分享详情、收藏、配置显隐与恢复默认；清单见 `verification/product-uat.md`，当前 `not-run`。

## 已执行的本地检查（2026-11-08）

真实命令、退出码与摘要见 `evidence/2026-11-08-implementation-phase2.md`。这些检查只覆盖本地工作树，不替代上表目标端与集成验证。

| 覆盖项 | 命令 | 结果 |
|---|---|---|
| 小程序类型 | `pnpm --filter @chumen/mobile type-check` | 0 诊断 |
| 小程序单元/组件 | `pnpm --filter @chumen/mobile test` | 18 文件 / 76 测试通过 |
| 小程序产物 | `pnpm --filter @chumen/mobile build` | H5 + mp-weixin 构建完成 |
| 后端类型 | `pnpm --filter @chumen/api type-check` | 0 诊断 |
| 后端单元 | `pnpm --filter @chumen/api test` | 27 文件 / 145 测试通过 |
| 后台类型/单测/构建 | `pnpm --filter @chumen/admin type-check && test && build` | 4 测试通过、生产产物生成 |
| 契约 | `pnpm test:contract` | 26 operation / 6 contract 通过 |
| 静态检查 | `pnpm lint`、`pnpm format:check` | 0 error（既有 45 warning）、格式通过 |
| Harness | `node .harness/scripts/validate-harness.mjs` | Warnings 0 / Errors 0 |
