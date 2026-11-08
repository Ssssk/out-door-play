# 实现阶段一证据（2026-11-08）

- Change ID：`CHG-SCENE-EXPANSION-001`
- 阶段：需求/设计 Gate 批准后第一批实现（TASK-E01、TASK-E08、TASK-E10 前端部分）
- 基线 SHA：`48308d8050d602837faff0a72c24e09f8d1bfff4`（`git rev-parse HEAD`）
- 说明：本 Change 与 `CHG-HOME-CATEGORY-001` 的全部改动**均未提交**，因此没有本阶段自身的 commit SHA；以上为改动所基于的仓库 HEAD。
- 环境：Darwin arm64 / Node v24.16.0 / pnpm 11.19.0 / 本地工作树
- 记录时间：2026-11-08T08:25:51Z（`date -u`）；各命令未单独记录精确到秒的起止时间
- 执行者：AI 实现者（本地命令，非流水线）

## 本阶段产物

| 产物 | 内容 |
|---|---|
| `approvals/2026-11-08-requirements-design.md` | 需求/设计 Gate 人工批准记录（批准人、时间、裁决结论、未批准事项） |
| `status.yaml` | `draft` → `implementing`；requirements / design → `passed` |
| `gate-decisions.json` | 两个 Gate 写入批准人、时间、理由与存在的证据路径 |
| `source-baseline.json` | `pending` → `verified`，保留 SRC-E01/E02 无哈希的限制 |
| `apps/admin/src/types/admin.ts` | `BusinessScene`（drive/play/wash）、`Scene`（含兼容 fish）、`PlayType`、`RouteItem.subType`、`SceneTabItem` 3 值 |
| `apps/admin/src/views/RoutesView.vue` | 筛选区改为「全部 / 粗门溜车 / 粗门玩玩 / 粗门洗车」；play 下二级「全部类型 / 钓鱼 / 露营 / 打卡」；3 个新建按钮；表单场景与子类型、`subType` payload、钓点字段按 `play + fishing` 判定；空态与 a11y 属性保留 |
| `apps/admin/src/views/SceneTabsConfigView.vue` | 服务端默认 3 项全启用、`sceneName()` 映射表、恢复默认文案 |
| 需求/设计/验收/前端/验证文档 | 四条冲突裁决口径同步（两层默认、集合放行、白名单 ⊆ enum、方案 A 并入发布） |

## 已执行命令与真实结果

| 命令 | 退出码 | 结果摘要 |
|---|---|---|
| `node .harness/scripts/validate-harness.mjs` | 0 | Skills 26 / Changes 8 / **Warnings 0 / Errors 0** |
| `pnpm --filter @chumen/admin type-check` | 0 | `vue-tsc --noEmit` 无诊断 |
| `pnpm --filter @chumen/admin test` | 0 | 2 个测试文件、**4 个单测通过**（auth、api client） |
| `pnpm --filter @chumen/admin build` | 0 | `RoutesView` 19.39 kB、`SceneTabsConfigView` 5.06 kB 等产物生成；仅有既存的 chunk >500 kB 非阻塞提示 |
| `git diff --check` | 0 | 无空白/冲突标记问题 |
| 追踪覆盖检查（内联 node 脚本） | 0 | 19 条 FR/NFR（含上游 `FR-CFG-006`）+ 16 条 AC，矩阵缺失 0 |

未运行 `prisma generate` / Migration / 数据回填；未连接任何数据库；未输出任何真实凭证。

## 覆盖范围与未覆盖范围

- 本阶段**只完成后台前端与管理端类型**，对应 `FR-EXP-004`、`FR-EXP-005`、`FR-EXP-009` 的界面部分；`AC-EXP-001`、`AC-EXP-002`、`AC-EXP-004`、`AC-EXP-011` 尚未验证通过（后台 E2E 与目标端人工为 `not-run`）。
- 服务运行时的 `scene=play` / `subType` 参数目前仍未被后端 DTO 接受；新建玩玩/洗车记录与二级筛选需等 TASK-E04 ~ E07 完成后联调，当前**不得据此宣称功能可用**。
- `not-run`：Prisma schema 与 Expand Migration、幂等回填脚本与 dry-run、`common/scenes.ts`、后端 DTO/服务/Repository、小程序类型与两层默认、契约登记、单元/集成/契约/E2E/性能/可访问性/UAT、四组合滚动矩阵、备份恢复演练、生产回填、发布、独立 Reviewer。
- 生产 ENUM 变更、数据回填与发布均需针对目标、环境、动作的明确授权；本批准记录不覆盖。

## 下一步

按 `06-tasks.md` 继续 TASK-E02（DDL 评估）→ TASK-E03（回填脚本）→ TASK-E04（`common/scenes.ts` + Expand Migration）→ TASK-E05/E06/E07（服务与 DTO）→ TASK-E09（小程序两层默认）→ TASK-E11/E12（日志与契约登记）→ TASK-E13/E14（测试与演练）。每批实现后补跑检查并追加证据。
