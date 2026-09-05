# 2026-09-05 实施与验证证据

- Change：`CHG-MOBILE-IDENTITY-001`
- 基线：`HEAD a2a56a79851bda3ca129f27e63b3cf17b02a8b8b` + 未提交工作树
- Runner：Codex，本机 Windows / PowerShell，Node/pnpm 由仓库锁定
- 范围：普通用户会话、资料/收藏授权、uni-app 客户端会话与页面接入

## 已执行且通过

| 命令/操作 | 退出码 | 摘要 |
|---|---:|---|
| `pnpm --filter @chumen/mobile type-check` | 0 | Vue/TS 类型检查通过 |
| `pnpm --filter @chumen/mobile test` | 0 | 4 files / 7 tests；其中本 Change 5 tests：GET 单次重放、写不重放、并发刷新 single-flight、DetailActionBar 收藏态与事件 |
| `pnpm --filter @chumen/mobile build` | 0 | H5 与 mp-weixin 均构建成功；仅现有 Sass/Wot 弃用告警 |
| `pnpm format:check` | 0 | 格式策略通过 |
| `pnpm lint` | 0 | 0 error；16 个既有/已知 warning |
| `pnpm type-check` | 0 | API/Admin/Mobile 全部通过 |
| `pnpm test` | 0 | 最终 active 总门禁：API 31、Admin 4、Mobile 7 全部通过 |
| `pnpm test:contract` | 0 | 两份 OpenAPI delta 共 13 operations 与 Nest runtime 一致 |
| `pnpm --filter @chumen/api build` | 0 | Nest build 通过 |
| `pnpm --filter @chumen/admin build` | 0 | Admin build 通过；保留 503.80 kB chunk 告警 |
| `pnpm test:integration`（最终） | 0 | MySQL 8.4；2 files / 2 tests。migration up-to-date、20 路 refresh 仅 1 成功、双账号隔离、10 路并发收藏幂等、Admin session 回归通过 |
| `pnpm test:e2e`（最终） | 0 | 使用 `nest build` 编译制品启动真实 HTTP；health 200、匿名 Admin 401 稳定码、非法 DTO 422 |
| 本地 H5 browser E2E | passed | dev 登录、冷启动 refresh、驾车/钓鱼服务端收藏、昵称更新并恢复原值、退出后游客态；服务和会话已清理 |
| `node .harness/scripts/run-project-quality.mjs`（最终工作树，2026-09-05） | 1 | active 总门禁真实执行；install、format、lint、typecheck、unit、build、contract、integration、e2e 全部通过，仅 security 因下述 2 个 Vite high fail-closed |

构建产物：`apps/mobile/dist/build/h5/index.html`、`apps/mobile/dist/build/mp-weixin/app.json`、`apps/api/dist/main.js`、`apps/admin/dist/index.html`。

## 首次失败与修复（保留）

- 首次 `docker info` 失败，随后启动 Docker Desktop 27.2.0，MySQL 8.4 容器 healthy；测试完成后已 `docker compose stop mysql`。
- 首次 integration：migration 成功，但 Windows 不展开 Vitest CLI glob；脚本改为 Vitest 文件名过滤。第二次暴露 Vitest/esbuild 缺 Nest constructor metadata；集成服务改为显式注入真实 Prisma。第三次暴露并发 `upsert` 主键冲突；改为复合主键 + `createMany(skipDuplicates)` 后原用例通过。
- 首次 HTTP E2E 因同一 metadata 问题返回 500；改为 prebuild 并测试实际编译产物。随后旧断言与稳定错误码/422 语义不一致；修正断言后通过。
- `pnpm security:scan`：退出码 1。Secret、lint、SBOM 阶段完成；官方 npm audit 为 25 vulnerabilities（4 low / 19 moderate / 2 high），2 high 均来自 uni-app 精确兼容线的 Vite 5.2.8。
- active 总门禁的 security 阶段再次复现相同结果：`GHSA-c27g-q93r-2cwf` 与 `GHSA-fx2h-pf6j-xcff`；未弱化阈值、未跳过扫描、未把总门禁标为通过。
- 组件测试补齐后，新增的 `@vue/test-utils`、`happy-dom`、`@vitejs/plugin-vue` 均为 mobile devDependency；frozen install、mobile test/type-check、H5/微信构建通过，生产依赖审计数量不变。
- GitHub CI 空库 run、微信正式 code2Session/真机、产品 UAT、独立安全/Reviewer、Operations/Release Gate 均未执行。

## 集成测试范围

- `apps/api/test/mobile-identity.integration.spec.ts`：匿名拒绝、20 路 refresh 仅 1 成功、双账号资料隔离、并发收藏幂等与账号隔离；已在本地隔离库通过。
- `.github/workflows/harness-contract.yml` 已配置 MySQL 8.4 healthcheck 和 active 全质量门禁；仍需由真实 push/PR 产生远端 SHA 绑定证据。
