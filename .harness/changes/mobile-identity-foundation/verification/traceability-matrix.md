# 需求追踪矩阵

| 需求 ID | 验收 ID | 设计位置 | 任务 ID | 测试 ID | 证据 | 状态 |
|---|---|---|---|---|---|---|
| FR-IDENTITY-001 | AC-IDENTITY-LOGIN-001 | 05 登录/数据/API/安全 | 001-003 | UT-IDP-001, CT-OPENAPI-001, IT-MIG-001, E2E-H5-001, UAT-WX-001 | not-run | design-ready |
| FR-IDENTITY-001 | AC-IDENTITY-SESSION-001 | 05 不变量/刷新并发 | 002-003,007-008 | UT-SESSION-001, IT-REFRESH-001 | not-run | design-ready |
| FR-IDENTITY-001 | AC-TARGET-001 | 05 前端/目标端 | 005-006,010 | E2E-H5-001, BUILD-WX-001, UAT-WX-001 | not-run | design-ready |
| FR-PROFILE-001 | AC-AUTHORIZATION-001 | 05 Guard/资源隔离 | 004,007-008 | UT-GUARD-001, IT-AUTHZ-001 | not-run | design-ready |
| FR-PROFILE-001 | AC-PROFILE-001 | 05 资料时序/前端 | 004,006-008 | UT-USER-001, IT-AUTHZ-001, E2E-H5-001 | not-run | design-ready |
| FR-PROFILE-001 | AC-TARGET-001 | frontend/page-flow | 006,010 | E2E-H5-001, UAT-WX-001 | not-run | design-ready |
| FR-FAVORITE-001 | AC-AUTHORIZATION-001 | 05 Guard/资源隔离 | 004,007-008 | UT-GUARD-001, IT-AUTHZ-001 | not-run | design-ready |
| FR-FAVORITE-001 | AC-FAVORITE-001 | 05 收藏幂等/数据 | 004,006-008 | UT-FAV-001, IT-FAV-001, E2E-H5-001 | not-run | design-ready |
| FR-FAVORITE-001 | AC-TARGET-001 | frontend/page-flow | 006,010 | E2E-H5-001, UAT-WX-001 | not-run | design-ready |
| NFR-IDENTITY-SEC-001 | AC-IDENTITY-LOGIN-001 | 05 安全/Provider | 003,007,009 | UT-IDP-001, SEC-001 | not-run | design-ready |
| NFR-IDENTITY-SEC-001 | AC-AUTHORIZATION-001 | 05 安全/Guard | 003-004,007-009 | UT-GUARD-001, IT-AUTHZ-001, SEC-001 | not-run | design-ready |
| NFR-IDENTITY-REL-001 | AC-IDENTITY-SESSION-001 | 05 刷新并发 | 003,007-008 | UT-SESSION-001, IT-REFRESH-001 | not-run | design-ready |
| NFR-IDENTITY-REL-001 | AC-CLIENT-SESSION-001 | frontend/component-design | 005,007-008 | UT-CLIENT-001, E2E-H5-001 | not-run | design-ready |

所有 FR/NFR/AC 均已进入设计、任务和计划测试；当前没有 `passed`，也没有用旧证据填充本 Change。
