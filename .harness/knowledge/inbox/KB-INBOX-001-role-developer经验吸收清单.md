---
id: KB-INBOX-001
title: role-developer 3.0 经验 Skill 吸收与分类清单
type: decision
status: draft
scope: [harness-governance, knowledge-assimilation]
stack: [uni-app, vue3, wot-design-uni, nestjs, typeorm, mysql, redis, rabbitmq]
tags: [经验吸收, 来源治理, skill, provenance, draft]
owner: unassigned
last_verified: null
related_changes: []
---

# 吸收目标

将 `E:\code_house\skill2\core-skills\role-developer\3.0` 中的个人经验 Skill 拆分并吸收到 `harness(uniapp+nest)`，同时避免以下问题：

- 把整套 Skill 当作当前项目强制规范。
- 把源包结构校验误认为真实项目技术验证。
- 将 Vue 2、PostgreSQL、PC 管理端、微服务等异构内容混入当前主技术栈。
- 将危险示例、绝对化表述或未经验证的“生产级”主张直接升格。

# 来源基线

读取日期：2026-08-30。来源目录保持只读，本次没有修改或删除原始压缩包。

| 来源包 | SHA-256 | 与当前 Harness 的关系 | 吸收结论 |
|---|---|---|---|
| `admin-dashboard-onepiece-3.0.zip` | `03ff748aa9cbbde622ef302768ba13d51363419238d0b8a1e94323b9032f02b0` | Vue 3 PC 管理端，不是 uni-app 主客户端 | 不激活；服务端授权边界已由现有安全规则覆盖 |
| `apex-orchestrator-pm-tech-director-onepiece-3.0.zip` | `1bc074b2e58bba77248d37119bf23ebb3e729b9f420972052e569096419c8749` | 全流程编排 | 与当前状态机/Gate 大量重复；不复制，仅保留“检查点恢复与独立验收”映射 |
| `database-schema-migration-onepiece-3.0.zip` | `d87498f15e7df5203b255a62eba7db23dd950edae9d455781643c0eebc2dbde5` | 数据迁移高度相关，但示例混有 PostgreSQL 方言 | 程序仍由 `database-migration` Skill 管理；安全经验进入 KB-INBOX-009，错误方言明确拒绝 |
| `fullstack-api-codegen-onepiece-3.0.zip` | `e58f08d42a49de8ade5ffd725c97abf49e7a2bcbcb4f34ed3267e2dff38571b4` | NestJS OpenAPI → uni-app 类型链路相关 | 契约指纹和保护手写代码进入 KB-INBOX-008 |
| `llm-agentic-engineering-onepiece-3.0.zip` | `4fd7b06480ef85e190b297550fff849e7fcf72dd8833da8f144b11632530ac48` | AI/Agent 系统，非当前应用基线 | 不激活；以后建立 AI 专用 Harness 时重新吸收 |
| `microservice-gateway-grpc-onepiece-3.0.zip` | `79b7d3d0f873a8c646bfd227d6ee91de6781c7c4fc12b34b2f231c7a81e21005` | 与当前“默认模块化单体”冲突 | 不激活；出现已批准微服务 Change 时再检索 |
| `multitenancy-saas-architecture-onepiece-3.0.zip` | `76766d318d797409cd2b9bbb90dcd7a8ad545a8de93cce77f6a8d92e29f68e32` | 仅多租户 SaaS 项目适用 | 不激活；租户隔离需求批准后专项吸收 |
| `nestjs-devops-cicd-onepiece-3.0.zip` | `b1b504005379e7772bf7007c0196d8e41f1860945d32baddc53168500762f74e` | 当前后端交付相关 | 与现有 CI/发布 Skill 去重；高影响自动化边界进入 KB-INBOX-011 |
| `nestjs-fullstack-miniprogram-onepiece-3.0.zip` | `cc507f16e5e28441ceafd732307a52865cf589da455f0b538fb588a7b0c3c1cc` | 当前全栈高度相关 | 工作流由现有前后端 Skills 管理；一致性经验进入 KB-INBOX-007 |
| `opentelemetry-observability-onepiece-3.0.zip` | `aa7e0b28eac817592240beb37c5a85f508c653b4b2403944dabbe20df594bf61` | 当前可观测性相关 | 信号关联、基数和隐私进入 KB-INBOX-010 |
| `prd-prototype-workbench-onepiece-3.0.zip` | `7d22eb16cda888100576ed62c4652a2543b5dd1fc9fba596f43947015a9abb9e` | 需求到原型与测试派生 | 当前 requirements/design/UAT 流程已覆盖；不复制模板 |
| `product-requirements-prototype-onepiece-3.0.zip` | `a1c04dc186ed5d256883eb81fa846c74f1198e53d3958802cf2f499bceb49356` | 产品发现与验收 | 与现有需求基线、UAT Gate 重复；不直接入库 |
| `qa-testing-benchmark-onepiece-3.0.zip` | `941b95cda976bfa599e9c0b2321fd9c7c55ff5d6e8c158cb5ab97113c3b56247` | 测试与质量相关 | 与现有测试 Skills 去重；环境隔离和中止控制并入 KB-INBOX-011 |
| `security-hardening-onepiece-3.0.zip` | `be7aa151acabc581ced6b9ed7fff00caa0670164062878eef59a350aa4e9fa28` | 安全相关 | 现有安全规则优先；客户端信任边界反例进入 KB-INBOX-006 |
| `store-launch-compliance-onepiece-3.0.zip` | `7fb9c26b29b483fd9a12203ccf39a42be21503b313c8ee4a7f8d375cda99cc5c` | 上架与平台合规，强时间敏感 | 不固化为当前规则；上架 Change 中核对当期官方政策和人工法务/发布审批 |
| `uniapp-vue2-uview-onepiece-3.0.zip` | `eb2009cd7043913fb451c370acef4d0e48dd50af44457c6ea7c0b3252eb0ec73` | Vue 2/uView/webpack，与主栈不匹配 | 不激活；共性的宿主能力思想已在 Vue 3 条目中吸收 |
| `uniapp-vue3-wot-design-uni-onepiece-3.0.zip` | `862487b717fdb2dc59ad569b68fb7f45897fe4c82f31e01d15bd1c1c1f95977c` | 当前客户端高度相关 | 拆为 KB-INBOX-002 至 KB-INBOX-006，拒绝整包复制 |

