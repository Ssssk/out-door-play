# CHG-SCENE-EXPANSION-001 scene-expansion-three-tabs：原始请求

## 来源

- 提出人：项目 Owner（用户，会话中提出）
- 日期：2026-11-08
- 关联工单/链接：无外部工单；来源为本会话文字与后台「路线列表」截图
- `source-baseline.json` 来源 ID：`SRC-E01`（用户对本 Change 范围与钓鱼归类的裁决）、`SRC-E02`（后台路线列表截图）、`SRC-E03`（`CHG-HOME-CATEGORY-001` 已批准决策 DEC-004 / DEC-010）、`SRC-E04`（2026-11-08 当前工作树代码事实）
- 原始版本/哈希：截图为会话内嵌图片，未落盘，`sha256: null`、`version: unversioned`；代码事实以当前工作树为准（含上一 Change 尚未提交的实现）

## 业务目标

把「场景」从两分类 `drive` / `fish` 扩展为三个品牌化业务分类：

| 顶层业务分类 | scene 标识 | 说明 |
|---|---|---|
| 粗门溜车 | `drive` | 沿用现有溜车路线 |
| 粗门玩玩 | `play` | **新增**；包含子类型：钓鱼、露营、打卡 |
| 粗门洗车 | `wash` | **新增** |

原有「钓鱼」不再作为顶层场景，而是并入「粗门玩玩」下的子类型「钓鱼」（用户原话：「并入到粗门玩玩里边的类型，粗门玩玩就包括：钓鱼、露营、打卡」）。

受影响用户：

- 运营：后台「路线列表」按 3 个 tab 筛选与管理，可为「粗门玩玩」选择子类型；首页分类目录也可配置 3 个分类。
- C 端用户：小程序首页出现 3 个分类；已分享的钓鱼详情链接仍可打开。
- 研发/测试：需要 Prisma Migration、数据回填、25+ 文件的白名单与二元分支改造、契约与回归。

预期业务结果：路线与内容可按三条业务线运营；「粗门玩玩」承载钓鱼/露营/打卡三类内容；钓鱼历史数据与分享链接不丢失。

## 用户裁决（2026-11-08）

用户通过结构化问答明确选择：

1. 实现口径 = **新增业务场景**：「正式扩展 Scene 枚举（如 play / wash），独立 Change + Prisma Migration + 后端/小程序全链路 + 契约与测试，重新走需求/设计 Gate。能让这 3 类真正可新建、可筛选、可在小程序展示。」
2. 钓鱼处理 = **并入粗门玩玩的子类型**：钓鱼、露营、打卡。

用户接受该口径包含「重新走需求/设计 Gate」，因此本 Change 的需求 Gate 与设计 Gate 均为 `pending`，**Gate 批准前不得开始跨模块编码或执行任何 Migration**。

## 当前现状与证据

| 现状 | 证据（仓库相对路径） |
|---|---|
| `Scene` 是 MySQL ENUM，只有 drive/fish | `apps/api/prisma/schema.prisma:10-13`；`apps/api/prisma/migrations/20260827163125_init/migration.sql:15` |
| 两张表持有该 ENUM：`discoveries.scene`、`rankings.scene` | `schema.prisma:98`、`:265`；`migrations/20260827164335_admin_console/migration.sql:24` |
| `Discovery` 无子类型字段，钓点专属字段是 `entryPoint/mainArea/gear/shoreKm/depthM` | `schema.prisma:95-144` |
| 后台路线列表 tab 硬编码 `[全部, 溜车, 钓鱼]`；新建按钮与表单下拉也只有 drive/fish | `apps/admin/src/views/RoutesView.vue:254-261`、`:321` |
| 详情端点与 scene 二元硬绑定：`route(id)→drive`、`spot(id)→fish` | `apps/api/src/modules/routes/routes.service.ts:27-33`；`prisma-discovery.repository.ts:90-99` |
| 小程序只有两个详情页，首页/收藏页按 `scene === 'fish'` 二元分流 | `apps/mobile/src/pages.json:11,13`；`pages/index/index.vue:63-66`；`pages/favorites/index.vue:65-66` |
| `fishing-detail` 分享参数为 `?spotId=`，本地兜底为 3 条钓点 | `apps/mobile/src/pages/fishing-detail/index.vue:48-53,69`；`apps/mobile/src/data/mock.ts:58-81` |
| seed 有 30 条路线（fish 3 条）、2 条 fish ranking、4 个城市的 `scenes` 含 fish | `apps/api/src/data/seed.ts:33-66`；`apps/api/prisma/seed.ts:69-75,144-151` |
| 「露营 / 打卡 / 洗车 / 玩玩 / play / wash / subType」在业务代码中 0 命中 | 全库检索，仅 `mapNavigation.spec.ts:5` 有无关地名「黄陂露营地」 |
| 首页分类配置刚实现但白名单为 drive/fish、默认仅 drive 启用 | `apps/api/src/modules/config/scene-tabs-config.service.ts:4,31,34-41`；`CHG-HOME-CATEGORY-001` DEC-004 / DEC-010 |
| 该 Change 处于 `implementing`，代码已落地但未提交、未发布 | `.harness/changes/home-category-visibility/status.yaml` |

