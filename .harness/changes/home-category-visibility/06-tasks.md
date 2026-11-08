# 实施任务

任务格式 `TASK-XXX`，每项关联需求/验收，完成时必须有可定位证据。

> **当前状态**：需求 Gate 与设计 Gate 已批准（2026-11-08T07:11:04Z，用户回复「确认」），Change 进入 `implementing`，任务按依赖顺序开工。勾选状态与 `evidence/` 同步更新；未执行项保持 `not-run`，不得写成通过。

- [x] TASK-001 `[FR-CFG-001][FR-CFG-002][AC-CFG-017]` 关闭 Q-001 ~ Q-004、由产品 Owner 核对 `source-baseline.json` 并批准需求 Gate；记录决策人与时间 —— 已完成（2026-11-08T07:11:04Z，见 `approvals/2026-11-08-requirements-design.md`）
- [x] TASK-002 `[FR-CFG-001][FR-CFG-002][FR-CFG-011][AC-CFG-017]` 在 `contracts/openapi.yaml` 固化 3 个 operation，并把该契约路径追加到 `apps/api/src/scripts/verify-openapi-contract.ts` 的 `contractPaths` —— 已完成，`pnpm test:contract` 覆盖 3 个新 operation
- [x] TASK-003 `[FR-CFG-006][FR-CFG-007][FR-CFG-011][AC-CFG-008][AC-CFG-009][AC-CFG-010]` 实现 `SceneTabsConfigService`（DTO、白名单、业务校验、损坏兜底、投影、条件更新冲突）—— 已完成
- [x] TASK-004 `[FR-CFG-001][FR-CFG-011][AC-CFG-012][AC-CFG-013]` 实现 `ConfigController` 公开 GET 与 `AdminController` GET/PUT，复用 `config:read` / `config:write` 与既有 Guard —— 已完成
- [x] TASK-005 `[FR-CFG-003][FR-CFG-005][AC-CFG-003][AC-CFG-004][AC-CFG-005]` 在 `RoutesService.list` 与 `UserService.favorites` 接入 `enabledScenes()` 短路过滤；断言详情用例不受影响 —— 已完成，新增单元测试
- [x] TASK-006 `[FR-CFG-001][FR-CFG-008][FR-CFG-009][AC-CFG-001][AC-CFG-006][AC-CFG-007][AC-CFG-011]` 实现 `useSceneTabs.ts`、改造 `SceneTabs.vue` props、`useDiscovery.ts`（缓存 key、预取裁剪、选中态校正）与 `favorites/index.vue` —— 已完成
- [x] TASK-007 `[FR-CFG-001][FR-CFG-008][NFR-RELI-001][AC-CFG-010][AC-CFG-011]` 小程序侧内置 DEFAULT 常量与配置失败兜底、并发 `onShow` 去重、卸载竞态保护 —— 已完成（目标端故障注入仍待 `TEST-E2E-003`）
- [x] TASK-008 `[FR-CFG-002][FR-CFG-004][FR-CFG-011][AC-CFG-002][AC-CFG-012][AC-CFG-014]` 新增后台 `SceneTabsConfigView.vue`、路由与菜单项、类型定义；实现全部 UI 状态、校验与「恢复默认」二次确认 —— 已完成（浏览器 E2E 待执行）
- [x] TASK-009 `[FR-CFG-010][DEC-003][AC-CFG-015]` 修正 `CitiesView.vue:103,156` 文案与 `admin.service.ts` 注释，不改变 `City.scenes` 行为 —— 已完成
- [ ] TASK-010 `[FR-CFG-001][FR-CFG-011][NFR-OBS-001][AC-CFG-019]` 增加五类结构化日志事件并做脱敏与日志断言测试 —— 部分完成：日志事件已落地，日志断言测试与压测为 `not-run`
- [ ] TASK-011 `[AC-CFG-003]` 至 `[AC-CFG-019]` 编写单元、组件、集成、契约、E2E、性能、可访问性与 UAT 用例并执行，结果写入 `evidence/` —— 部分完成：单元测试与契约测试已执行并记录；集成、E2E、性能、可访问性、UAT 为 `not-run`
- [ ] TASK-012 `[NFR-COMPAT-001][AC-CFG-016]` 执行四组合滚动兼容矩阵与目标端真机/体验版验证，保存截图与检查记录
- [ ] TASK-013 `[FR-CFG-010][DEC-012]` 按 API → 后台 → 小程序顺序执行发布；完成微信小程序构建上传、体验版 UAT、提交审核与正式发布
- [ ] TASK-014 `[07-knowledge.md]` 执行 `knowledge-retrieval` 复核、按需沉淀知识、同步 Wiki 中已生效事实（`/config/*` 资源清单、`SystemConfig` 说明、配置模块）
- [ ] TASK-015 `[completion.md]` 完成独立 Reviewer 评审、Gate 决策一致性检查与完成报告；未执行项标记 `not-run`

