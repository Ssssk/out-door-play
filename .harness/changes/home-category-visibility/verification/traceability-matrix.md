# 需求追踪矩阵

状态说明：当前 Change 为 `implementing`（需求/设计 Gate 已批准）。单元测试与契约测试已执行，结果见 `evidence/2026-11-08-implementation.md`；表格证据列是计划位置，实际执行结果以该证据文档为准；其余测试为 `not-run`，状态列保持 `planned`（未签署任何后续 Gate）。完成时不得存在无证据的 `passed`。

| 需求 ID | 验收 ID | 设计位置 | 任务 ID | 测试 ID | 证据 | 状态 |
|---|---|---|---|---|---|---|
| FR-CFG-001 | AC-CFG-001、AC-CFG-002、AC-CFG-018 | `05-design.md` 目标架构与数据流；`frontend/component-design.md` SceneTabs/useSceneTabs | TASK-002、TASK-006、TASK-007 | TEST-UNIT-001、TEST-E2E-001、TEST-UAT-001 | `evidence/`（not-run） | planned |
| FR-CFG-002 | AC-CFG-002、AC-CFG-012、AC-CFG-014、AC-CFG-015、AC-CFG-017 | `05-design.md` 后台「系统配置」模块；`frontend/page-flow.md` 页面/路由变化 | TASK-002、TASK-008、TASK-009 | TEST-CT-001、TEST-E2E-002、TEST-UAT-002 | `evidence/`（not-run） | planned |
| FR-CFG-003 | AC-CFG-003、AC-CFG-004 | `05-design.md` 目标架构；`backend/domain-design.md` 用例与不变量 | TASK-005、TASK-011 | TEST-UNIT-002、TEST-INT-001、TEST-CT-001 | `evidence/`（not-run） | planned |
| FR-CFG-004 | AC-CFG-002、AC-CFG-008 | `05-design.md` 业务不变量；`contracts/openapi.yaml` AdminSceneTab | TASK-003、TASK-008 | TEST-UNIT-003、TEST-INT-002、TEST-E2E-002 | `evidence/`（not-run） | planned |
| FR-CFG-005 | AC-CFG-005、AC-CFG-016 | `05-design.md` 目标架构（详情不经配置服务） | TASK-005、TASK-012 | TEST-INT-001、TEST-E2E-003、TEST-UAT-001 | `evidence/`（not-run） | planned |
| FR-CFG-006 | AC-CFG-008 | `backend/domain-design.md` 业务不变量；`contracts/error-codes.yaml` CONFIG_INVALID | TASK-003、TASK-011 | TEST-UNIT-003、TEST-INT-002、TEST-CT-001 | `evidence/`（not-run） | planned |
| FR-CFG-007 | AC-CFG-001、AC-CFG-009、AC-CFG-010 | `05-design.md` 业务不变量与失败时序；`backend/domain-design.md` DEFAULT | TASK-003、TASK-007 | TEST-UNIT-001、TEST-UNIT-004、TEST-INT-003 | `evidence/`（not-run） | planned |
| FR-CFG-008 | AC-CFG-006、AC-CFG-007、AC-CFG-011、AC-CFG-016 | `frontend/component-design.md` 请求竞态；`frontend/page-flow.md` 状态矩阵 | TASK-006、TASK-007、TASK-012 | TEST-UNIT-005、TEST-E2E-001、TEST-E2E-003 | `evidence/`（not-run） | planned |
| FR-CFG-009 | AC-CFG-004、AC-CFG-006、AC-CFG-007 | `frontend/component-design.md` Pinia 与 composable；`05-design.md` 小程序端 | TASK-005、TASK-006 | TEST-UNIT-002、TEST-UNIT-005、TEST-INT-001 | `evidence/`（not-run） | planned |
| FR-CFG-010 | AC-CFG-015 | `05-design.md` UI/UX 文案；`frontend/ui-ux-review.md` 文案表 | TASK-009 | TEST-E2E-002、TEST-UAT-002 | `evidence/`（not-run） | planned |
| FR-CFG-011 | AC-CFG-012、AC-CFG-013、AC-CFG-014、AC-CFG-017、AC-CFG-019 | `05-design.md` 成功/失败/并发时序；`backend/domain-design.md` 事务与并发 | TASK-004、TASK-008、TASK-010、TASK-011 | TEST-INT-004、TEST-CT-001、TEST-E2E-002、TEST-PERF-001 | `evidence/`（not-run） | planned |
| NFR-PERF-001 | AC-CFG-019 | `05-design.md` 性能容量；`operations/slo.yaml` | TASK-010、TASK-011 | TEST-PERF-001、TEST-INT-003 | `evidence/`（not-run） | planned |
| NFR-RELI-001 | AC-CFG-010、AC-CFG-011 | `05-design.md` 失败时序；DEC-009 | TASK-007、TASK-011 | TEST-UNIT-004、TEST-UNIT-005、TEST-E2E-003 | `evidence/`（not-run） | planned |
| NFR-SEC-001 | AC-CFG-003、AC-CFG-008、AC-CFG-012 | `05-design.md` 安全与隐私；`contracts/error-codes.yaml` | TASK-003、TASK-004、TASK-011 | TEST-INT-002、TEST-INT-004、TEST-CT-001 | `evidence/`（not-run） | planned |
| NFR-COMPAT-001 | AC-CFG-001、AC-CFG-005、AC-CFG-016 | `05-design.md` 发布与回滚；DEC-010 / DEC-012 | TASK-012、TASK-013 | TEST-E2E-003、TEST-UAT-001 | `evidence/`（not-run） | planned |
| NFR-OBS-001 | AC-CFG-019 | `05-design.md` 可观测性 | TASK-010 | TEST-UNIT-006、TEST-PERF-001 | `evidence/`（not-run） | planned |
| NFR-A11Y-001 | AC-CFG-018 | `frontend/ui-ux-review.md` 可访问性设计 | TASK-006、TASK-008、TASK-012 | TEST-A11Y-001、TEST-E2E-001 | `evidence/`（not-run） | planned |

## 反向核对

- `02-requirements.md` 中 11 条 FR 与 6 条 NFR 全部出现在上表。
- `03-acceptance-criteria.md` 中 AC-CFG-001 ~ AC-CFG-019 全部出现在上表，且每条至少关联一个需求 ID。
- `06-tasks.md` 中 TASK-001 ~ TASK-015 均有需求或验收追踪；TASK-014 / TASK-015 为知识与完成交接任务。
- 所有 FR/NFR 均在 `source-baseline.json` 的 `requirement_mappings` 中有来源锚点；Q-001 关闭前来源基线保持 `pending`。
- 无孤立需求、无无来源验收项、无预先标记 `passed` 的证据。
