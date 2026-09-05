# Harness AI 工程总契约

本文件是仓库级 AI 顶层入口，适用于在本仓库中执行需求分析、设计、编码、测试、评审、排障、迁移、发布和文档工作的所有 AI 与人工协作者。

它负责规定启动协议、权威顺序、工程红线、工作流和停止条件。详细技术步骤必须继续读取 `.harness/rules/` 与 `.harness/skills/`，不得只读本文件后凭通用经验执行。

## 0. 当前接入状态

- `CHG-OUTDOOR-V110-001` 的 Requirements/Design Gate 已于 2026-08-30 由用户批准，当前进入实现阶段；`project-quality.json` 必须在质量基线任务中从 template 激活。
- 项目批准保留 Prisma 7 与 Prisma Migration；未接入 Redis/RabbitMQ，二者只允许由后续批准的真实用例引入。
- 禁止为了对齐母体模板迁移 TypeORM、引入空基础设施或执行一次性全仓重写。
- 当前主要实现位于未提交工作树；修改时必须保护现有文件，仓库 Owner 建立恢复基线前不得进行覆盖式重构。

## 1. 项目技术基线

| 层级 | 强制技术栈 |
|---|---|
| 客户端 | uni-app CLI/Vite + Vue 3 Composition API + TypeScript |
| 状态管理 | Pinia |
| UI | Wot Design Uni |
| 运营后台 | Vue 3 + TypeScript + Pinia + Element Plus + ECharts |
| 服务端 | NestJS + TypeScript，默认模块化单体 |
| ORM | Prisma 7 + Prisma Migration |
| 数据库 | MySQL / InnoDB |
| 缓存 | 当前未接入；经批准用例可引入 Redis |
| 消息 | 当前未接入；经批准异步用例可引入 RabbitMQ |
| 契约 | OpenAPI 3.x + 稳定错误码 + 版本化事件 Schema |
| 质量 | 静态检查、单元、集成、契约、E2E、回归、安全和独立评审 |

具体版本由项目锁文件、运行环境和 `.harness/wiki/00-技术基线.md` 决定。AI 不得凭记忆擅自升级依赖或写死未经确认的版本。

## 2. 权威顺序

发生冲突时按以下顺序处理：

1. 平台 System、Developer、User 指令与明确权限边界。
2. 当前作用域的 `AGENTS.override.md` / `AGENTS.md` 指令链。
3. `.harness/rules/` 中的长期强制规则。
4. 当前已经批准的 Change 契约与人工 Gate 决定。
5. `.harness/wiki/` 中当前已经生效的系统事实。
6. `.harness/skills/` 中与当前任务匹配的执行规程。
7. `.harness/knowledge/` 中经过验证且适用的历史经验。
8. `.harness/agents/` 中的角色偏好与协作方式。

低优先级内容不得覆盖高优先级约束。发现冲突时停止冲突部分，记录文件、条目、影响和建议裁决人，不得自行选择更方便的一项。

子目录 `AGENTS.md` 可以增加模块特有约束。任何放宽根目录红线、生产权限、测试 Gate 或证据要求的例外，必须在已批准 Change 中记录批准人、范围、期限和补救方案。

## 3. AI 启动协议

开始任何实质工作前必须按顺序完成：

1. 确认仓库根目录、当前工作目录、目标文件和用户请求范围。
2. 读取本文件与当前路径生效的其他 `AGENTS.md`/override 文件。
3. 读取 `.harness/manifest.yaml` 和 `rules/00-治理与优先级.md`。
4. 根据任务读取相关 Rules，不允许只加载最方便的一份。
5. 查找当前 Change；读取 `status.yaml`、`source-baseline.json`、`gate-decisions.json`、需求、AC、影响、设计、任务、知识和验证文件。
6. 读取相关 Wiki，并使用代码、配置或运行证据核对当前事实。
7. 执行 `knowledge-retrieval`，检索知识库和历史 Change。
8. 选择最少但完整的 Skill 集合，完整读取对应 `SKILL.md`。
9. 核对当前状态允许的操作、人工 Gate、权限和停止条件。
10. 在修改前检查工作区状态，保护用户已有和无关修改。

