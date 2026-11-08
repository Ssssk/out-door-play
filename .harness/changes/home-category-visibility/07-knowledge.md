# 知识检索与沉淀

## 开始前检索

- 检索时间：2026-11-08
- 检索目标：Change `CHG-HOME-CATEGORY-001`，阶段为需求/设计文档编写；领域词「首页分类、场景、配置、显隐、系统配置」，技术词「SceneTabs、SystemConfig、config:read、OpenAPI、contractPaths、Prisma、uni-app、NestJS」，症状词「伪安全、缓存不一致、契约漏检、误导文案、滚动兼容」。
- 查询词与范围：
  1. `git status --short`（工作区状态，确认只有本 Change 目录为新增未跟踪文件，无重叠用户修改）。
  2. 尝试 `rg -i "scene_tabs|scene-tabs|首页分类|分类目录|SceneTabs|City.scenes|场景开关|config:read|SystemConfig|contractPaths|首页 tab" .harness/knowledge .harness/wiki .harness/changes` → **执行失败**：当前 shell `command not found: rg`（已如实记录，不写成成功）。
  3. 改用 IDE 内置的 ripgrep 等价检索（`search_content`）：同一模式在 `.harness` 下 `*.md` 范围 → 1 处命中（`.harness/skills/knowledge-capture/SKILL.md`，与本需求无实质关联）。
  4. `search_content` 在 `.harness/knowledge` 下用 `场景|分类|配置|缓存|契约|兼容性|OpenAPI|config` → 17 个文件命中（索引、README、solutions、incidents、decisions、inbox）。
  5. 读取 `.harness/knowledge/index.yaml` 与相关条目状态；并通过只读代码调研核对 `.harness/wiki/`、`.harness/changes/` 与 `apps/` 当前事实。
- 命中的知识 ID：`ADR-006`、`KB-SOL-001`、`KB-SOL-002`、`KB-INC-001`、`KB-INC-002`、`KB-INBOX-002`、`KB-INBOX-006`、`KB-INBOX-007`、`KB-INBOX-008`、`KB-INBOX-010`、`KB-INBOX-011`。

## 适用性判断与采用结论

| 知识 ID | 状态 | 适用性 | 采用/不采用理由 |
|---|---|---|---|
| `ADR-006` 保留 Prisma 并按用例引入 Redis/RabbitMQ | verified（2026-08-30） | 直接适用 | **采用**：DEC-005 复用既有 `SystemConfig` 表、DEC-008 明确不引入 Redis/RabbitMQ/进程内跨进程缓存；本需求不构成「已批准的真实用例」 |
| `KB-INC-001` API 运行时依赖缺失导致生产不可用 | verified（2026-09-22） | 需验证后适用 | **采用为约束**：本 Change 不新增第三方依赖，TASK-011 必须执行真实构建与契约测试，不能只做静态检查 |
| `KB-SOL-002` HTTP 测试环境管理端 Secure Cookie 登录回跳 | verified（2026-09-06） | 需验证后适用 | **采用为测试环境注意项**：后台 E2E 在 HTTP 测试环境需按该记录配置 `ADMIN_COOKIE_SECURE`，否则权限用例会被登录回跳干扰；不作为设计依据 |
| `KB-INC-002` GitHub Environment Secret 未注入导致微信登录不可用 | draft | 仅供参考 | **不采用**：与分类配置无因果关系；仅在小程序体验版上传时提醒检查工作流变量 |
| `KB-INBOX-006` 客户端伪安全与兼容性误判 | draft | 仅提供风险提示 | **不作为正式依据**：其结论提示「只隐藏客户端不构成拒绝」，已由当前 Wiki `09-认证与权限模型.md:21` 与代码 Guard 独立支撑，设计采用服务端过滤（`FR-CFG-003`） |
| `KB-INBOX-008` OpenAPI 生成链路与契约指纹 | draft | 仅提供风险提示 | **不作为正式依据**：`contractPaths` 硬编码事实已由 `apps/api/src/scripts/verify-openapi-contract.ts:15-20` 直接核对，形成 DEC-011 与 `AC-CFG-017` |
| `KB-INBOX-007` NestJS 一致性与异步边界 | draft | 仅提供设计输入 | **不作为正式依据**：不引入异步与缓存；服务端单行主键直读的结论来自当前代码与 ADR-006 |
| `KB-INBOX-002` 多端宿主能力适配与证据矩阵 | draft | 仅提供测试设计输入 | **不作为正式依据**：目标端矩阵在 `frontend/page-flow.md` 按本项目实际页面重新编写 |
| `KB-SOL-001` Prisma-MySQL RSA 握手 | verified（2026-08-30） | 明确不适用 | **不采用**：本 Change 不改动数据库连接配置；仅在集成测试环境异常时按需回查 |
| `KB-INBOX-010` / `KB-INBOX-011` | draft | 仅供参考 | **不采用**：与本 Change 的日志基数、自动化控制无直接决策依赖 |

按 `knowledge-retrieval` 技能要求，`draft` 记录未被当作 Rules 或发布依据；所有被采用的结论均回查了当前代码与 Wiki。

## 过程中发现

- **Wiki 与当前代码存在过期事实**（不构成本 Change 的阻塞，但需在 TASK-014 同步）：
  - `.harness/wiki/05-接口协议.md` 资源清单未列 `/config/*`，但 `GET /v1/config/qrcodes` 已存在。
  - `.harness/wiki/00-技术基线.md` 称「正式 OpenAPI 差异与契约测试尚未建立」，但 `verify-openapi-contract.ts` 与 `pnpm test:contract` 已存在。
  - `.harness/wiki/03-后端架构.md` 把 config 模块描述为「配置校验和 typed configuration」，未反映公开运营配置接口。
  - `.harness/wiki/09-认证与权限模型.md` 自述「当前未发现 Guard/JWT/Session」，与 `admin-auth.guard.ts` 不符；但其 `:21`「服务端必须重新授权」仍是有效约束。
- 本 Change 的 `00-request.md` / `04-impact-analysis.md` / `05-design.md` 均以代码事实为准，未引用上述过期条目作为当前事实。
- `City.scenes` 是「写了但没生效」的字段，后台文案误导 —— 这是本需求最容易踩的复用陷阱，已形成 DEC-003 与 `FR-CFG-010`。
- 是否满足强制沉淀条件：当前**不满足**（Change 未完成、无线上事故、非同类问题第二次发生、排障未超过 30 分钟）。

## 完成时沉淀

- 新增/更新知识 ID：`pending`（Change 完成时按 `knowledge-capture` 判断；候选主题为「配置类需求的读取兜底 + 服务端强制过滤 + 契约登记」）
- 知识状态与验证证据：`not-run`；只有实现期真实测试与目标端证据齐备后才允许标记 `verified`
- Wiki 同步项（TASK-014，仅写已生效事实）：`/config/*` 资源清单、`SystemConfig` 运营配置说明、config 模块职责、认证与权限模型现状
- 无需沉淀时的理由：若实现未产生经真实证据支持的新模式，则在 `completion.md` 记录「无新增知识，原因：全部结论已由现有代码与 ADR-006 覆盖」

## 已读取的执行规程

按 `AGENTS.md` 启动协议，本次文档编写完整读取了以下 Skill：`requirement-baseline`、`requirements-contract`、`solution-design`、`api-contract-design`、`knowledge-retrieval`；并加载了 `rules/00-治理与优先级.md` 与 `.harness/manifest.yaml`。实现阶段还需按任务类型补读 `frontend-implementation`、`backend-implementation`、`api-contract-design`、`ci-quality-gate`、`product-uat`、`change-completion` 等对应规程。
