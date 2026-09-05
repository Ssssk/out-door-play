---
id: KB-INBOX-012
title: 本地 Docker 验证后同步 GitHub、测试服务器和 MySQL 数据
type: runbook
status: draft
scope: [local-development, ci, deployment, database, test-environment]
stack: [github-actions, docker, docker-compose, nestjs, nginx, mysql, prisma, uni-app]
tags: [local-first, docker-build, test-server, data-sync, backup, smoke-test, deployment]
owner: 用户（项目负责人）
last_verified: null
related_changes: [CHG-OUTDOOR-V110-001]
---

# 适用症状与目标

用于新会话快速恢复本项目的部署上下文，并固定执行顺序：先在本地 Docker 完成构建、迁移、启动和冒烟，再提交推送，最后部署到授权测试服务器；业务数据只在明确授权后单独同步，不能随代码 push 自动覆盖远端。

当前远端部署和一次空库数据同步已经成功验证；“完整本地 Docker Gate → GitHub Actions → 远端 → 数据对账”尚未按本 Runbook 全链路执行，因此暂时保持 `draft`。

# 权限和前置检查

- 目标只能是用户明确授权的测试服务器；生产环境需要独立发布与数据变更授权。
- 读取根 `AGENTS.md`、当前 Change、`docs/deployment-github-actions.md`、本 Runbook 和 `KB-SOL-002`。
- 确认 Git 分支、目标 SHA、工作区状态和用户已有修改；不得混入来源不明的改动。
- 确认 Docker Engine/Compose、SSH 私钥引用、固定 `known_hosts`、GitHub Secrets 和服务器磁盘空间。
- Secret、管理员密码、数据库密码、私钥和数据转储不得写入仓库或日志。
- 本地验证使用独立环境文件和独立端口；不要覆盖共享或远端数据库。

# 只读诊断步骤

1. 本地基线：`git status --short`、`git rev-parse HEAD`、`docker compose ps`。
2. 查看本地端口占用，避免与已有 8080 服务冲突；建议本地完整栈使用 `APP_PORT=18080`。
3. 查看远端容器名、状态、镜像 SHA 和端口映射，不输出容器完整环境变量。
4. 检查远端 `/v1/health`、根页面和关键只读 API。
5. 数据同步前对本地和远端逐表执行精确 `COUNT(*)`；不要依赖 InnoDB 的 `information_schema.tables.table_rows` 估算值。
6. 核对本地与远端 `_prisma_migrations` 内容和应用 schema 版本。

# 处理步骤

## A. 本地 Docker Gate

1. 从当前 SHA 构建不可变本地镜像：

   ```powershell
   $releaseSha = git rev-parse --short HEAD
   docker build -f docker/api.Dockerfile -t "chumen-api:local-$releaseSha" .
   docker build -f docker/admin.Dockerfile -t "chumen-web:local-$releaseSha" .
   ```

2. 创建不提交的本地 Docker 环境文件，至少包含 `API_IMAGE`、`WEB_IMAGE`、`APP_PORT=18080`、独立 MySQL 数据库账号、`IDENTITY_SUBJECT_HMAC_KEY`、本地 CORS/管理员来源以及 `ADMIN_COOKIE_SECURE=false`。只记录 Key，不记录 Secret 值。
3. 使用 `compose.prod.yaml` 先启动 DB，再执行 Prisma migration，最后启动完整栈：

   ```powershell
   docker compose --env-file <本地环境文件> -f compose.prod.yaml up -d db --wait
   docker compose --env-file <本地环境文件> -f compose.prod.yaml run --rm api pnpm --filter @chumen/api db:deploy
   docker compose --env-file <本地环境文件> -f compose.prod.yaml up -d --remove-orphans --wait --wait-timeout 120
   ```

4. 验证 `http://127.0.0.1:18080/`、`/v1/health`、`/v1/cities`、`/v1/routes`；需要管理端时再执行一次登录与 session 校验。
5. 任一构建、迁移、健康或核心冒烟失败，停止，不 push、不部署远端。

