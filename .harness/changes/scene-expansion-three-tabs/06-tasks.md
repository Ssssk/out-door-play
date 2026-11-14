# 实施任务

> **当前状态**：需求 Gate 与设计 Gate 已于 2026-11-08 由用户书面批准（`approvals/2026-11-08-requirements-design.md`），`status.yaml` 进入 `implementing`。代码、本地静态/单元/契约/构建检查完成，证据见 `evidence/2026-11-08-implementation-phase2.md`；正式环境（API + 后台）已按用户指令发布成功，证据见 `evidence/2026-11-08-production-deploy.md`。恢复演练、微信端 UAT、浏览器 E2E、独立 Reviewer 与既有安全门禁失败仍未关闭；实现及之后 Gate 保持 `pending`。部署授权见 `approvals/2026-11-08-production-deploy.md`。

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
- [x] TASK-E15 `[FR-EXP-003][NFR-MIG-001]` 正式部署流水线 run `42483370291` 实执行成功：发布前备份 `success`、Expand Migration `success`、回填 dry-run/apply/幂等校验 `success`；线上 `play+fishing` 数据可见、`fish` 读兼容保持。恢复演练仍 `not-run`
- [ ] TASK-E16 `[DEC-E12]` **API + 后台已于 2026-11-08 发布到 `https://www.chumenliuliu.cloud/admin/routes`**；小程序体验版上传、真机 UAT、微信审核与正式发布 `not-run`
- [ ] TASK-E17 `[07-knowledge.md]` `knowledge-retrieval` 复核、迁移经验沉淀与 Wiki 同步待 Change 完成后执行
- [ ] TASK-E18 `[completion.md]` 独立 Reviewer 评审、Gate 一致性检查与完成报告 `not-run`
- [x] TASK-E19 `[FR-EXP-013][AC-EXP-017]` 2026-11-12 完成：露营（`play`+`camping`）目的地型字段口径——后台 `RoutesView.vue` 仅保留终点与终点坐标、新增 `routeFormPolicy.ts` 字段策略、DTO `difficulty` 改为可选、`AdminService.createRoute/updateRoute` 对目的地型强制清空占位值、小程序 `DiscoveryCard`/`DetailHero`/`route-detail` 隐藏不适配指标；新增 `routeFormPolicy.test.ts`、`admin.service.destination.spec.ts`、两端 `scenes.spec.ts` 与 `DiscoveryCard.component.spec.ts` 用例；三端 `type-check` 与单测（API 151 / admin 9 / mobile 80）及生产构建（admin / mobile）均通过
- [x] TASK-E20 `[FR-EXP-013][AC-EXP-017]` 2026-11-13 完成：打卡（`play`+`checkin`）与露营同口径——三端 `isDestinationOnlyRecord/isDestinationOnlyForm` 判定扩展到打卡，`RoutesView.vue` 表单/提示与计算属性改名 `isDestinationForm`，服务端 `DESTINATION_ONLY_HIDDEN_FIELDS` 清空逻辑自动覆盖打卡并新增创建用例；小程序 `DiscoveryCard` 打卡隐藏指标用例、判定与 payload 用例同步；三端 `type-check` 与单测（API 152 / admin 10 / mobile 81）全绿
- [x] TASK-E21 `[FR-EXP-013][AC-EXP-017]` 2026-11-13 完成：洗车（`scene=wash`）按目的地型处理——三端判定扩展 `wash`，后台 `RoutesView.vue` 目的地型布局新增「可洗车型」字段，服务端 `createRoute/updateRoute` 对洗车保留 `carType` 与 `bestTime`（营业时间）、仅露营/打卡清空这两项，`DESTINATION_ONLY_HIDDEN_FIELDS` 移除 `carType`/`bestTime`；小程序 `route-detail` 洗车展示「可洗车型」「营业时间」、`DiscoveryCard` 洗车隐藏路线指标用例；三端 `type-check` 与单测（API 154 / admin 11 / mobile 82）全绿
- [x] TASK-E23 `[FR-EXP-014][AC-EXP-018]` 2026-11-14 完成：目的地型卡片三指标（门票/开放时间/建议停留）——`Discovery` 新增可空列 `price_label`（Expand 迁移 `20261114000000_add_price_label`）；后台表单目的地型增加「门票/费用」「开放时间」「建议停留」；服务端 `createRoute/updateRoute` 对目的地型保留 `bestTime`/`durationLabel`/`priceLabel`（不再清空），`user` 收藏副标题目的地型改用「门票 免费 / 全天」；小程序 `DiscoveryCard`/`DetailHero` 三指标位对目的地型展示门票/开放时间/建议停留，详情「地点信息」对露营/打卡展示门票/开放时间/建议停留、洗车展示可洗车型/营业时间；三端 `type-check` 与单测（API 155 / admin 12 / mobile 82）全绿
- [ ] TASK-E22 `[FR-EXP-014]` **pending**：目的地型剩余展示字段（联系电话 `contactPhone`、设施标签 `facilities` JSON）——一次 Expand Migration 加入 `Discovery` 表，三端为 `wash`/`play+camping`/`play+checkin` 增加后台输入与小程序详情展示；用户 2026-11-13 确认放二期，本期不实现
- [x] TASK-E24 `[CHG-RANKING-SCENES]` 2026-11-14 完成：热门榜单配置对齐三场景——后台 `RankingsView.vue` 场景下拉/Tab 由写死「溜车/钓鱼」改为消费 `BUSINESS_SCENES`+`SCENE_LABELS`（drive/play/wash，新增 `apps/admin/src/common/scenes.ts`）；`UpsertRankingDto.scene` 改 `@IsIn(BUSINESS_SCENES)`（禁止 fish 写入）；`AdminService.validateCoverRoutes` 限定业务场景、`play` 允许钓点/露营/打卡混排（去除子类型约束与 fish 分支）；新增迁移 `20261114000001_migrate_fish_rankings_to_play` 将存量 `fish` 榜单迁到 `play`；三端 `type-check` 与单测（API 155 / admin 12）全绿，Admin 构建通过

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
