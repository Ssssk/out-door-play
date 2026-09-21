---
id: KB-INC-001
title: API 直接引用未声明运行时依赖导致生产不可用
type: incident
status: verified
scope: [backend, deployment, production-availability]
stack: [nestjs, pnpm, docker, nginx]
tags: [runtime-dependency, express, healthcheck, compose, outage]
owner: 用户（项目负责人）
last_verified: 2026-09-22
related_changes: [CHG-OUTDOOR-V110-001]
---

# 事故摘要与影响

2026-09-22 部署提交 `b063fc27752137fd2acf231ac72e6a14e543467f` 后，生产 API 容器因缺少可直接解析的 `express` 运行时依赖持续重启。Web 容器依赖 API 健康状态，停留在 `Created`，80/443 无监听，移动端城市、天气、路线、油价等请求在 TLS/网络阶段失败。

# 时间线

- 约 00:09：服务器完成故障版本 API 镜像构建；API 随后进入重启循环。
- 00:37：只读诊断确认 80/443 无监听、API 容器持续重启。
- 00:47：永久修复提交 `3eda51a53a8777de49a683c8564c22a6c8ea5ad8` 推送到 `main`。
- 00:53：服务器完成该 SHA 的 API 镜像构建和隔离运行时加载验证。
- 00:56：生产切换完成，API/MySQL 健康，Web 恢复监听 80/443。

# 发现、止损与恢复

先通过公网 TLS、服务器监听端口、Compose 状态和容器末尾日志确认故障边界，未修改数据库。恢复前备份生产环境文件，保留上一版 API/Web 镜像，只切换 `API_IMAGE`，由 Compose 在 API 健康后启动原 Web 镜像。生产写操作需由项目负责人针对目标环境明确授权。

# 根本原因与促成因素

头像上传功能新增 `import express from 'express'`，但 `apps/api/package.json` 只通过 `@nestjs/platform-express` 间接获得 Express，未声明可供业务代码直接解析的运行时依赖。pnpm 严格依赖隔离下，TypeScript 编译可以使用 `@types/express` 通过，但生产 Node.js 加载 `dist/setup-application.js` 时抛出 `Cannot find module 'express'`。

静态上传目录功能本身仍必要；修复改为调用 Nest HTTP 适配器的 `useStaticAssets`，不再由业务启动代码直接依赖 Express 包。

# 监控和流程为何未提前发现

现有门禁验证了类型、单元、契约、Nest 构建和 Docker 镜像构建，但没有在镜像内加载生产编译产物或启动容器。部署流程在新 API 健康前已重建服务，API 失败又阻塞 Web 启动，扩大为整站不可用。

# 修复与防复发任务

- 已新增 `setup-application.spec.ts`，验证静态目录经 Nest HTTP 适配器注册。
- 已在隔离生产镜像中执行编译产物运行时加载检查。
- 后续应把镜像内运行时加载/启动冒烟加入后端 CI，并调整部署顺序，确保新 API 健康前保留旧 Web/API 可服务实例。
- 后续应为本地上传目录增加持久卷或迁移到批准的对象存储；当前容器重建会丢失未持久化文件。

# 验证证据

- 代码与测试：提交 `3eda51a53a8777de49a683c8564c22a6c8ea5ad8`；API 17 个测试文件、91 项测试通过，类型检查、18 个 OpenAPI 操作契约、构建、格式、Lint、Secret 扫描和 Harness 校验通过。
- 镜像：`chumen-api:3eda51a53a8777de49a683c8564c22a6c8ea5ad8`，镜像 ID `sha256:9e76c5d1dd352220f2b21f1cfacc65bb79e225fd6d047c73cc177cc5063e3f8e`。
- 生产：API health 为 `healthy`、restart count 为 0；公网健康、城市、天气、路线与附近加油站请求返回业务成功码。
- 详细记录：`.harness/changes/prd-v1-1-rebuild/evidence/2026-09-22-express-runtime-outage.md`。

# 残余风险

正式监控、自动回滚和零停机部署尚未建立；本次验证不能替代完整 Operations Gate。微信公众平台 request 合法域名和真机验证仍保持原有 pending 状态。

# 关联 Change、Runbook 与知识

- `CHG-OUTDOOR-V110-001`
- `KB-INBOX-011`
- `KB-INBOX-012`
