# 知识检索与沉淀

## 开始前检索

- 检索时间：2026-08-30
- 查询词与范围：uni-app、多端、冷启动、401、生命周期、客户端安全、NestJS、Prisma/TypeORM、MySQL、Redis、RabbitMQ、OpenAPI、CI、可观测性。
- 使用命令或方式：`rg -i` 检索 `.harness/knowledge`、Wiki 和旧代码。
- 命中的知识 ID：KB-INBOX-002、003、004、006、007、008、009、010、011。
- 适用性判断：全部为 inbox/draft，只能提供风险提示和测试设计，不能作为唯一架构依据。
- 采用/不采用理由：
  - 采用 KB-INBOX-002/004/006 的目标端证据、资源清理和客户端不可信检查。
  - 采用 KB-INBOX-007/009 的事务/异步/迁移问题清单，但 ORM 方案仍需当前代码和官方资料验证。
  - 采用 KB-INBOX-008/010/011 设计契约、观测和高影响自动化 Gate。
  - KB-INBOX-003 仅在正式登录/刷新会话设计后适用。

## 2026-09-05 小程序胶囊避让修复

- 查询词与范围：`uni-app/微信小程序/自定义导航/胶囊按钮/getMenuButtonBoundingClientRect/status-bar/safe-area`；范围为 `.harness/knowledge`、`.harness/wiki`、历史移动端 Changes 与 `apps/mobile/src`。
- 命中的知识 ID：`KB-INBOX-002`（draft）。
- 适用性判断：直接适用其“宿主能力检测、平台分支集中、H5 构建不能替代小程序证据”原则；具体布局以当前 `uni.getMenuButtonBoundingClientRect()` 类型声明和页面代码验证为准。
- 采用方式：在 `AppShell` 统一读取微信胶囊底部坐标并通过 CSS 变量传递给页面内容；非微信端保留 `--status-bar-height` 回退，不在各页面散落平台判断。
- 目标端证据：微信小程序开发构建已启动并输出到 `apps/mobile/dist/dev/mp-weixin`；真机/开发者工具截图仍待人工验收。

## 过程中发现

## 2026-09-05 GitHub Actions 部署脚手架

- 查询词与范围：GitHub Actions、GHCR、Docker Compose、Ubuntu、SSH、Prisma migration、health check；范围为仓库工作流、Docker 配置、部署 Runbook、`deploy-verify` Skill 与 KB-SOL-001。
- 采用方式：使用不可变提交 SHA 镜像推送到 GHCR；服务器端只通过 SSH 拉取镜像、执行 Prisma migration、启动 Compose 并检查 `/v1/health`；MySQL 不暴露公网端口；SSH 主机密钥固定在 `DEPLOY_KNOWN_HOSTS`。
- 边界与证据：本次完成的是工作流与部署配置，已通过 `docker compose -f compose.prod.yaml config` 和 `git diff --check` 静态校验；未执行 GitHub 线上工作流、生产发布或生产数据迁移。域名/TLS、GitHub Environment 审批、SSH Secret 和生产环境变量仍待配置。

- 新问题：Harness `new-change.ps1` 以 UTF-8 无 BOM 保存时，被 Windows PowerShell 5 误解码并解析失败；PowerShell 7 正常。
- 是否满足强制沉淀条件：若第二次出现或修复脚本兼容性，应沉淀为 Windows Runbook/Skill 修复。
- 2026-08-30 Gate 后复检词：Prisma、TypeORM、认证、RBAC、Admin、typecheck、CI、Redis、RabbitMQ。
- 适用性：继续将 KB-INBOX-003/007/008/011 作为待验证检查清单；不因其 draft 状态直接复制方案。
- 架构批准触发 `knowledge-capture`，新增并验证 ADR-006，记录保留 Prisma 和条件引入基础设施的项目决策。

## 完成时沉淀

- 新增/更新知识 ID：ADR-006
- 知识状态与验证证据：verified；证据为用户 Gate 批准和当前代码/锁文件/Prisma Migration 基线，不代表未来 Redis/MQ 实现已验证。
- Wiki 同步项：已将项目实际技术栈、接口、数据、权限和部署现状写入项目 Wiki。
- 无需沉淀时的理由：Change 尚未完成。

