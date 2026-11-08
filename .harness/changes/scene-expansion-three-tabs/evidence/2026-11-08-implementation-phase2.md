# 实现阶段二证据（2026-11-08）

- Change ID：`CHG-SCENE-EXPANSION-001`（并入 `CHG-HOME-CATEGORY-001` 的代码，不单独发布）
- 提交 SHA：`813a61884ea48f5faa74d399bf2fea9e9b685164`
- 基线 SHA：`48308d8050d602837faff0a72c24e09f8d1bfff4`
- 环境：Darwin arm64 / Node v24.16.0 / pnpm 11.19.0 / 本地工作树；`DATABASE_URL=mysql://build:build@127.0.0.1:3306/build` 仅用于 `prisma generate`，**未连接任何数据库**
- 执行者：AI 实现者（本地命令，非流水线）
- 采集时间：`2026-11-08T12:42:00Z`（`date -u`）；单条命令未分别记录精确到秒的起止时间
- 证据目录：`evidence/unit-2026-11-08.evidence.json`、`static-2026-11-08.evidence.json`、`contract-2026-11-08.evidence.json`

## 本阶段产物

| 范围 | 文件 / 内容 |
|---|---|
| 小程序类型与常量 | `apps/mobile/src/types/domain.ts`（`BusinessScene` / `LegacyScene` / `PlayType` / 可选 `subType`）、`apps/mobile/src/common/scenes.ts` |
| 两层默认 | `apps/mobile/src/pages/index/useSceneTabs.ts`：服务端 3 项由配置下发；404 / 5xx / 超时 / 含 fish / 损坏配置一律降级仅 `drive`；新增 `useSceneTabs.spec.ts` 8 例 |
| API 与分流 | `apps/mobile/src/api/outdoor.ts` 支持 `Scene` 与可选 `subType`；首页与收藏页选中态限定业务场景；`index.vue` / `DiscoveryCard.vue` / `DetailHero.vue` 按 `isFishingRecord(scene, subType)` 分流 |
| 兜底数据 | `apps/mobile/src/data/mock.ts` 钓点与收藏改为 `play + fishing`；`fishing-detail` 保留 `fish` 兼容读并注明原因 |
| 配置服务修复 | `apps/api/src/modules/config/scene-tabs-config.service.ts`：残留 fish 的损坏配置允许用 null token 修复，避免运营保存永远 409；新增 `scene-tabs-config.service.spec.ts` 11 例 |
| 回填脚本 | `apps/api/src/scripts/backfill-scene-play.ts` 覆盖 discoveries / rankings / `City.scenes` / `SystemConfig.scene_tabs`，默认 dry-run、`--apply` 才写、审计含 SQL 哈希 / 影响 id / 恢复 SQL；`apps/api/package.json` 登记两个脚本 |
| 发布流水线 | `.github/workflows/deploy-production.yml` 新增发布前 `mysqldump` 备份与回填 dry-run/apply/幂等校验；YAML 解析通过、两个新 `run` 块 `bash -n` 通过 |
| 契约与文档 | `contracts/openapi.yaml` 已登记；`06-tasks.md`、`verification/traceability-matrix.md`、`release/release-plan.md`、`backend/ddl-assessment.md`、`status.yaml`、`approvals/2026-11-08-production-deploy.md` 同步 |

## 已执行命令与真实结果

| 命令 | 退出码 | 结果 |
|---|---|---|
| `pnpm --filter @chumen/mobile type-check` | 0 | 首次因 `changeScene(next: Scene)` 赋值 `ref<BusinessScene>` 报 TS2322，改为 `BusinessScene` 后 0 诊断 |
| `pnpm --filter @chumen/mobile test` | 0 | 18 文件 / 76 测试通过（含新增两层默认与卡片分流用例） |
| `pnpm --filter @chumen/mobile build` | 0 | H5 + mp-weixin 构建完成；仅既有 Sass deprecation 提示 |
| `pnpm --filter @chumen/api test` | 0 | 27 文件 / 145 测试通过（含新增配置服务 11 例） |
| `pnpm --filter @chumen/api type-check` | 0 | 首次并行执行因 `pretype-check` 的 `prisma generate` 缺 `DATABASE_URL` 退出 1；补哑值后 0 诊断 |
| `pnpm test:contract` | 0 | 首次并行执行因两个 `prisma generate` 并发写坏生成目录退出 1；串行重跑后 `OpenAPI contract passed for 26 operation(s) across 6 contract(s)` |
| `pnpm --filter @chumen/admin type-check && test && build` | 0 | 4 测试通过；`RoutesView` 19.39 kB、`SceneTabsConfigView` 5.06 kB 等产物生成 |
| `pnpm lint` | 0 | 0 error / 45 个既有 warning（未新增 error） |
| `pnpm format:check` | 0 | Format policy passed |
| `git diff --check` | 0 | 无空白 / 冲突标记问题 |
| `node .harness/scripts/validate-harness.mjs` | 0 | Skills 26 / Changes 8 / Warnings 0 / Errors 0 |
| `yaml.parse` + `bash -n` 校验部署步骤 | 0 | YAML 可解析，deploy job 15 步；两个新增 `run` 块 bash 语法通过 |
| 生产基线只读探测（部署前） | 0 | `/v1/health` 200、`/admin/routes` 200、`/v1/config/scene-tabs` 404（确认仍为旧构建） |

两次失败均为本地命令环境 / 并发问题，已按原命令重跑通过，未删除或弱化任何测试。

## 未覆盖范围（`not-run`）

- 真实 MySQL 集成测试、Expand Migration 实执行、生产回填实执行、备份恢复演练（本机无 Docker、无 `DATABASE_URL`、3306 无监听）。
- 后台浏览器 E2E、微信真机 / 体验版 UAT、四组合滚动矩阵、性能压测、可访问性人工检查、安全与供应链评审、Operations / Release / Completion Gate、独立 Reviewer。
- 微信小程序体验版上传与正式发布；本次提交带 `[skip-miniprogram-experience]`，避免未经真机验收自动上传。
- 生产部署流水线实执行、工作流运行 ID、备份文件名、回填审计 JSON 与线上冒烟结果：待流水线执行后补写，不得用本文件代替。

## Gate 状态

`status.yaml` 保持 `implementing`；requirements / design 为 `passed`，implementation 及之后 Gate 全部 `pending`。本地静态 / 单元 / 契约 / 构建通过不代表实现 Gate 完成（TASK-E13/E14/E15/E16/E17/E18 仍开放）。
