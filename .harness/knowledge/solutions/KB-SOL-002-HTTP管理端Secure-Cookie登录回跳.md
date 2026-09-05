---
id: KB-SOL-002
title: HTTP 测试环境管理端因 Secure Cookie 登录后回跳
type: solution
status: verified
scope: [backend, authentication, deployment, test-environment]
stack: [nestjs, express, docker, nginx, browser]
tags: [admin-login, secure-cookie, http, https, redirect-loop, ADMIN_COOKIE_SECURE]
owner: 用户（项目负责人）
last_verified: 2026-09-06
related_changes: [CHG-OUTDOOR-V110-001]
---

# 现象与影响

管理端登录接口接受正确账号密码并返回成功，但浏览器随后又跳回 `/login`。这会让操作者误以为管理员账号、密码或数据库数据错误。

# 环境与触发条件

- 管理端通过未启用 TLS 的 HTTP 测试地址访问。
- API 容器使用 `NODE_ENV=production`。
- 管理员会话依赖 `admin_session` HttpOnly Cookie。
- 修复前 Cookie 的 `secure` 只由 `NODE_ENV === 'production'` 决定。

# 排查过程与证据

1. 远端 `admin_users`、角色和权限记录存在，排除账号未创建。
2. `POST /v1/admin/auth/login` 返回 HTTP 200，排除密码校验失败。
3. 修复前代码在 production 模式无条件设置 `Secure`；HTTP 页面不会在后续请求中携带该 Cookie。
4. 修复提交 `33de0ec` 部署为 `chumen-api:33de0ec` 后，登录接口仍返回 200，响应 Cookie 保留 `HttpOnly`、路径 `/v1/admin`，且测试环境不再带 `Secure`。

# 根本原因

`Secure` Cookie 只能通过 HTTPS 传输。测试服务器暂时使用 HTTP，但 API 又按 production 模式设置 Cookie，导致登录响应虽然成功，后续 session 请求收不到会话 Cookie，前端路由守卫因此再次跳回登录页。

# 解决方法

## 临时止损

在已授权、无真实用户的 HTTP 测试环境中，显式设置 `ADMIN_COOKIE_SECURE=false` 并重启 API。不得通过关闭鉴权、保存 Token 到浏览器脚本存储或把 `NODE_ENV` 改为 development 来绕过问题。

## 永久修复

- `AdminAuthController` 支持显式读取 `ADMIN_COOKIE_SECURE`。
- 未设置该变量时仍保持原策略：production 默认 `true`，非 production 默认 `false`。
- `compose.prod.yaml` 默认 `ADMIN_COOKIE_SECURE=true`，只有 HTTP 测试环境在 Secret/环境文件中显式覆盖为 `false`。
- 配置域名与 HTTPS 后删除测试覆盖或恢复为 `true`。

# 无效方法及原因

- 反复输入账号密码：登录本身已经成功，不能修复 Cookie 传输策略。
- 只清浏览器缓存或 Cookie：可清除旧状态，但下一次响应仍会生成不可用于 HTTP 的 Secure Cookie。
- 在前端跳过 session 校验：会破坏服务端授权边界。
- 将整个 API 改为 development：会同时放宽其他生产保护，影响范围过大。

# 验证方法与结果

- API、Web、MySQL 容器均为 healthy。
- `POST /v1/admin/auth/login`：HTTP 200。
- `Set-Cookie`：存在、`HttpOnly=true`、`Path=/v1/admin`、`Secure=false`（仅测试环境）。
- 修复提交：`33de0ec fix(admin): allow explicit cookie security mode`。

# 适用边界与失效条件

仅适用于明确授权的临时 HTTP 测试服务器。域名/TLS 配置完成、环境转为预发布或生产、Cookie 策略变化后必须复核；正式环境必须使用 HTTPS 并设置 `ADMIN_COOKIE_SECURE=true`。

# 关联文件、Change 与知识

- `apps/api/src/modules/admin-auth/admin-auth.controller.ts`
- `compose.prod.yaml`
- `docs/deployment-github-actions.md`
- `CHG-OUTDOOR-V110-001`

