# 实现阶段本地验证证据（2026-11-08）

- Change：`CHG-HOME-CATEGORY-001`
- 代码基线：**未提交工作树**，基于 `HEAD 48308d8`；本次改动尚未形成提交 SHA / 制品 digest，不得写成已发布制品。
- 环境：本地 macOS，项目锁文件定义的 Node / pnpm / Prisma 7.10.0 / Vitest；`DATABASE_URL` 与 `SHADOW_DATABASE_URL` 使用本地占位值，仅用于 `prisma generate` 生成 Client，**未连接任何数据库**（不输出真实凭证）。
- 执行者：AI 实现者（本会话）；独立 Reviewer 尚未评审。
- 时间段：2026-11-08 15:25 ~ 15:29（本地）。

## 已执行命令与结果

| # | 命令 | 关联 TASK/FR/AC | 退出码 | 摘要 |
|---|---|---|---|---|
| 1 | `apps/api: pnpm type-check` | TASK-002~005 | 0 | 首次因 `SystemConfigModule` 别名与方法重名失败（已修复），修复后通过 |
| 2 | `apps/api: pnpm test` | `TEST-UNIT-002`、`TEST-UNIT-003`、`AC-CFG-003`、`AC-CFG-005` | 0 | 25 文件 / 122 用例全部通过；含新增「隐藏场景拒列表、留详情」单元测试 |
| 3 | `apps/api: pnpm test:contract` | TASK-002、`AC-CFG-017` | 0 | 校验 5 份契约共 21 个 operation，包含 `getPublicSceneTabs` / `getAdminSceneTabs` / `updateAdminSceneTabs` |
| 4 | `apps/mobile: pnpm type-check` | TASK-006~007 | 0 | 通过 |
| 5 | `apps/mobile: pnpm test` | `TEST-UNIT-005`、`AC-CFG-006`、`AC-CFG-011` | 0 | 首次因旧预取断言期望隐藏场景被预取而失败（1/64）；更新为「按启用分类预取」并新增回归用例后 17 文件 / 65 用例全通过 |
| 6 | `apps/mobile: pnpm build:mp-weixin` | TASK-006、`NFR-COMPAT-001` | 0 | 微信小程序产物构建完成，仅有既有 Sass 弃用告警 |
| 7 | `apps/mobile: pnpm build:h5` | `NFR-COMPAT-001` | 0 | H5 产物构建完成，仅有既有 Sass 弃用告警 |
| 8 | `apps/admin: pnpm type-check && pnpm build` | TASK-008 | 0 | 通过；产物含 `SceneTabsConfigView` 独立 chunk |
| 9 | `apps/admin: pnpm test` | TASK-008 | 0 | 2 文件 / 4 用例通过 |
| 10 | `node .harness/scripts/validate-harness.mjs` | 全 Change | 0 | `Errors: 0 / Warnings: 0` |

补充事实：两次 uni-app 构建自动改写了 `apps/mobile/src/types/components.d.ts`，删除 4 个 Wot Design Uni 全局组件声明；已手工恢复并在 `git diff` 中核对。这是构建工具行为，不是本 Change 的功能变更。

## 覆盖范围（真实）

- 已验证：TypeScript 类型、单元测试、OpenAPI 契约、 uni-app 双端构建、后台构建与既有单测、Harness 结构与 Gate 一致性。
- 新增防回归测试：`routes.service.spec.ts` 隐藏场景列表返回空且详情可用；`useDiscovery.spec.ts` 隐藏场景不被预取、双场景启用时仍预取。

## 尚未执行（not-run）

- `TEST-INT-001` ~ `TEST-INT-004`：需要真实/容器化 MySQL 的集成测试（并发 409、损坏配置兜底、越权、隐藏场景收藏过滤）。
- `TEST-PERF-001`、`TEST-E2E-001` ~ `TEST-E2E-003`、`TEST-A11Y-001`、`TEST-UAT-001/002`：性能、目标端 E2E、可访问性、产品 UAT。
- 安全评审、供应链评审、Operations Gate、发布与小程序审核。
- 独立 Reviewer 评审与生产观察。

因此 Implementation、Verification、Security、UAT、Operations、Release、Completion Gate 全部保持 `pending`；以上结果不得被写成 Gate 通过。