## B. GitHub 与测试服务器部署

1. 只提交当前任务文件，执行适用的静态检查、测试和 `git diff --check` 后 push 到 `main`。
2. 当前 `.github/workflows/deploy-production.yml` 只有 `workflow_dispatch`；普通 push 不会自动更新服务器。
3. 在 GitHub Actions 手动运行 `Deploy production`。流程会在 Runner 验证 API/Web Docker 构建，把当前 SHA 源码上传到服务器，在服务器构建 SHA 镜像，执行 `prisma migrate deploy`，再运行 Compose。
4. 远端拓扑：`chumen-web-prod:80` 经宿主机测试端口暴露；Nginx `/v1/` 转发 `chumen-api-prod:3100`；MySQL 仅容器网络 `3306`，禁止公网开放。
5. 部署后核对容器实际镜像 tag 等于目标 SHA、三个容器 healthy、HTTP 冒烟通过。

## C. 本地数据同步到测试服务器

1. 数据同步必须是显式手动步骤，不能随 push 或普通部署自动执行。
2. 若远端业务表非空，先停止并由 Owner 决定 merge、replace 或不处理；禁止直接导入造成重复键或覆盖。
3. 远端非空时必须先生成可恢复备份并验证文件存在；即使远端为空，也记录迁移版本和逐表基线计数。
4. 从本地开发 MySQL 生成 data-only dump：使用 single transaction、禁用 tablespace、保留二进制字段，排除 `_prisma_migrations`，不包含 `DROP DATABASE/TABLE`。
5. 通过固定 SSH 主机密钥传输到服务器唯一临时路径，导入远端既有 schema。
6. 导入后本地与远端对每张表执行精确 `COUNT(*)`，再验证 API 读路径和数据库健康。
7. 验证成功后删除服务器临时 dump；本地备份按数据 Owner 的保留决定处理，不提交 Git。

## D. 微信小程序

服务器 Docker 部署只更新 API 和管理端 Web，不会更新微信小程序。小程序必须单独构建、预览/上传；正式发布仍需要微信平台审核与发布 Gate。不得把小程序 CI 私钥提交到仓库。

# 停止、升级与回滚条件

- 目标环境无法确认、远端出现真实用户数据、schema/migration 不一致或备份不可用。
- 本地 Docker 未通过、目标 SHA 与镜像 tag 不一致、远端健康检查失败或磁盘不足。
- 数据行数、唯一键或抽样结果不一致；立即停止后续写入并保留证据。
- HTTP 管理端仅允许测试配置；转为 HTTPS 时必须恢复 `ADMIN_COOKIE_SECURE=true`。
- 应用回滚使用上一已验证 SHA 镜像；数据库 schema 变化优先前向修复，禁止盲目删除迁移或卷。

# 完成验证

- 本地：两个镜像构建成功、迁移成功、三容器 healthy、根页面和关键 API 200。
- GitHub：目标 SHA 已 push，手动部署 workflow 成功且日志无 Secret。
- 远端：镜像 tag、容器健康、Nginx 代理、API/database health 与目标一致。
- 数据：逐表精确计数一致，关键只读 API 返回预期数据，远端临时 dump 已清理。
- 小程序：若在范围内，单独保存目标端预览/上传证据；服务器部署不能替代该证据。

# 审计和证据

每次执行至少记录：Change/TASK、commit SHA、目标环境、镜像 tag/digest、命令、开始结束时间、退出码、健康检查、逐表计数摘要、备份位置引用和操作者。不得记录 Secret 或完整业务数据。

当前关联证据：`.harness/changes/prd-v1-1-rebuild/evidence/2026-09-06-test-server-deployment.md`。

# 失效条件与复核周期

Dockerfile、Compose、GitHub workflow、Prisma migration、端口、域名/TLS、微信发布方式或服务器拓扑变化后立即复核。首次完整按本 Runbook 执行成功并保存证据后，评估移入 `runbooks/` 并升级为 `verified`。

