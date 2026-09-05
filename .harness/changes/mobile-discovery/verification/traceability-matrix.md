# 需求追踪矩阵

| 需求 ID | 验收 ID | 设计位置 | 任务 ID | 测试 ID | 证据 | 状态 |
|---|---|---|---|---|---|---|
| FR-DISCOVERY-CITY-001 | AC-CITY-001, AC-CITY-002 | 05 前端/数据流 | 001,003,005 | UT-STATE, IT, H5 | evidence/2026-09-05-implementation.md | local-verified |
| FR-DISCOVERY-LIST-001 | AC-LIST-001, AC-LIST-002, AC-LIST-003 | 05 不变量/API | 001-005 | UT-REPO, CT, IT, HTTP, H5 | 同上 | local-verified |
| FR-DISCOVERY-DETAIL-001 | AC-DETAIL-001, AC-DETAIL-002 | 05 Presenter/前端 | 001,002,004,005 | UT-API, IT, HTTP, H5 | 同上 | local-verified |
| FR-DISCOVERY-ACTION-001 | AC-ACTION-001 | 05 宿主能力 | 004,005,007 | H5, UAT-WX | H5 smoke；真机 not-run | partial |
| FR-DISCOVERY-STATE-001 | AC-LIST-003, AC-LIST-004 | 05 状态机 | 003,005 | UT-STATE, H5 | 同上 | local-verified |
| NFR-DISCOVERY-REL-001 | AC-LIST-001, AC-LIST-004 | 05 排序/latest-wins | 002,003,005 | UT-STATE, IT | 同上 | local-verified |
| NFR-DISCOVERY-SEC-001 / NFR-SEC-001 | AC-LIST-002, AC-DETAIL-001 | 05 安全 | 001,002,005,008 | UT, CT, HTTP, SEC | SCA 2 high | blocked-security |
| NFR-DISCOVERY-COMPAT-001 | AC-TARGET-001 | 05 跨端 | 004,005,007 | BUILD, UAT-WX | build passed；真机 not-run | partial |
| NFR-DISCOVERY-A11Y-001 | AC-A11Y-001 | frontend/component-design | 004,005,007 | component, H5, UAT-WX | component/H5 partial | partial |

所有 FR/NFR/AC 必须出现，且完成时不得存在无证据的 `passed`。