## 依赖顺序

```text
TASK-001（人工 Gate）
  → TASK-002（契约）→ TASK-003（配置服务）→ TASK-004（接口）→ TASK-005（列表过滤）
  → TASK-006（小程序消费）→ TASK-007（兜底与竞态）
  → TASK-008（后台模块，可与 TASK-006/007 并行）
  → TASK-009（文案）→ TASK-010（日志）
  → TASK-011（测试）→ TASK-012（兼容与真机）→ TASK-013（发布）→ TASK-014（知识/Wiki）→ TASK-015（完成）
```

## 并行边界

- TASK-006/007（小程序）与 TASK-008（后台）可并行，但都依赖 TASK-002 的契约与 TASK-004 的接口签名。
- TASK-003 与 TASK-004 必须由同一人顺序完成，避免 DTO 与 Presenter 口径分叉。
- TASK-005 不得与 TASK-003 并行改动 `modules/routes` 与配置服务的调用约定。
- 测试执行（TASK-011）必须在 TASK-003 ~ TASK-010 全部完成后开始；禁止为了让 CI 变绿提前写「通过」证据。

## 暂停/回退条件

- 需求 Gate / 设计 Gate 未通过，或 Q-001 ~ Q-004 出现与已写 AC 冲突的结论 → 停止全部实现，回到 `clarifying`。
- 发现需要新增 Prisma Migration、新基础设施、新权限码或改变公开契约口径 → 停止受影响任务，升级给架构 Owner。
- `pnpm test:contract` 未覆盖本 Change 的 3 个 operation → 不算完成 TASK-002。
- 目标端无法获得（体验版二维码/真机不可用） → 不宣称 UAT 通过，发布 Gate 保持 `pending`。
- 工作区出现与本 Change 重叠且来源不明的用户修改 → 停止写入并请求裁决。

## Owner 与 Gate 交接

| TASK | 执行人 | 验证人 | 对应 Gate | Evidence |
|---|---|---|---|---|
| TASK-001 | 产品 Owner | 架构 Owner | requirements | `approvals/` 决策记录、`gate-decisions.json`、`source-baseline.json` |
| TASK-002 | 后端实现者 | 独立 Reviewer | design → implementation | `contracts/openapi.yaml`、`apps/api/src/scripts/verify-openapi-contract.ts` |
| TASK-003 ~ TASK-005 | 后端实现者 | 独立 Reviewer | implementation / verification | 源码 + `evidence/002-unit`、`003-integration`、`004-contract` |
| TASK-006 ~ TASK-007 | 前端实现者 | 独立 Reviewer | implementation / verification | 源码 + 组件测试 + `evidence/005-e2e` |
| TASK-008 ~ TASK-009 | 前端实现者 | UX Owner | implementation / uat | 后台源码 + 浏览器 E2E 截图 |
| TASK-010 | 后端实现者 | 安全 Owner | security / operations | 日志断言测试 + `verification/security-review.md` |
| TASK-011 ~ TASK-012 | 测试执行者 | 产品 Owner | verification / uat | `evidence/` 全套机器可读证据 |
| TASK-013 | 发布负责人 | 产品 Owner | release | 小程序上传记录、审核结果、发布观察记录 |
| TASK-014 | 架构 Owner | 独立 Reviewer | completion | Wiki diff + `07-knowledge.md` |
| TASK-015 | 独立 Reviewer | 产品 Owner | completion | `completion.md`、`gate-decisions.json` |

执行人与最终独立 Reviewer 不得为同一人（`AGENTS.md` §6 红线 12）。
