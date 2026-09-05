---
name: ci-quality-gate
description: 配置并执行前后端应用 CI 的确定性安装、静态检查、构建、测试、契约、安全和 Harness 门禁；项目接入或 CI 变化时使用。
---

# 应用 CI 质量门禁

## 触发条件

- Harness 从 template 激活到真实项目。
- package scripts、构建系统、测试层级、依赖或 CI 平台变化。
- PR 合并规则需要新增或修复质量检查。

## 不适用场景

- 未经授权修改组织分支保护和生产部署。
- 用本地一次成功代替 CI 可重复性。
- 业务实现期间临时关闭失败门禁。

## 前置 Gate

- 项目目录、包管理器、锁文件和 Node 版本明确。
- 每个 Gate 有真实命令、Owner、超时和失败语义。
- 集成/E2E 环境与生产隔离，不使用生产 Secret。

## 必读上下文

1. `project-quality.json`、根 package scripts、workspace 和锁文件。
2. Git/CI、测试、安全、发布 Rules 和现有 workflow。
3. MySQL、Redis、RabbitMQ 测试环境与目标端自动化能力。
4. 当前 Change 测试计划、影响范围和 evidence 要求。

## 输入

- format、lint、typecheck、unit、build、contract、integration、e2e、security 命令。
- CI Runner、缓存、服务容器、制品和报告路径。
- 分支保护、并行策略、超时、重试和资源限制。

## 执行步骤

1. 使用锁文件确定性安装，校验包管理器与 Node 版本。
2. 将快速 Gate 排在前面：格式、Lint、类型、单元、构建、契约。
3. 为 MySQL/Redis/RabbitMQ 创建固定版本隔离服务、健康检查和清理。
4. 执行集成与 E2E，固定种子、时区、语言和并发隔离。
5. 执行 Secret、SAST、SCA、许可证、SBOM 和适用镜像/IaC 扫描。
6. 执行 Harness 校验，拒绝状态、审批、追踪和 evidence 不一致。
7. 每个 Job 绑定 commit SHA，导出机器报告和 `.evidence.json`。
8. 设置合理超时；只有已确认的环境瞬态失败允许有限重试。
9. 验证取消和重跑不会复用错误制品或污染共享数据。
10. 对必需检查配置分支保护；例外记录审批、期限和补跑计划。
11. 故意制造安全的失败，确认 CI 与合并策略确实阻塞。

## 技术约束

- active 模式禁止 `--if-present`、`|| true` 或吞退出码绕过强制命令。
- 制品一次构建、多阶段复用，不在发布服务器重新构建。
- 缓存只能加速，不得成为正确性依赖；缓存键包含锁文件和运行时版本。
- CI 日志和 Artifact 不得包含 Secret、Token 或生产数据。
- 第三方 Action 固定可信版本，权限最小化，PR 来源不获得高权限 Secret。
- 不稳定测试视为缺陷，需隔离、Owner 和修复期限，不能无限自动重跑。

## 产物

- active `project-quality.json` 和 CI workflow。
- 每个 Gate 的报告、制品、SHA 和 evidence。
- 分支保护要求、例外和不稳定测试清单。
- 质量门禁运行与失败阻断证明。

## 验证与证据

- `run-project-quality.mjs` 能顺序执行全部命令并在首个失败停止。
- PR 中必需检查未通过时不能合并。
- 报告与制品可反查当前 SHA，重复执行结果一致。
- 集成资源无残留，安全日志无敏感数据。

## 停止与升级条件

- 命令依赖生产环境、真实用户或不可清理外部副作用。
- CI Runner 权限过高、Action 来源不可信或 Secret 边界不清。
- 构建产物与发布产物不一致。
- 失败被脚本吞掉或分支保护没有真正要求该检查。

## 禁止事项

- 不为了速度删除质量阶段或降低断言。
- 不用固定 sleep 掩盖服务就绪和异步竞态。
- 不允许 fork PR 获取生产 Secret。
- 不把 template 模式输出当作真实应用 CI 通过。

## 完成定义

全部项目质量命令在隔离 CI 中真实运行；失败能阻塞合并；报告和 evidence 绑定 SHA；制品可复用到发布；权限、缓存、重试和不稳定测试受到治理。