# 路由结论

## 进入 Skills 的内容

- 新建 `experience-assimilation`：以后重复执行来源固定、拆分、去重、纠错、路由和晋级。
- 现有 `frontend-implementation`、`backend-implementation`、`database-migration`、`api-contract-design`、`integration-e2e-test`、`security-review`、`ci-quality-gate` 和 `deploy-verify` 已覆盖多数执行流程，不重复导入源包入口。

## 进入 Rules 的内容

- 仅补充“个人经验吸收治理”规则；技术红线优先复用现有 Rules。
- 本次候选技术经验尚未在真实项目验证，因此没有将其直接提升为新的强制技术红线。

## 进入 Knowledge 的内容

- 多端宿主能力适配与证据矩阵。
- 冷启动认证与运行期 401 的双阶段竞态治理。
- 页面/组件生命周期资源清理。
- 离线写请求重放的幂等与冲突边界。
- 客户端伪安全和未经测试的“全端兼容”反模式。
- NestJS、MySQL、Redis、RabbitMQ 的一致性边界。
- OpenAPI 生成链路的指纹、Diff 和手写代码保护。
- MySQL 迁移的兼容窗口、锁预算、回填和恢复。
- 日志、指标、Trace 的关联、基数和隐私。
- 高影响自动化的权限、dry-run、中止阈值与恢复 Owner。

# 主要冲突与修正

1. 源数据库模板出现 PostgreSQL `SET lock_timeout`、`statement_timeout`、`CREATE INDEX CONCURRENTLY` 等语法；当前基线是 MySQL，禁止复制，参数必须按实际 MySQL 版本和工具重新设计。
2. 源客户端实现以 XOR/Base64 保护 Token/PII；该方式仅是混淆，不构成可信加密。高价值 Secret 优先由服务端会话或平台安全存储管理。
3. 源离线队列说明包含“非幂等写操作自动重放”；这可能产生重复订单、重复支付或覆盖新状态。修正为仅允许显式幂等、可冲突判定、可审计操作。
4. 源材料含“全端、全版本、零瑕疵、零停机”等绝对表述；本 Harness 改为目标端矩阵、版本边界和真实证据。
5. 客户端路由、按钮、水印和本地存储不能承担服务端授权、保密或数据正确性边界。

# 当前证据等级

- 已完成：来源存在性、文件清单、SHA-256、入口/关键参考读取、与现有 Harness 去重和冲突审查。
- 已完成：源包自身报告表明其结构、哈希或内部契约检查已执行；仅作为来源制品证据。
- 未执行：在具体 uni-app/NestJS 项目中的编译、单元、集成、真机、性能、安全和发布验证。
- 结论：KB-INBOX-002 至 KB-INBOX-011 均为 `draft`，不能直接作为发布 Gate 或强制 Rules 的唯一依据。

# 晋级计划

候选知识只有在真实 Change 中满足以下条件后才能晋级：

1. 明确实际依赖版本、目标端、代码 SHA 和环境。
2. 保存修复前现象或设计前风险基线。
3. 执行与知识相符的单元、集成、E2E、真机、性能或安全验证。
4. 记录失败方法、边界、回滚和失效条件。
5. 由非原作者 Reviewer 复核，更新 `last_verified` 和关联 Change。

# 关联文件

- `rules/14-AI技能与知识治理规范.md`
- `skills/experience-assimilation/SKILL.md`
- `skills/knowledge-capture/SKILL.md`
- `skills/knowledge-retrieval/SKILL.md`
- `knowledge/index.yaml`

