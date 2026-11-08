# 知识检索与沉淀

## 开始前检索

- 检索时间：2026-11-08
- 检索目标：Change `CHG-SCENE-EXPANSION-001`，阶段为需求/设计文档编写；领域词「业务分类、场景扩展、粗门玩玩、粗门洗车、钓鱼、露营、打卡、子类型」，技术词「Prisma enum Scene、MySQL ENUM、Migration、回填、expand-migrate-contract、Discovery、RoutesView」，症状词「二元假设、分享死链、兼容期、白名单散落」。
- 查询词与范围（真实执行）：
  1. `search_content` 全库检索 `粗门玩玩|粗门洗车|玩玩|洗车` → 0 命中。
  2. `search_content` 在 `apps/admin/src/views/RoutesView.vue` 检索 `全部|溜车|钓鱼|sceneFilter` → 8 命中，确认 tab 硬编码与表单二元假设。
  3. `search_content` 全库检索 `enum Scene|type Scene|'drive' \| 'fish'|drive.*fish` → 25 个文件命中，确认白名单分布。
  4. `search_content` 在 `apps/api/src/modules` 检索 `operationId:` → 21 命中，用于契约文档填写真实 operationId。
  5. `code-explorer` 只读子任务（very thorough，58 次工具调用）：核对 Prisma schema / 14 个 migration / seed / 后端服务与 DTO / 小程序类型与详情页 / 后台表单 / 既有 Change DEC 原文 / 模板与 manifest / 全库「露营|打卡|洗车|玩玩|play|wash|subType」检索 / 命名规律。
  6. 只读 `git status --short` 由主代理执行，确认 `RoutesView.vue` 未被上一 Change 改动。
- 命中的知识 ID：`ADR-006`、`KB-INC-001`、`KB-INBOX-006`、`KB-INBOX-008`、`KB-INBOX-007`（沿用上一 Change 的检索结论）。

## 适用性判断与采用结论

| 知识 ID | 状态 | 适用性 | 采用/不采用理由 |
|---|---|---|---|
| `ADR-006` 保留 Prisma 并按用例引入 Redis/RabbitMQ | verified | 直接适用 | **采用**：本 Change 使用 Prisma Migration，不引入 Redis/RabbitMQ；`contracts/events.yaml` 为空 |
| `KB-INC-001` 运行时依赖缺失导致生产不可用 | verified | 需验证后适用 | **采用为约束**：不新增第三方依赖，实现期必须执行真实构建与契约测试 |
| `KB-INBOX-006` 客户端伪安全与兼容性误判 | draft | 仅风险提示 | **不作为正式依据**：服务端强制过滤的结论来自当前代码与 `AGENTS.md` §8，而非 draft 记录 |
| `KB-INBOX-008` OpenAPI 契约指纹 | draft | 仅风险提示 | **不作为正式依据**：`contractPaths` 硬编码事实已由 `verify-openapi-contract.ts` 直接核对，形成 DEC-E11 |
| `KB-INBOX-007` NestJS 一致性与异步边界 | draft | 仅设计输入 | **不作为正式依据**：本 Change 不引入异步与缓存；回填为同步批处理 |
| `AGENTS.md` §9 / §13 | 仓库契约（最高优先级） | 直接适用 | **采用**：expand-migrate-contract、生产写入需明确授权、备份与可恢复方案 |

`draft` 记录未被当作 Rules 或发布依据；所有采用结论均回查当前代码与仓库契约。

## 过程中发现

- **Wiki 过期事实**（沿用上一 Change 的结论）：`.harness/wiki/05-接口协议.md` 未列 `/config/*`、`00-技术基线.md` 称契约测试未建立、`03-后端架构.md` 未反映公开运营配置、`09-认证与权限模型.md` 自述无 Guard；实现完成后由 TASK-E17 同步。
- **关键事实**：`favorites` 表无 scene 列，通过 `discovery.scene` 关联，因此回填不需要改写收藏行 —— 这是降低 P1 风险的重要依据。
- **关键阻塞**：`routes.service.ts:27-33` 与 `prisma-discovery.repository.ts:90-99` 把详情端点与单一 scene 硬绑定，是分享链接能否保留的技术关键点，已形成 DEC-E04 与 `FR-EXP-008`。
- **白名单分散**：25+ 文件含二元假设，若逐处改极易漏改，故设计上新增 `common/scenes.ts` 收敛为单一事实来源。
- 强制沉淀条件：当前**不满足**（Change 未完成、无事故、非重复问题）；但生产 ENUM 回填属于高风险动作，完成时须按 `knowledge-capture` 判断是否沉淀 Runbook。

## 完成时沉淀

- 新增/更新知识 ID：`pending`
- 候选主题：MySQL ENUM 扩展的 expand-migrate-contract 演练、旧客户端兼容映射、内容分类重构时分享链接保护。
- 知识状态与验证证据：`not-run`；只有真实演练与目标端证据齐备后才允许标记 `verified`。
- Wiki 同步项：`/config/*` 资源清单、`SystemConfig` 说明、config 模块职责、认证与权限模型现状，以及 3 类 Scene 与 PlayType 数据口径。

## 已读取的执行规程

本阶段完整读取 `AGENTS.md`、`.harness/manifest.yaml`、`rules/00-治理与优先级.md`，并复用上一 Change 已读取的 `requirement-baseline`、`requirements-contract`、`solution-design`、`api-contract-design`、`knowledge-retrieval`。实现阶段还需补读 `backend-implementation`、`frontend-implementation`、`ci-quality-gate`、`product-uat`、`change-completion` 及数据库迁移相关规程。
