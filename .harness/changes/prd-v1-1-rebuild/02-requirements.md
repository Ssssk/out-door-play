# 需求规格

## 用户与场景

- 移动端用户：发现自驾路线、钓点和附近加油信息，查看详情、收藏和维护个人资料。
- 运营人员：管理路线、榜单、城市、油价/站点、用户、UGC、分析和报表。
- 开发/测试/发布人员：从 PRD 到代码、测试、UAT 和发布证据全链路可追踪。
- 本 Change 是“重建程序基线”，不直接交付全部产品功能；产品能力将在后续垂直 Change 中实现。

## 功能需求

### FR-PROGRAM-001 接入并执行 Harness

- 描述：将 Harness 作为仓库级工程契约，所有后续业务变更使用 Change、Gate、Skill、Wiki、Knowledge 和 Evidence。
- 来源 ID/锚点：SRC-USER-001 / “使用这套 Harness 重新开发”。
- 业务规则：不以聊天历史、README 或源 PRD 的 READY 替代 Harness Gate。
- 权限：AI 只能准备评审材料，不能代替产品、架构、安全、UAT 或发布批准。
- 失败行为：接入校验失败或技术基线冲突时保持 clarifying/template，不伪报 active。

### FR-SOURCE-001 建立唯一需求来源基线

- 描述：固定 v1.1.0 spec、requirements、原型工作台和哈希，识别并裁决页面注册、版本、镜像和 AC 冲突。
- 来源 ID/锚点：SRC-PRD-001 / `VERSIONING.md`、`v1.1.0/project-spec.json`、`requirements/`。
- 业务规则：`example.md` 与 `web-example.md` 默认视为模板候选，不自动进入产品范围。
- 权限：产品 Owner 裁决范围和业务语义；测试 Owner批准 AC 重编号映射。
- 失败行为：冲突未关闭时 verification_status 保持 pending，Requirements Gate 不得通过。

### FR-ASIS-001 保护并审计旧项目资产

- 描述：识别现有移动端、API、管理端、数据库迁移和测试覆盖，不删除或覆盖未提交实现。
- 来源 ID/锚点：SRC-CODE-001 / apps、package/lock、Prisma schema 与修改前验证。
- 业务规则：现有实现按“可复用、需修复、需替换、待确认”分类；不默认推倒重写。
- 失败行为：无可恢复基线或出现重叠未知修改时停止高风险重构。

### FR-ARCH-001 决定目标技术架构

- 描述：明确 Prisma/TypeORM、Redis、RabbitMQ、认证、授权、数据源和部署拓扑。
- 来源 ID/锚点：SRC-USER-001 + SRC-CODE-001。
- 业务规则：Redis/MQ 只能由具体用例和 NFR 驱动；ORM 迁移必须有收益、成本、兼容与回滚证据。
- 权限：架构、安全和运维 Owner 批准。
- 失败行为：决策未完成时不开始跨模块基础设施改造。

### FR-PLAN-001 拆分垂直交付 Change

- 描述：将产品范围拆为可独立设计、测试、UAT 和回滚的业务切片。
- 推荐候选：
  1. CHG-MOBILE-DISCOVERY：首页/钓鱼列表/城市/详情。
  2. CHG-MOBILE-FUEL：油价、站点和地图导航。
  3. CHG-IDENTITY-PROFILE：微信登录、会话、个人资料与收藏。
  4. CHG-ADMIN-FOUNDATION：管理端登录、RBAC、布局与审计。
  5. CHG-ADMIN-CONTENT：路线、榜单、城市、油价和 UGC。
  6. CHG-ANALYTICS-REPORTS：埋点、分析与异步报表。
  7. CHG-OPERATIONS：CI、可观测性、备份恢复和发布。
- 业务规则：每个 Change 只包含一个可独立验收的主目标；依赖关系明确。
- 失败行为：无法独立验收/回滚的切片必须继续拆分。

### FR-CI-001 按变更组件执行发布 CI

