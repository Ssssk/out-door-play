# 需求追踪矩阵

| 需求 ID | 验收 ID | 设计位置 | 任务 ID | 测试 ID | 证据 | 状态 |
|---|---|---|---|---|---|---|
| FR-PROGRAM-001 | AC-PROGRAM-001 | 05-design/目标架构 | TASK-001,009 | HARNESS-001 | project-quality active + 2026-09-05 validate-harness 0 errors | passed |
| FR-SOURCE-001 | AC-SOURCE-001,AC-SOURCE-002 | 01-clarification | TASK-002,005 | SRC-001 | sources/*.sha256 + approval | passed |
| FR-ASIS-001 | AC-ASIS-001 | 04-impact-analysis | TASK-003 | BASE-001~004 | command output + git status | in-progress |
| FR-ARCH-001 | AC-ARCH-001 | 05-design/备选方案 | TASK-006 | architecture review | approvals/2026-08-30-requirements-design.md + ADR-006 | passed |
| FR-PLAN-001 | AC-PLAN-001 | 02-requirements/切片 | TASK-008,012 | review | CHG-SEC-DEPS-001 + CHG-ADMIN-FOUNDATION-001 + CHG-MOBILE-IDENTITY-001 | partial：前三个 Change 已实施，后续业务切片待拆分 |
| FR-CI-001 | AC-CI-COMPONENT-001,AC-CI-ORDER-001 | 05-design/应用 CI | TASK-013 | CI-COMPONENT-001 | evidence/2026-09-06-component-ci-release.md | passed |
| NFR-QUALITY-001 | AC-QUALITY-001 | test-plan | TASK-003,007,009 | BASE-001~004 | active project-quality + 各 Change evidence | partial：静态/单元/契约/构建通过，Docker 集成与 CI 容器验证阻塞 |
| NFR-TRACE-001 | AC-SOURCE-001 | source-baseline | TASK-002 | SRC-001 | source-baseline.json | in-progress |
| NFR-SEC-001 | AC-SEC-001 | 05-design/安全 | TASK-010 | SEC-001,SEC-002 | dependency/mobile security review | failed：Vite 2 high、独立安全评审未完成 |
| NFR-COMPAT-001 | AC-QUALITY-001 | 05-design/前端 | future changes | BASE-003,004 | build output | partial |
| NFR-OPS-001 | pending | 05-design/Operations | future changes | pending | none | blocked |
| NFR-PERF-001 | pending per business slice | 05-design/性能 | future changes | pending | none | deferred-to-slices |

所有 FR/NFR/AC 必须出现，且完成时不得存在无证据的 `passed`。

