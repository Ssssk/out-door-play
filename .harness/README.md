# `.harness` 工程契约说明

## 目录语义

| 目录 | 权威内容 | 生命周期 |
|---|---|---|
| `rules/` | 不可随意违反的治理、架构、编码、安全和发布规则 | 长期维护 |
| `wiki/` | 当前系统已经成立的产品、领域和技术事实 | 随系统演进 |
| `changes/` | 单次需求从提出到归档的增量契约和证据 | 每个需求独立 |
| `knowledge/` | 开发经验、事故、决策、模式、反模式和 Runbook | 持续积累与复核 |
| `skills/` | 可重复执行的标准化工作方法 | 持续优化 |
| `agents/` | 角色、输入、输出和权限边界 | 持续优化 |
| `templates/` | 创建新 Change 时使用的模板 | 版本化 |
| `schemas/` | 机器可读结构定义 | 兼容演进 |
| `scripts/` | 创建、校验和归档工具 | CI 执行 |

根目录 `AGENTS.md` 是 AI 工程总入口；`CLAUDE.md`、`.cursor/rules/harness.mdc` 和 `.github/copilot-instructions.md` 是薄适配文件，只负责让不同编码代理进入同一套 Harness 契约。

## 标准工作流

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

紧急修复允许使用 `hotfix` 流程，但不能跳过测试、回滚和事后补充契约。取消的需求进入 `cancelled`，必须记录原因和已产生副作用。

## 九个强制 Gate

1. **需求 Gate**：范围、非目标、业务规则、验收标准、风险和未决问题明确。
2. **设计 Gate**：前端、后端、API、数据、缓存、消息、安全和可观测性方案完成。
3. **实现 Gate**：任务全部完成，代码静态检查和开发者自测通过。
4. **验证 Gate**：单元、集成、契约、E2E、回归、可访问性和必要性能验证有真实证据。
5. **安全 Gate**：产品安全、依赖、CI、SBOM 和制品供应链风险完成评审。
6. **UAT Gate**：冻结候选制品在需求目标端通过产品和业务验收。
7. **Operations Gate**：SLO、容量、告警、Runbook、值班、备份恢复和 Incident 计划就绪。
8. **发布 Gate**：发布、迁移、监控、灰度与回滚方案经授权人批准。
9. **完成 Gate**：生产观察、独立验收、Wiki、知识沉淀和残余风险完成核对。

## 契约措辞

- **MUST/必须**：违反即 Gate 失败；例外需要书面批准、截止日期和补救计划。
- **SHOULD/应该**：默认遵守；偏离必须在设计中说明理由。
- **MAY/可以**：由实现者根据上下文选择。

## 最小完成条件

Change 只有在来源基线可追踪、验收标准全部关联测试证据、UI/UX 与产品 UAT 完成、安全供应链和 Operations Gate 通过、独立评审通过、部署结果可核验、Wiki 已同步、知识检索与沉淀判断已完成且不存在未接受的高风险项时才能标记 `completed`。

## Skill 执行要求

每个 Skill 都是完整工程作业规程，必须包含触发条件、非适用场景、前置 Gate、必读上下文、输入、执行步骤、技术约束、产物、验证与证据、停止与升级条件、禁止事项和完成定义。执行者不得只读取标题或摘要后凭通用经验操作。

工作开始前运行 `knowledge-retrieval`；产生可复用经验或 Change 完成时运行 `knowledge-capture`。Wiki 记录当前事实，Change 记录本次过程，Knowledge 记录可复用经验，三者不得混用。

批量吸收个人 Skill、旧项目规范或外部经验时运行 `experience-assimilation`：先固定来源与哈希，再拆分、去重、纠错和路由。未经当前项目验证的内容只进入 `knowledge/inbox/`，不得直接升级为 Rules、Wiki 事实或 `verified` 知识。
