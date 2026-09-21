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

## 2026-09-06 测试服务器部署、数据同步与 HTTP 登录回跳

- 查询词与范围：Docker Compose、GitHub Actions、Ubuntu、Nginx、Prisma Migration、MySQL data-only dump、逐表对账、管理员 Secure Cookie、HTTP 登录回跳；范围为部署配置、API 管理员认证代码、远端验证结果和历史知识。
- 新增知识：`KB-SOL-002`（verified），记录 HTTP 测试环境因 Secure Cookie 导致登录后回跳的机制、修复、安全边界和提交 `33de0ec` 验证证据。
- 新增知识：`KB-INBOX-012`（draft），记录用户决定的后续固定顺序：本地 Docker Gate 通过后再 push/部署，数据同步保持显式手动、备份和逐表精确对账。
- 状态理由：远端 Docker 部署、空库数据同步和 Cookie 修复已实际执行；新的 local-first 全链路尚未按 Runbook 完整执行，因此不得提前标记 verified。
- 证据：`evidence/2026-09-06-test-server-deployment.md`。
- 敏感信息处理：知识与证据未保存公网账号、密码、私钥、数据库 Secret 或完整业务数据。

## 2026-09-06 微信小程序体验版 GitHub Actions

- 查询词与范围：`uni-app/微信小程序/miniprogram-ci/GitHub Actions/上传私钥/IP 白名单/体验二维码`；范围为移动端构建、现有 CI、部署 Wiki、`ci-quality-gate`、`deploy-verify` 和 `KB-INBOX-011/012`。
- 采用方式：小程序链路与服务器 Docker 部署解耦；只监听 `main` 移动端相关路径，使用最小 `contents: read` 权限、隔离上传工具目录、Repository Secret 注入私钥、Repository Variables 注入公开配置，并保存当次二维码 Artifact。

## 2026-09-06 按组件串行执行发布 CI

- 查询词与范围：`GitHub Actions/path filter/reusable workflow/needs/组件 CI 顺序`；范围为新增 `ci-component-release.yml`、`tools/ci/changed-components.mjs`、小程序可复用工作流和现有生产部署工作流。
- 采用方式：提交路径检测器将 API、管理 Web、小程序和共享文件映射为布尔输出；Job 使用显式 `needs` 和 `always()` 条件处理被跳过的前置 Job，顺序固定为 API → 管理 Web → 小程序。共享依赖、Compose 与编排工作流变更按全组件运行。
- 适用边界：自动工作流执行组件质量门禁和小程序体验版上传，不自动执行生产服务器部署；生产部署仍需要独立手动工作流、发布 Gate 和回滚条件。
- 经验与修正：首次真实运行发现可复用工作流的 `actions: read` 权限需要由调用工作流显式授予；随后发现 Docker Buildx 默认 driver 不支持 GHA cache，补充 `docker/setup-buildx-action` 后通过。后端 CI 还需非生产 Prisma URL 才能执行 `prisma generate`。
- 验证状态：verified；真实运行 `34037029052` 中 API CI 2m46s 成功、管理 Web CI 随后 3m19s 成功、小程序构建 46s 后上传 3m24s 成功并生成体验二维码。

## 2026-09-06 微信发布备注中文化

- 查询词与范围：`微信体验版/发布备注/Conventional Commit/中文摘要`；范围为 `tools/miniprogram-ci/describe-change.mjs`、其测试和组件发布工作流。
- 采用方式：提交类型和已知英文摘要映射为中文；未知英文摘要降级为中文类型；组件范围统一使用中文标签，保留 128 字符上限。
- 适用边界：这是仓库内发布工具行为，不依赖某个 AI Agent 的 Skill；任何触发同一工作流的提交都会使用该规则。它只影响微信体验版备注，不改变生产部署权限。
- 验证状态：verified；本地 4 项测试和 Harness/密钥检查通过，真实运行 `34038401292` 验证后端、管理端跳过，小程序构建和上传成功，日志备注为 `发布流程调整：发布备注统一使用中文（发布流程）`。

## 2026-09-06 本地插件与远程体验版去重边界

- 查询词与范围：`微信开发者工具 CLI/本地插件/GitHub Actions/体验版/重复上传/提交标记`；范围为 `auto-work-tools` 本地发布服务、`.github/workflows/ci-component-release.yml` 和部署 Wiki。
- 结论：本地插件记录保存在开发机，GitHub Runner 无法读取，因此没有额外约定时，同一份代码先经插件上传、再 push 到 `main` 仍会再次触发远程小程序体验版 Job。
- 采用方式：提交说明包含 `[skip-miniprogram-experience]` 时，仅跳过本次小程序体验版 Job；后端和管理 Web 仍按组件路径执行。该标记只用于已确认本地插件完成同一份代码上传的场景，默认不改变自动体验版发布。
- 验证边界：本地工作流静态检查和组件测试可验证条件存在；真实带标记的 GitHub Actions 运行尚未执行，不能把该标记写成已在线验证。

