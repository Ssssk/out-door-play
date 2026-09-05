# 需求澄清

| ID | 问题/假设 | 影响 | Owner | 状态 | 结论与日期 |
|---|---|---|---|---|---|
| Q-001 | v1.1.0 的正式范围以 13 个 `project-spec.json` 注册页面为准，还是还包含未注册的个人中心子页、系统配置和管理总纲？ | 决定后续 Change 数量、路由、API 与 UAT | 产品 Owner | closed | 2026-08-30：采用 17 份业务需求；排除两个 example，admin-system 只作总纲 |
| Q-002 | `web-users`、`web-ugc` 在 v1.1.0 仍标记 `hiddenInNav`，本轮是实现但隐藏、正式启用，还是延期？ | 决定认证、审核、内容安全和后台范围 | 产品 Owner | closed | 2026-08-30：纳入实现，认证与内容安全完成前保持隐藏 |
| Q-003 | 保留现有 Prisma 7，还是按 Harness 默认迁移到 TypeORM？ | 影响全部 Repository、Migration、测试和回滚；迁移成本高 | 架构 Owner | closed | 2026-08-30：保留 Prisma 7 与 Prisma Migration |
| Q-004 | Redis/RabbitMQ 是强制首期基础设施，还是仅在缓存/异步用例出现时引入？ | 影响本地环境、CI、运维和复杂度 | 架构/运维 Owner | closed | 2026-08-30：仅按批准用例增量引入，禁止空接入 |
| Q-005 | 首批验收端是否固定为 H5 + 微信小程序？App、支付宝、抖音、百度、快手、QQ 是否承诺？ | 决定兼容矩阵与真机成本 | 产品/发布 Owner | closed | 2026-08-30：首批固定 H5 + 微信小程序 |
| Q-006 | 用户端和管理端采用什么登录、会话、角色与资源授权模型？ | 当前写接口缺少可信安全边界，阻塞任何可发布写功能 | 产品/安全 Owner | closed-for-program | 2026-08-30：批准微信登录+服务端会话/短期凭证、Admin 独立认证+RBAC；协议细节在子 Change 冻结 |
| Q-007 | 产品、架构、UX、安全、测试、运维、UAT 和发布 Owner 分别是谁？ | Harness Gate 无法合法批准 | 项目负责人 | partial | 用户担任产品/架构 Owner；其余 Gate Owner 在相应阶段前确认 |
| Q-008 | 油价、加油站、定位、地图导航和内容安全的真实数据源/供应商是什么？ | 决定数据新鲜度、合规、失败降级和成本 | 产品/架构 Owner | open | 当前代码仅本地数据/坐标导航 |
| Q-009 | 是否先把现有未提交实现建立一次人工确认的基线提交？ | 没有完整可回退点会放大重构风险 | 仓库 Owner | open | 推荐先评审并提交现状基线，不由 AI 自动提交 |
| Q-010 | PRD 内重复 AC（`AC-1`、`AC-WEB-*`）是否允许在 Harness 中重新命名但保留来源映射？ | 决定全局追踪唯一性 | 产品/测试 Owner | closed | 2026-08-30：允许领域前缀稳定 ID，必须保留来源映射 |

## 决策日志

| 决策 ID | 决策 | 理由 | 决策人 | 日期 |
|---|---|---|---|---|
| DEC-BOOT-001 | 最新需求源选择 `v1.1.0/`，不使用根目录 v1.0.0 镜像 | `VERSIONING.md` 明确 v1.1.0 为当前迭代 | 来源规范 | 2026-08-30 |
| DEC-BOOT-002 | 本次先建立程序级基线，再拆分垂直业务 Change | 全产品一次性 Change 无法独立评审、验证和回滚 | Harness 治理约束 | 2026-08-30 |
| DEC-BOOT-003 | 源 PRD 的 READY 不自动等于 Harness Requirements Gate passed | PRD 内部仍存在版本、范围和 AC 冲突 | Harness 治理约束 | 2026-08-30 |
| DEC-REQ-001 | 17 份业务需求作为正式范围；排除示例，管理端总纲仅作上下文 | 消除 spec 注册与 requirements 数量冲突 | 用户（项目负责人） | 2026-08-30 |
| DEC-ARCH-001 | 保留 Prisma 7，按垂直 Change 渐进分层，不迁移 TypeORM | 降低无产品收益的全量迁移与数据风险 | 用户（项目负责人） | 2026-08-30 |
| DEC-ARCH-002 | Redis/RabbitMQ 由具体用例驱动，不作为空基础设施首期接入 | 控制运维复杂度并保持真实架构 | 用户（项目负责人） | 2026-08-30 |
| DEC-PLATFORM-001 | 首批产品端为 H5 与微信小程序 | 与现有构建资产及验收能力匹配 | 用户（项目负责人） | 2026-08-30 |

## 来源冲突与版本差异

| 来源 ID | 冲突/变化 | 影响 FR/AC | 裁决人 | 状态 |
|---|---|---|---|---|
| SRC-PRD-001 | 根目录 spec 为 v1.0.0，`VERSIONING.md` 指定 v1.1.0 为当前版本 | 全部产品需求 | 产品 Owner | 已识别：使用 v1.1.0 |
| SRC-PRD-001 | v1.1.0 中 20 个需求文件，但 spec 只注册 13 个页面 | 产品范围 | 产品 Owner | closed：17 份业务需求，2 个 example 排除，admin-system 作总纲 |
| SRC-PRD-001 | 多份 requirements 与 docs 缺失镜像或内容哈希不同 | 来源完整性 | PRD Owner | open |
| SRC-PRD-001 | 多份正文仍写 v1.0.0/Template 2.0，管理总纲标为 DRAFT | 版本与 Gate | 产品 Owner | open |
| SRC-PRD-001 | `AC-1/2/3` 和 `AC-WEB-*` 在不同文件重复 | 全局追踪 | 产品/测试 Owner | closed：领域前缀稳定 ID + 来源映射 |
| SRC-CODE-001 | 旧代码 Prisma 与 Harness TypeORM 默认基线冲突 | 后端设计/迁移 | 架构 Owner | closed：项目采用 Prisma 7 |
| SRC-CODE-001 | README 声称“本地完整跑通”，但类型检查失败且后台无测试 | 质量 Gate | 技术 Owner | 已识别：不得作为完成证据 |

Q-008、Q-009 作为具体业务/仓库治理风险保留，不再阻塞程序级 Requirements/Design Gate；进入相关子 Change 时重新检查。