缺少 Change、设计或权限时，仍可执行安全的只读分析，但不得把分析自动扩展为编码、外部写入或生产操作。

## 4. Change 适用范围

以下变更必须受 Change 管理：

- 新功能、运营活动和用户行为变化。
- Bugfix、热修复和线上数据问题。
- API、错误码、权限、配置或外部集成变化。
- 数据库 schema、索引、数据回填或数据修复。
- Redis Key、TTL、序列化或一致性策略变化。
- RabbitMQ 事件、拓扑、消费者、重试或 DLQ 变化。
- 依赖升级、技术重构、性能优化、安全修复和基础设施变化。
- 功能下线、兼容窗口结束和破坏性清理。

纯文档错字、无行为变化的格式化或当前 Change 内部已授权的小任务可以走轻量路径，但仍需保留适度验证。无法判断是否改变行为时，默认按 Change 管理。

## 5. 标准状态机与 Gate

```text
draft
  -> clarifying
  -> requirements_ready
  -> design_ready
  -> approved
  -> implementing
  -> verifying
  -> ready_for_release
  -> released
  -> completed
  -> archived
```

强制 Gate：

1. 需求 Gate：范围、非目标、业务规则、FR/NFR、AC、风险和未决问题明确。
2. 设计 Gate：前端、后端、API、数据、缓存、消息、安全、测试、观测、发布与回滚完整。
3. 实现 Gate：任务完成，契约同步，静态检查、单元测试和开发者自测通过。
4. 验证 Gate：集成、契约、E2E、回归、可访问性和必要性能验证有真实证据。
5. 安全 Gate：产品安全与软件供应链证据完整，P0/P1 已关闭或阻塞。
6. UAT Gate：冻结候选制品在目标端通过产品和业务验收。
7. Operations Gate：SLO、容量、告警、Runbook、值班、备份恢复和 Incident 计划就绪。
8. 发布 Gate：制品、配置、迁移、灰度、监控、停止阈值和回滚经授权人批准。
9. 完成 Gate：生产观察完成、独立 Reviewer 通过、Wiki 与知识沉淀完成。

AI 可以建议状态变化，但不得代替产品、架构、安全、独立 Reviewer 或发布负责人批准 Gate。

## 6. 全局不可违反红线

1. 未批准需求和设计不得开始跨模块编码。
2. 不得超出用户请求和当前 TASK 顺手重构无关区域。
3. 不得删除、跳过、静默重跑或弱化失败测试以制造绿色结果。
4. 不得把计划、模拟输出、旧报告或人工口述写成已执行证据。
5. 不得提交、输出或复制真实 Secret、Token、密码和未脱敏敏感数据。
6. 不得在没有明确授权时执行生产发布、生产写入、外部消息或不可逆操作。
7. 不得使用 ORM `synchronize: true` 管理生产 schema。
8. 不得在数据库事务内等待外部 HTTP、Redis 或 RabbitMQ 确认。
9. 不得宣称 RabbitMQ 提供端到端 exactly-once；消费者按至少一次投递设计幂等。
10. 不得把 Redis 当作持久业务真相，除非已批准架构明确如此定义。
11. 不得只验证 H5 就宣称微信小程序或 App 通过。
12. 不得由主要实现者担任最终独立 Reviewer 并批准自己的修复。
13. 不得在证据缺失时把 Gate 标记为 passed；默认失败。
14. 不得将未生效设计写入 Wiki，也不得把未验证经验标记为 verified。

## 7. 前端硬约束

- 使用 Vue 3 Composition API 和 `<script setup lang="ts">`；禁止新增 Options API 页面。
- 优先使用 Wot Design Uni 组件和主题变量，不复制基础组件实现。
- 页面负责生命周期和用例组合；请求、业务状态和可复用逻辑分别进入 api、store/composable。
- 所有异步交互覆盖 loading、empty、error、权限、弱网、重复提交、取消和卸载竞态。
- 浏览器 DOM、Node API 和平台专属能力必须隔离，明确 H5/小程序/App 支持矩阵。
- 客户端不得保存服务端 Secret；错误提示依赖稳定错误码，不展示未知内部异常。
- 主路径变化必须在需求指定目标端验证；支付、登录、上传、扫码、定位等需要真机或等价目标端证据。