## 初始范围

- 包含：
  - Prisma Migration：`enum Scene` 扩展、`Discovery.subType` 新增列与索引、`rankings` 同步。
  - 可预览、幂等、可回滚的数据回填：原 `scene=fish` 记录迁到 `scene=play` + `subType=fishing`；`Ranking`、`City.scenes` JSON、`SystemConfig.scene_tabs`、seed 数据同步。
  - 后台「路线列表」3 个 tab（粗门溜车/粗门玩玩/粗门洗车）+「粗门玩玩」二级子类型筛选；新建/编辑表单支持顶层场景与子类型。
  - 小程序首页分类目录 3 个 tab（复用 `scene_tabs` 配置）、卡片子类型标签、列表/收藏/详情/分享按新分类。
  - 后端白名单、DTO、服务投影、`GET /v1/spots/:id` 兼容改造、契约与测试。
- 不包含：
  - 移除 `fish` enum 值（contract 阶段另开 Change，保证新旧应用滚动共存）。
  - 「粗门洗车」的独立详情页、门店/预约/支付能力（一期复用通用路线详情）。
  - 子类型的独立配置后台（一期为固定枚举：钓鱼/露营/打卡）。
  - 底部 `tabBar` 改造、`City.scenes` 城市级分类生效、配置审批流。
  - 引入 Redis / RabbitMQ / 新表（除 `Discovery.subType` 列外）。
  - 删除任何钓鱼历史数据、收藏数据或分享链接。

## 约束与风险

- 目标平台：微信小程序（主目标端，需体验版/真机证据）、uni-app H5 回归、运营管理后台 Web。
- 数据约束：`ENUM` 变更与回填属于生产数据写入，执行前必须针对目标、环境与动作获得明确授权；必须有备份、dry-run 预览、幂等校验与恢复方案。
- 兼容约束：旧小程序包只认 drive/fish；发布期必须保证「旧包 + 新服」不崩、已分享的 `fishing-detail?spotId=` 链接可打开。
- 发布约束：小程序端改动必须重新构建上传、审核、正式发布；服务器部署不改变手机端代码包。
- 流程约束：与 `CHG-HOME-CATEGORY-001` 已批准的 DEC-004 / DEC-010 冲突，按 `AGENTS.md` §14 记录并请求产品/架构 Owner 裁决；本 Change 独立走 Gate，AI 不代批。
- 主要风险：P1 生产 ENUM 变更不可逆；P1 分享链接失效；P1 白名单分散在 25+ 文件漏改；P2 新增分类无数据导致空 tab；P2 旧包与新服滚动期 422。

## 成功信号

- 后台「路线列表」显示「全部 / 粗门溜车 / 粗门玩玩 / 粗门洗车」，选中「粗门玩玩」可按钓鱼/露营/打卡筛选，并可新建这三类路线。
- 原 3 条钓鱼数据出现在「粗门玩玩 → 钓鱼」下，收藏与分享链接仍可打开。
- 小程序首页显示 3 个分类，运营可在后台调整显隐/名称/排序而无需发版。
- 「新包 + 新服」「旧包 + 新服」滚动期无 422 / 白屏 / 详情死链。
- `node .harness/scripts/validate-harness.mjs` 与 `pnpm test:contract` 通过，且契约登记进 `contractPaths`。

## Change 分类与强度

- 类型：`feature`（含数据库 Migration）
- 风险：`high`（生产 schema 变更 + 数据回填 + 全链路行为变化）
- 需要 UAT、性能、安全供应链、Operations Gate：**全部需要**；发布 Gate 需发布负责人批准，数据回填需针对生产环境的明确授权。
