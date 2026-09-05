# 实施任务

- [x] IDENTITY-TASK-000 `[ALL]` 执行知识检索，校正 Prisma/TypeORM 冲突并补齐可评审设计
- [x] IDENTITY-TASK-001 `[FR-IDENTITY-001][FR-PROFILE-001][FR-FAVORITE-001]` 冻结 OpenAPI、错误码、DTO/Presenter 与运行时契约测试
- [x] IDENTITY-TASK-002 `[FR-IDENTITY-001][AC-IDENTITY-SESSION-001]` 实现 Prisma identity/session schema 与版本化 migration
- [x] IDENTITY-TASK-003 `[FR-IDENTITY-001][NFR-IDENTITY-SEC-001][NFR-IDENTITY-REL-001]` 实现 provider、token/session policy、Guard 与 auth API
- [x] IDENTITY-TASK-004 `[FR-PROFILE-001][FR-FAVORITE-001]` 实现可信 principal 下的资料和收藏用例/API
- [x] IDENTITY-TASK-005 `[NFR-IDENTITY-REL-001][AC-CLIENT-SESSION-001]` 实现 mobile auth store、身份 adapter 与 request single-flight
- [x] IDENTITY-TASK-006 `[FR-PROFILE-001][FR-FAVORITE-001][AC-TARGET-001]` 实现登录/mine/edit/favorites/detail 状态与服务端真相
- [x] IDENTITY-TASK-007 `[ALL]` 编写 provider/session/Guard/profile/favorite/request/store 单元与组件测试
- [x] IDENTITY-TASK-008 `[ALL]` 在隔离 MySQL 执行 migration、并发 refresh、双账号授权、契约和 H5 E2E
- [ ] IDENTITY-TASK-009 `[NFR-IDENTITY-SEC-001]` 执行 Secret/SAST/SCA/SBOM、威胁模型和独立安全评审
- [ ] IDENTITY-TASK-010 `[AC-TARGET-001]` 执行 H5 UAT、微信构建和正式凭证/真机 UAT；补齐目标端证据
- [ ] IDENTITY-TASK-011 `[ALL]` 更新生效 Wiki、发布/回滚/Operations 文档并交独立 Reviewer

## 2026-09-05 实施断点

- TASK-007：23 个本 Change 相关自动化测试已落地并通过（API 18、mobile request/store 3、DetailActionBar 组件 2）；组件真实挂载覆盖服务端收藏态及三个用户事件。
- TASK-008：MySQL 8.4 migration/redeploy、20 路 refresh、双账号资料/收藏隔离与 10 路并发收藏已通过；H5 登录、冷启动恢复、资料更新并恢复、收藏读取和退出闭环通过。
- TASK-009：Secret 扫描通过，SBOM 已刷新；SCA 剩余 2 个 uni-app/Vite high，独立安全评审未执行。
- TASK-010：H5 与微信小程序构建通过；H5 游客态、登录页与 API 不可达错误态已人工 smoke。产品 UAT 与微信正式凭证/真机仍 pending。

## 依赖顺序

1. 用户批准本具体设计 Gate。
2. TASK-001 契约先行；TASK-002 数据结构后，TASK-003/004 才可落地。
3. TASK-005 依赖 auth 契约，TASK-006 依赖身份和用户 API。
4. TASK-007 靠近实现同步编写；TASK-008 需 Docker/隔离 MySQL 恢复。
5. TASK-009/010/011 使用冻结候选制品，不能代替实现或彼此代签。

## 并行边界

- 设计批准后，Prisma migration、后端纯领域单元、前端 auth store 单元可在契约冻结后并行。
- 同一 OpenAPI/错误码、Prisma schema/migration、request/auth store 由单一 Owner 串行修改，避免冲突。
- 本轮未授权使用独立子代理并行实施；最终安全/独立 Reviewer 必须使用独立上下文且不由主要实现者代签。

## 暂停/回退条件

- 设计未批准、权限/错误码/数据口径需要改变、需要新增 Redis/MQ 或正式 H5 OAuth时，返回设计 Gate。
- Docker/MySQL 指向生产或隔离边界不清时，停止 migration/integration。
- 发现 token/OpenID/session_key 泄露、跨用户访问或 dev provider 可在 production 开启时，按 P1 阻塞。
- 正式微信凭证缺失只允许 H5 dev 与 mock/provider 单元继续，微信联调/UAT 保持 pending。

## Owner 与 Gate 交接

| TASK | 执行人 | 验证人 | 对应 Gate | Evidence |
|---|---|---|---|---|
| 000-006 | Codex（获批后） | 用户/架构 Owner | Design / Implementation | Change 文档、diff、静态/单元结果 |
| 007-008 | Codex/CI | 独立 Reviewer | Implementation / Verification | `.evidence.json`、报告、日志 |
| 009 | 安全 Reviewer | 安全 Owner | Security | 威胁模型、扫描、SBOM、评审结论 |
| 010 | 用户/产品 Owner | 产品 Owner | UAT | 候选版本、设备/环境、截图/日志 |
| 011 | 发布/运维 Owner | 独立 Reviewer | Operations / Release / Completion | Gate 决策与发布证据 |
