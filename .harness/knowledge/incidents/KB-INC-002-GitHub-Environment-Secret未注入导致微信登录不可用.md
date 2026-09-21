---
id: KB-INC-002
title: GitHub Environment Secret 未被工作流消费导致微信登录不可用
type: incident
status: draft
scope: [authentication, ci, deployment, production-availability]
stack: [github-actions, docker-compose, nestjs, wechat]
tags: [environment-secret, secret-injection, wechat-login, code2session, auth-provider-unavailable]
owner: 用户（项目负责人）
last_verified: null
related_changes: [CHG-OUTDOOR-V110-001, CHG-MOBILE-IDENTITY-001]
---

# 事故摘要与影响

2026-09-22，微信小程序调用 `POST /v1/auth/wechat/login` 返回 HTTP 503 和稳定错误码 `AUTH_PROVIDER_UNAVAILABLE`。GitHub `production` Environment 中已存在 `WECHAT_APP_ID`、`WECHAT_APP_SECRET`，但已部署 API 容器中的同名配置为空，因此微信登录不可用；公开只读接口不受影响。

# 已确认事实

- `WechatIdentityProvider` 在任一配置为空时 fail closed，返回 503。
- `compose.prod.yaml` 已显式把两项配置传入 API 容器。
- 故障时服务器部署环境文件中的两项配置为空；检查仅记录存在性，不记录值。
- `.github/workflows/deploy-production.yml` 的 `deploy` Job 使用 `environment: production`，但原工作流只读取 `DEPLOY_ENV_FILE` 和腾讯地图相关 Secret，没有引用两个独立的微信 Secret。

# 根本原因

GitHub Environment Secret 不会因名称与应用环境变量相同而自动注入 Job、远端环境文件或容器。原工作流缺少 `${{ secrets.WECHAT_APP_ID }}`、`${{ secrets.WECHAT_APP_SECRET }}` 映射，也没有部署前非空校验，所以 Environment 页面显示 Secret 已配置，但部署产物仍保留空值。

# 永久修复与防复发

- 修复提交 `e8255ff2f992ce092b0894138f4548d06f1097aa` 显式读取两个 Environment Secret，非空校验后替换 `DEPLOY_ENV_FILE` 中可能存在的旧值。
- 不打印 Secret；最终环境文件仍以 `0600` 权限写入服务器。
- 新增工作流防回归测试，验证 Secret 映射、非空检查、旧值清理和不直接输出变量。
- 新增部署后认证冒烟：使用无效一次性 code，必须得到 HTTP 401 / `AUTH_CODE_INVALID`；若仍为 503，则部署失败。

# 验证状态

本地工作流测试、组件测试/构建、Secret 扫描、Harness 和 Compose 配置校验已通过。生产部署和真实微信登录尚未执行，因此本记录保持 `draft`；只有目标环境完成部署、配置存在性核验和认证冒烟后才能改为 `verified`。

# 适用边界

适用于 GitHub Actions Environment 中以独立 Secret 保存配置、工作流再生成远端 `.env` 的部署模式。若改用 OIDC/托管 Secret Provider 或服务器端直接拉取配置，应重新设计并验证，不应照搬字符串拼接步骤。

# 敏感信息边界

事故证据、测试和知识记录只保存 Secret 名称与存在性，不保存值、长度、哈希或平台返回的敏感身份数据。生产配置或部署操作仍需独立授权和发布 Gate。

# 关联证据

- `.harness/changes/prd-v1-1-rebuild/evidence/2026-09-22-wechat-secret-injection.md`
- `.github/workflows/deploy-production.yml`
- `tools/ci/deploy-production.test.mjs`