详细执行读取 `rules/04-前端工程规范.md` 和 `skills/frontend-implementation/SKILL.md`。

## 8. 后端硬约束

- NestJS 按 API、Application、Domain、Infrastructure 分层；Controller 不写业务规则。
- Domain 不依赖 NestJS、Prisma/TypeORM、Redis 或 RabbitMQ；基础设施实现领域/应用端口。
- 输入必须使用运行时 DTO 校验；实体不得直接作为公开响应返回。
- 事务边界位于应用用例；竞争资源明确采用条件更新、乐观锁或批准的锁策略。
- 关键数据库事件通过 Outbox 等可靠边界发布；消费者完成幂等副作用后 ACK。
- 配置在启动时校验并快速失败；日志使用 requestId/traceId 且不得泄漏敏感字段。
- Repository 避免 N+1、无界查询和隐式全表扫描；分页必须稳定。

详细执行读取 `rules/05-后端工程规范.md` 和 `skills/backend-implementation/SKILL.md`。

## 9. 数据、缓存和消息硬约束

### MySQL

- 所有 schema 变化使用当前批准 ORM 的版本化 Migration；生产禁止隐式同步 schema。
- 大表 DDL、索引和回填必须评估行数、锁、磁盘、复制延迟、批次和恢复。
- 删除/重命名使用 expand-migrate-contract，支持新旧应用滚动共存。
- 数据修复必须可预览、可审计、尽量幂等，并提供校验和恢复方案。

### Redis

- Key 必须有命名空间、版本、所有者、值 schema 和 TTL。
- 采用 Cache Aside 时明确事务提交后的失效顺序、缓存重建和降级。
- 设计穿透、击穿、雪崩、热点和缓存不可用场景。
- 分布式锁不能替代数据库不变量，必须定义租约、超时和 fencing/所有权风险。

### RabbitMQ

- 事件使用稳定信封、eventId、eventType、schemaVersion、occurredAt 和 traceId。
- 明确 exchange、queue、binding、durability、confirm、prefetch、ACK、重试和 DLQ。
- 无限重试、失败后吞异常 ACK、无 Owner 的 DLQ 和无审计重放均禁止。
- schema 演进需要新旧生产者/消费者兼容窗口。

## 10. 测试与回归最低标准

- 每条 FR/NFR/AC 必须追踪到 TASK、测试或明确人工验证及 evidence。
- 每条正式 FR/NFR 必须反查原始来源基线；用户可见需求必须进入产品 UAT。
- Bugfix 先保存修复前复现，再增加修复后防回归测试。
- 单元测试验证业务行为；MySQL、Redis、RabbitMQ 语义使用真实或容器化集成测试。
- API 与事件必须进行契约校验；核心用户链路必须进行 E2E。
- 回归覆盖直接功能、上下游、共享能力、历史缺陷和核心业务链路。
- 异步测试禁止依赖任意 sleep；使用可观察条件和有限超时。
- 测试结果绑定当前 SHA、环境、命令、时间、退出码和报告位置。

## 11. 第二大脑协议

开始需求、设计、编码、排障、测试、评审或发布前，执行 `knowledge-retrieval`：

1. 从模块、领域、症状、错误码和技术栈提取检索词。
2. 检索 `knowledge/index.yaml`、`knowledge/`、`wiki/` 和历史 `changes/`。
3. 核对知识状态、适用边界、版本和 `last_verified`。
4. 在当前 Change `07-knowledge.md` 记录采用或不采用理由。

以下任一情况必须执行 `knowledge-capture`：排障超过 30 分钟、同类问题第二次发生、线上事故、关键架构决策、高风险反模式、重复人工操作或 Change 完成。

从个人 Skill、旧项目、压缩包或外部资料批量导入经验时，必须先执行 `experience-assimilation`。导入内容先固定来源与哈希，再拆分到 Rules、Skills、Wiki、Changes 或 Knowledge；来源包自带校验不等于当前项目验证，未经真实项目证据支持的条目只能进入 `knowledge/inbox/` 并保持 `draft`。

知识状态：`draft`、`verified`、`deprecated`、`rejected`。只有 verified 且边界匹配的知识可以作为正式依据，但仍不能替代当前验证。

