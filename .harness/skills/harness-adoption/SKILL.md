---
name: harness-adoption
description: 将本 Harness 模板接入真实 uni-app 与 NestJS 仓库，校准目录、命令、Owner、平台、环境和 CI；首次采用或项目结构变化时使用。
---

# Harness 项目接入

## 触发条件

- 首次把本 `.harness` 复制到真实项目。
- monorepo 目录、包管理器、CI 命令、部署拓扑或 Owner 发生变化。
- `project-quality.json` 仍为 template，准备启用真实质量门禁。

## 不适用场景

- 普通业务 Change，不需要重新校准工程入口。
- 未经授权修改组织级 CI、生产环境或第三方账号。
- 用模板默认路径假设真实仓库结构。

## 前置 Gate

- 已获得目标仓库只读访问和维护 Harness 文件的授权。
- 团队明确前端、后端、测试、架构、安全和发布 Owner。
- 激活 CI 前确认命令可在隔离环境执行且不会访问生产。

## 必读上下文

1. 根目录 `AGENTS.md`、`.harness/manifest.yaml`、全部入口适配文件。
2. 根 package.json、workspace、锁文件、前后端构建配置和现有 CI。
3. 部署拓扑、目标端、环境、Secret 管理和团队分工。
4. `.harness/project-quality.json` 与质量、安全、发布 Rules。

## 输入

- 仓库根、前端根、后端根、包管理器和 Node 版本。
- 实际格式、Lint、类型、单元、构建、契约、集成、E2E、安全命令。
- CI 平台、环境资源、目标端矩阵和审批责任人。

## 执行步骤

1. 盘点仓库结构和现有命令，不新增与项目事实冲突的目录假设。
2. 核对 uni-app CLI/Vite、Vue3、Pinia、Wot Design Uni 与 NestJS/TypeORM 版本事实。
3. 将 manifest 的 distribution_mode 从 template 改为 active。
4. 配置 `project-quality.json` 的工作目录、包管理器和十类质量命令。
5. 单独运行每条命令，确认退出码可靠且失败不会被脚本吞掉。
6. 配置 CI 所需 MySQL、Redis、RabbitMQ 隔离服务和确定性测试数据。
7. 补齐 Wiki 的技术基线、系统上下文、部署拓扑、权限、数据和观测事实。
8. 将 Agent 角色映射到真实 Owner，不能用“团队”代替责任人。
9. 定义 H5、小程序、App 的支持矩阵、审核发布渠道和最低版本。
10. 运行 Harness 与项目质量脚本，保存接入证据和已知例外。
11. 对现有项目与新 Rules 的差距创建分阶段治理 Change，不一次性暗改业务代码。

## 技术约束

- 锁文件必须与包管理器一致；CI 使用确定性安装，不在验证中隐式升级依赖。
- active 模式所有命令必须存在且失败返回非零；禁止使用 `--if-present` 静默跳过强制 Gate。
- CI 环境不得使用生产 Secret 和生产数据库；集成资源必须隔离和可清理。
- 适配文件只路由到 AGENTS/Harness，不复制形成独立规则源。
- 旧项目暂时无法满足的规则使用显式例外、Owner、期限和补救 Change。

## 产物

- 激活的 manifest 和 `project-quality.json`。
- 真实 Wiki、Owner、目标端和环境信息。
- 可运行的 CI 质量门禁及接入证据。
- 遗留差距、例外、期限和治理 Change 清单。

## 验证与证据

- `node .harness/scripts/validate-harness.mjs` 通过。
- `node .harness/scripts/run-project-quality.mjs` 在隔离 CI 中真实执行全部命令。
- 故意制造一个安全的 lint/测试失败，确认 CI 会阻塞。
- 从根目录和子目录启动代理，确认读取到正确作用域指令。

## 停止与升级条件

- 真实项目技术栈与本 Harness 基线显著不符。
- CI 命令需要生产凭证或会产生外部副作用。
- 无法确定关键 Owner、发布渠道或环境隔离。
- 激活会立即阻塞所有工作且没有批准的迁移计划。

## 禁止事项

- 不为获得绿色结果保留 template 模式或使用空命令。
- 不覆盖团队现有未评审 CI、配置和用户修改。
- 不把接入 Harness 视为自动授权重构整个项目。
- 不伪造目标端、生产或安全验证结果。

## 完成定义

Harness 已映射真实仓库、技术栈、命令、Owner、环境和目标端；active 质量门禁真实运行且能阻断失败；遗留差距有受控计划；项目可开始创建正式 Change。