## 2026-09-08 本地插件双交付流程

- 查询词与范围：`浏览器插件/Git push/组件 CI/小程序路径/体验版去重/提交快照`；范围为 `auto-work-tools` v1.12.0、仓库 `.mini-publisher.json`、中央组件工作流和既有去重标记约定。
- 采用方式：插件提供普通 push 与“本地上传后 push”两个主入口；先 fetch 并检查快进关系，再计算远程基线至 HEAD 加工作区的完整待推送文件。只有组合模式命中 `mobilePaths` 时才给提交附加去重标记，并要求本地上传成功以及上传后 HEAD/工作区未变化后才能 push。
- 安全边界：插件会对当前仓库执行 `git add --all` 和 `git commit`，因此确认框必须明确“全部未提交改动”；禁止自动 pull、rebase 和 force push。上传失败后可能留下未推送的本地提交，重试时继续以远程基线判断，不伪装成已交付。
- 验证状态：verified（本地逻辑）；`auto-work-tools` 25 项测试通过，其中两项使用临时 bare Git 远程分别验证普通推送和“小程序上传成功 → 带标记非强制 push”的完整顺序。真实项目 push、GitHub Actions run 和用户插件 UI 验收尚未执行。

## 2026-09-06 微信上传固定出口 Runner

- 查询词与范围：`self-hosted Runner/固定出口/IP 白名单/非 root/systemd hardening/metadata/Secret 清理`；范围为 `ci-quality-gate`、`supply-chain-security`、`operational-readiness`、`deploy-verify`、`KB-INBOX-011`、当前 workflow 与测试服务器运行事实。
- 采用方式：构建仍留在 GitHub-hosted Runner；固定出口 Runner 仅处理无密钥 payload 与微信上传，避免在应用服务器重跑完整 workspace 构建。Runner 使用专用非 root 账号、不授予 Docker 权限，并通过 systemd 禁止访问应用目录和 link-local metadata。
- 适用边界：该方案解决微信上传密钥 IP 白名单，不解决小程序 `request` 合法域名、ICP备案或 HTTPS；真实上传仍需管理员维护固定出口白名单并保留失败阻断。
- 安全发现：微信官方 `miniprogram-ci@2.1.31` 的隔离锁文件在 2026-09-06 通过 npm 官方审计端点发现大量历史传递依赖风险；在安全 Owner 明确接受或提供更安全替代前，不把这次依赖审计写成 Security Gate passed。
- 运行验证：GitHub Actions run `34034184969` 从固定 Runner 调用微信接口并得到 `invalid ip: 124.223.220.242`，证明固定出口路由生效；失败路径必须显式退出第三方 SDK 遗留的编译子进程，才能及时进入 `always()` 密钥清理步骤。该修复已在同一 run 中验证上传步骤 19 秒失败、清理步骤 1 秒完成，远端无 payload、私钥目录或编译进程残留。
- 发布边界：自动化只上传开发版本并生成体验预览二维码，不自动提交审核或发布正式线上版本；当前 HTTP/IP API 也不构成真机体验可用性证据。


## 2026-09-20 实时附近 POI 检索
检索词：加油/fuel/腾讯/POI/定位，范围 knowledge、wiki、changes。未发现适用于实时加油站检索的 verified 知识；当前旧同步设计不适用用户新指令。核对腾讯官方地点搜索文档：nearby 纬度在前、半径 10–1000m、可自动扩展、每页20条、总计最多200条、越界返回末页。采用这些边界作为回归用例。

## 2026-09-22 API 运行时依赖生产事故

- 查询词与范围：`NestJS/Express/pnpm/运行时依赖/Docker/healthcheck/Compose/生产不可用`；范围为知识索引、部署 Wiki、生产容器状态、故障日志、最近提交和 CI/部署脚本。
- 结论：提交 `b063fc2` 直接导入未声明的 `express`，pnpm 严格隔离下生产运行时报 `Cannot find module 'express'`；API 重启阻塞依赖其健康状态的 Web 容器，形成整站 TLS/网络失败。
- 采用方式：保留头像本地静态目录需求，改用 Nest HTTP 适配器注册；镜像切换前执行编译产物运行时加载检查，生产只切换 API 镜像并保留回滚制品。
- 验证状态：verified；修复提交 `3eda51a`，API 91 项测试及类型、契约、构建通过，生产 API healthy、restart 0，公网核心只读接口通过。
- 新增知识：`KB-INC-001`；详细证据：`evidence/2026-09-22-express-runtime-outage.md`。