- 描述：根据提交实际变更路径，仅执行受影响的 API、管理 Web 或微信小程序 CI；多个组件同时变更时按 API → 管理 Web → 小程序的顺序执行。
- 来源 ID/锚点：SRC-USER-002 / 2026-09-06 用户发布需求。
- 业务规则：只改一个组件时其他组件 Job 必须跳过；前置组件失败时不得继续后置组件；共享依赖、Compose 或工作流编排变化按全组件处理。
- 权限：CI 只执行构建、测试和已批准的小程序体验版上传；生产服务器部署仍由独立的手动发布工作流和发布 Gate 控制。
- 失败行为：组件识别失败、前置 Job 失败或必要配置缺失时，流水线失败并阻断后续组件。

## 非功能需求

### NFR-QUALITY-001 真实质量门禁

- `pnpm type-check`、`pnpm test`、H5/微信构建以及后续 lint、契约、集成、E2E、安全命令必须真实执行并返回可靠退出码。
- 修改前已知：admin type-check failed；admin test 为零测试。修复前不能宣称实现 Gate 通过。

### NFR-TRACE-001 全链路追踪

- 每条正式产品 FR/AC 映射到来源、设计、TASK、Test 和 Evidence。
- 重复的源 AC ID 在 Harness 中使用全局唯一 ID，并保留 source anchor。

### NFR-SEC-001 安全基线

- 客户端不可信；管理和用户写接口在发布前必须有服务端认证、资源授权、输入校验、限流和审计。
- Secret、私钥和本地环境值不得提交或写入 Evidence。

### NFR-COMPAT-001 目标端证据

- 建议首批 H5 + 微信小程序；最终矩阵由产品/发布 Owner 确认。
- H5 构建或模拟器不能替代微信小程序目标端验收。

### NFR-OPS-001 可运行与可恢复

- 后续发布 Change 必须定义 SLO、容量、告警、备份恢复、RTO/RPO、灰度和回滚。
- 当前本地 Docker MySQL 不构成生产运维就绪证据。

### NFR-PERF-001 性能目标待业务切片量化

- PRD 中的 200ms/1s 等页面指标需明确测量起止、设备、网络和数据规模后进入对应垂直 Change。
- 本程序 Change 不替产品 Owner补充未定义阈值。

## 非目标

- 在一个 Change 中实现 20 份需求文档的全部能力。
- 仅为符合模板而强制引入 TypeORM、Redis 或 RabbitMQ。
- 在需求与设计 Gate 前重写现有业务代码。
- 执行生产正式发布或真实数据迁移；小程序体验版上传由受控 CI 工作流执行，不代表审核或线上发布。

## 来源追踪

| FR/NFR | 来源 ID | 来源锚点 | 版本 | Owner确认 |
|---|---|---|---|---|
| FR-PROGRAM-001 | SRC-USER-001 | 当前用户请求 | 2026-08-30 | pending |
| FR-SOURCE-001 | SRC-PRD-001 | VERSIONING + v1.1.0 | v1.1.0 | pending |
| FR-ASIS-001 | SRC-CODE-001 | 旧项目工作树 | HEAD + uncommitted | pending |
| FR-ARCH-001 | SRC-USER-001/SRC-CODE-001 | 使用 Harness + ORM/基础设施现状 | current | pending |
| FR-PLAN-001 | SRC-USER-001 | 重新开发成品 | 2026-08-30 | pending |
| FR-CI-001 | SRC-USER-002 | 组件感知 CI 与 API → 管理 Web → 小程序顺序 | 2026-09-06 | pending |
| NFR-QUALITY-001 | SRC-USER-001 | Harness 工程化 | current | pending |
| NFR-TRACE-001 | SRC-USER-001 | Harness 工程化 | current | pending |
| NFR-SEC-001 | SRC-CODE-001 | 当前接口与 Secret 边界 | current | pending |
| NFR-COMPAT-001 | SRC-PRD-001 | 移动端适用版本/原型 | v1.1.0 | pending |
| NFR-OPS-001 | SRC-USER-001 | 最终完成要求 | current | pending |

## 依赖与假设

- 需要产品 Owner 裁决 v1.1.0 正式页面集合。
- 需要架构 Owner 裁决 ORM 与 Redis/MQ 引入原则。
- 需要仓库 Owner 建立现有未提交代码的可恢复基线。
- 假设旧项目资产允许继续复用；若要求完全重写，需要另行明确非功能原因。

## 未决问题

见 `01-clarification.md` Q-001 至 Q-010。未关闭前不进入 Requirements Gate。

