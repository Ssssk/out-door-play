# 2026-09-05 实施与验证证据

- Change：`CHG-MOBILE-DISCOVERY-001`
- 基线：`HEAD a2a56a79851bda3ca129f27e63b3cf17b02a8b8b` + 未提交工作树
- Runner：Codex；Windows / PowerShell；本地 Docker Desktop 27.2.0、MySQL 8.4
- 时间：2026-09-05 16:19~16:36（Asia/Shanghai）

## 已执行且通过

| 命令/操作 | 退出码 | 摘要 |
|---|---:|---|
| `pnpm format:check` | 0 | 格式策略通过 |
| `pnpm lint` | 0 | 0 error；16 个既有 warning |
| `pnpm type-check` | 0 | API/Admin/Mobile 全部通过 |
| `pnpm test` + 最终 mobile rerun | 0 | API 34、Admin 4、Mobile 11 全部通过；新增同参数在途请求合并测试 |
| `pnpm test:contract` | 0 | 3 份契约、17 operations 与 Nest runtime 一致 |
| `pnpm build` | 0 | API、Admin、H5、mp-weixin 构建通过；保留既有 Sass/chunk 告警 |
| `pnpm db:deploy` | 0 | MySQL 5 个 migration 已应用，无待执行 migration |
| `pnpm --filter @chumen/api test:integration` | 0 | 3 files / 4 tests；Discovery 稳定排序、limit、online/enabled 过滤通过 |
| `pnpm test:e2e` | 0 | 5 tests；health、Admin 401、DTO 422、cities 200、Discovery 404 通过 |
| `pnpm security:secret` | 0 | 本地 `.env` 未读取且被排除，Secret scan 通过 |
| 本地 H5 browser smoke | passed | 北京空态；城市抽屉切武汉；Top7→Top9；钓鱼 8M/15M 水深；路线/钓点详情；未知详情明确错误态 |
| 运行态探针 | passed | `GET /v1/health` database connected；fish 响应为 Top3/Top5 且仅含 `depthM` |

构建产物：`apps/mobile/dist/build/h5/index.html`、`apps/mobile/dist/build/mp-weixin/app.json`、`apps/api/dist/main.js`、`apps/admin/dist/index.html`。

## 失败与未通过项（保留）

- 首次 DB 启动因 Docker Desktop 未运行失败；启动既有 Docker Desktop 后 MySQL healthy，迁移与集成测试通过。
- 首次 lint 与 H5 构建并行时命中 Vite 瞬态 timestamp 文件；构建完成后顺序重跑 lint 为 0 error。
- 首次全仓 typecheck/test 并行触发两个 `prisma generate`，Windows 生成目录 EBUSY/EPERM；改为顺序重跑后两项均通过，未删除或跳过测试。新增同参数去重后，旧乱序测试因两个相同请求被正确合并而超时；测试改为“先切场景、再切城市”的真实不同请求，最终 11 项通过。
- `pnpm security:audit` 退出码 1：25 vulnerabilities（4 low / 19 moderate / 2 high）；2 high 为 uni-app 依赖链中的 Vite，公告 `GHSA-c27g-q93r-2cwf` 与 `GHSA-fx2h-pf6j-xcff`。未弱化阈值，Security Gate 保持 pending/failed。
- 微信构建已通过，但微信真机、正式分享/地图、产品 UAT、独立安全评审、独立 Reviewer 和 Release Gate 未执行。

## 当前运行态

- MySQL：`chumen-mysql`，`127.0.0.1:3307`，healthy。
- API：`http://127.0.0.1:3100/v1`，数据库探针正常。
- H5：`http://127.0.0.1:5173/`，开发服务器常驻。
