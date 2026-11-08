# 实施任务

> **当前状态**：需求 Gate 与设计 Gate 已于 2026-11-08 由用户书面批准（`approvals/2026-11-08-requirements-design.md`），`status.yaml` 进入 `implementing`。代码、本地静态/单元/契约/构建检查完成，证据见 `evidence/2026-11-08-implementation-phase2.md`。Q-E04 的备份点已由发布工作流前置步骤覆盖，但恢复演练、目标端 UAT、独立 Reviewer 仍未执行；实现及之后 Gate 保持 `pending`。用户于 2026-11-08 给出正式环境部署指令，见 `approvals/2026-11-08-production-deploy.md`。

- [x] TASK-E01 `[FR-EXP-001][AC-EXP-001]` 2026-11-08 完成：四条冲突逐条裁决、Q-E01 ~ Q-E03 书面确认、需求/设计 Gate 批准、`source-baseline.json` 标为 `verified`；Q-E04 仍留发布 Gate 前关闭
- [ ] TASK-E02 `[NFR-MIG-001][AC-EXP-015]` **静态评估已交付**（`backend/ddl-assessment.md`）；本机无 Docker / `DATABASE_URL`，容器化 MySQL 同版本演练、行数、锁等待、复制延迟、P95 实测仍 `not-run`
- [x] TASK-E03 `[FR-EXP-003][AC-EXP-005][AC-EXP-006]` 回填脚本完成：`apps/api/src/scripts/backfill-scene-play.ts` 覆盖 discoveries / rankings / `City.scenes` / `SystemConfig.scene_tabs`，默认 dry-run、`--apply` 才写、审计 JSON 含批次/SQL 哈希/影响 id/恢复 SQL；seed 与 mock 已同步。生产实执行与恢复演练属 TASK-E15
- [x] TASK-E04 `[FR-EXP-001][FR-EXP-002][AC-EXP-012]` `apps/api/src/common/scenes.ts` 白名单与归一化、Expand Migration SQL 已落盘；Migration 生产执行 `not-run`
- [x] TASK-E05 `[FR-EXP-007][FR-EXP-008][AC-EXP-007][AC-EXP-008]` `RoutesService` / `UserService` / `PrismaDiscoveryRepository` / 端口适配完成，详情按 scene 集合放行；真实 MySQL 集成测试 `not-run`
- [x] TASK-E06 `[FR-EXP-001][FR-EXP-002][AC-EXP-003]` 后端 DTO 白名单与组合校验完成，`SCENE_SUBTYPE_INVALID` 已接入
- [x] TASK-E07 `[FR-EXP-009][FR-EXP-010][AC-EXP-011][AC-EXP-012]` `SceneTabsConfigService`（3 项默认、残留 fish 兜底与可修复）、`AdminService`、城市/榜单、seed、mock 全部适配
- [x] TASK-E08 `[FR-EXP-004][FR-EXP-005][AC-EXP-002][AC-EXP-004]` 后台 `RoutesView.vue` 3 tab + 二级筛选 + 3 个新建按钮 + 表单场景/子类型 + 空态完成并通过 `type-check` / `build`；后台浏览器 E2E `not-run`
- [x] TASK-E09 `[FR-EXP-006][FR-EXP-008][AC-EXP-001][AC-EXP-007]` 小程序类型、`common/scenes.ts`、两层默认、`useDiscovery`、首页/收藏页分流、`fishing-detail` 兼容、mock 与 76 个单测完成
- [x] TASK-E10 `[FR-EXP-009][AC-EXP-011]` 后台 `SceneTabsConfigView.vue` 默认 3 项、映射表与恢复默认文案完成；服务端 3 项默认单测通过
- [ ] TASK-E11 `[FR-EXP-011][NFR-OBS-001][AC-EXP-016]` 配置拒绝/冲突/修复/隐藏拒绝事件与回填审计已具备；非法子类型日志、脱敏断言测试仍 `not-run`
- [x] TASK-E12 `[AC-EXP-013]` `contracts/openapi.yaml` 已登记；`pnpm test:contract` 输出 `OpenAPI contract passed for 26 operation(s) across 6 contract(s)`
- [ ] TASK-E13 `[AC-EXP-003]` 至 `[AC-EXP-016]` 本地单元（API 145 / mobile 76 / admin 4）、组件、静态与契约已执行；集成（真实 MySQL）、E2E、性能、可访问性、UAT `not-run`
- [ ] TASK-E14 `[NFR-COMPAT-001][AC-EXP-014]` 四组合滚动兼容矩阵、恢复演练与微信真机验证 `not-run`
- [ ] TASK-E15 `[FR-EXP-003][NFR-MIG-001]` 已获得正式环境部署指令并在 `.github/workflows/deploy-production.yml` 接入「发布前备份 → Expand Migration → dry-run → apply → 幂等校验」；实执行结果待发布流水线证据
- [ ] TASK-E16 `[DEC-E12]` API + 后台发布待流水线执行；小程序体验版上传、UAT、微信审核与正式发布 `not-run`
- [ ] TASK-E17 `[07-knowledge.md]` `knowledge-retrieval` 复核、迁移经验沉淀与 Wiki 同步待 Change 完成后执行
- [ ] TASK-E18 `[completion.md]` 独立 Reviewer 评审、Gate 一致性检查与完成报告 `not-run`

## 依赖顺序

```text
TASK-E01（人工 Gate）
  → TASK-E02（DDL 评估）→ TASK-E03（回填脚本）→ TASK-E04（常量 + Expand Migration）
  → TASK-E05/E06（服务与 DTO）→ TASK-E07（配置与数据口径）
  → TASK-E08（后台）与 TASK-E09/E10（小程序）可并行
  → TASK-E11/E12（日志与契约登记）
  → TASK-E13/E14（测试与演练）
  → TASK-E15（生产回填，需授权）→ TASK-E16（发布）→ TASK-E17/E18（沉淀与完成）
```

## 暂停/回退条件

- 需求/设计 Gate 批准被撤回、或发现需要改变已裁决口径 → 停止受影响实现，升级给产品 Owner 与架构 Owner。
- 生产回填无明确授权、无备份点、无恢复演练结论 → TASK-E15 与发布 Gate 保持 `pending`。
- dry-run 行数与预期不符、备份不可恢复、旧包出现 422 → 停止回填并升级给发布负责人。
- 发现需要移除 `fish` enum 值或新增第三层 UI → 停止受影响任务，升级给架构 Owner。
- 工作区出现与本 Change 重叠且来源不明修改 → 停止写入并请求裁决。

## Owner 与 Gate 交接

| TASK | 执行人 | 验证人 | 对应 Gate |
|---|---|---|---|
| TASK-E01 | 产品 Owner + 架构 Owner | 独立 Reviewer | requirements / design |
| TASK-E02/E03 | 数据库 Owner + 后端实现者 | 架构 Owner | design → implementation |
| TASK-E04 ~ E12 | 后端/前端实现者 | 独立 Reviewer | implementation |
| TASK-E13/E14 | 测试执行者 | 产品 Owner | verification / uat |
| TASK-E15 | 数据库 Owner（需明确授权） | 发布负责人 | release / operations |
| TASK-E16 | 发布负责人 | 产品 Owner | release |
| TASK-E17/E18 | 架构 Owner | 独立 Reviewer | completion |

执行人与最终独立 Reviewer 不得为同一人（`AGENTS.md` §6 红线 12）。