## 12. 证据与真实性

有效证据至少记录：

- Change ID、TASK/FR/AC/Test ID。
- 代码 SHA 或制品 digest。
- 命令、参数、环境和依赖版本。
- 开始/结束时间、退出码和摘要。
- 报告、日志、截图、trace 或制品位置。
- 执行者或流水线身份。

未运行的操作标记 `not-run`，失败的操作标记 failed。截图只证明可视状态，不能替代接口、数据库、缓存、消息和错误路径验证。

## 13. 权限与破坏性操作

以下操作必须在执行前获得针对目标、环境和动作的明确授权：

- 生产发布、回滚、扩缩容和功能开关修改。
- 生产数据库写入、迁移、删除、回填和修复。
- 外部消息、邮件、通知、工单或第三方系统写入。
- 删除文件、历史、队列、缓存、制品或不可恢复数据。
- 读取或提升 Secret、生产凭证、管理员权限。
- 会产生显著费用或影响真实用户的操作。

授权仅适用于明确范围，不自动扩展到相邻系统。优先执行只读检查、dry-run、备份、灰度和可恢复动作。

## 14. 停止与升级条件

出现以下任一情况，停止受影响操作并请求对应 Owner 决策：

- 需求、设计、Rules、Change 或当前代码事实冲突。
- 实现需要扩大范围、改变 AC、公开契约、数据口径或架构。
- 发现 P0/P1 安全、资金、数据或生产风险。
- 无法确认目标环境，或可能连接生产资源。
- 缺少关键测试环境、真实证据、Reviewer 独立性或发布/回滚能力。
- 工作区存在与任务重叠且来源不明的用户修改。
- 命令可能造成不可逆破坏但目标范围或授权不明确。

停止时必须说明：已确认事实、阻塞点、风险、已完成的安全检查和需要谁做什么决定。

## 15. 文件索引

| 路径 | 作用 |
|---|---|
| `.harness/manifest.yaml` | 技术栈、状态机、Gate 与机器策略 |
| `.harness/project-quality.json` | 真实项目质量命令；接入后从 template 切换为 active |
| `.harness/rules/` | 长期不可随意违反的详细规则 |
| `.harness/changes/` | 单次变更契约、状态、测试和证据 |
| `.harness/wiki/` | 当前已生效系统事实 |
| `.harness/skills/` | 详细可执行工程作业规程 |
| `.harness/knowledge/` | 经验、事故、ADR、模式、反模式、Runbook |
| `.harness/agents/` | 角色、输入输出和权限边界 |
| `.harness/templates/` | 新 Change 和知识模板 |
| `.harness/schemas/` | 机器可读结构定义 |
| `.harness/scripts/` | 创建、校验和归档工具 |

## 16. 常用命令

创建 Change：

```powershell
pwsh -File .harness/scripts/new-change.ps1 -Name <change-name> -Id <CHG-ID>
```

校验 Harness：

```text
node .harness/scripts/validate-harness.mjs
```

执行真实项目质量门禁（接入后必须为 active）：

```text
node .harness/scripts/run-project-quality.mjs
```

检索知识：

```text
rg -i "<领域词|模块|错误码|症状|技术栈>" .harness/knowledge .harness/wiki .harness/changes
```

归档 Change 前必须先满足 completed 条件，再执行归档脚本。不得用命令成功代替业务、测试或人工 Gate 通过。

## 17. 完成定义

AI 只有在以下条件满足时才能向用户报告“已完成”：

- 请求范围内产物真实存在且可定位。
- Change 状态和 Gate 与实际进度一致。
- 需求、设计、任务、代码、测试和证据可追踪。
- 适用的静态、单元、集成、契约、E2E、回归和安全验证已执行。
- 来源基线、UI/UX、产品 UAT、供应链安全和 Operations Gate 已完成或有合法 not-required 决策。
- 没有未报告的失败、跳过、P0/P1 或范围偏差。
- Wiki 更新只包含已生效事实，知识检索和沉淀判断已经记录。
- `node .harness/scripts/validate-harness.mjs` 通过。

如果部分工作因权限、环境或外部依赖未执行，必须明确报告已完成、未完成、真实验证结果和下一步，不得使用模糊的“基本完成”。
