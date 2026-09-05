# 技术设计（推荐，待子 Change Gate）

## 数据与认证

- Prisma 模型：`AdminUser`、`AdminRole`、`AdminPermission`、`AdminUserRole`、`AdminRolePermission`、`AdminSession`。
- username 唯一、状态 active/disabled；密码使用 Node `crypto.scrypt` + 随机 salt + 版本化参数，比较使用 constant-time。
- session token 使用 `crypto.randomBytes(32)`；Cookie 保存明文随机 token，数据库只保存 SHA-256 hash、adminUserId、csrfHash、idle/absolute expiry、revokedAt、lastSeenAt。
- 不使用 JWT/localStorage，不引入 Redis；当前规模下 MySQL 会话可撤销且与批准架构一致。

## HTTP 与 CSRF

- `POST /v1/admin/auth/login`、`POST /logout`、`GET /session`。
- Cookie 名 `admin_session`，生产 `HttpOnly; Secure; SameSite=Lax; Path=/v1/admin`。
- `GET /session` 返回主体、权限和与会话绑定的短期 CSRF token；写请求发送 `X-CSRF-Token` 并校验 Origin。
- 认证失败 401、授权失败 403、CSRF 失败 403；公开错误不泄漏内部原因。

## RBAC/Policy

- 全局 Admin Guard：除了显式 `@Public()` 登录端点，其余 `/admin` 默认拒绝。
- `@RequirePermissions(...)` 声明功能权限，Policy 再检查资源状态/所有权。
- 推荐角色：super_admin、operator、content_reviewer、analyst；权限沿用当前业务动作并新增 `system:write`。

## Admin 前端

- `auth` store 只保存当前主体/权限/CSRF 于内存；HttpOnly session 不可被 JS 读取。
- axios `withCredentials`；401 单次清理并跳登录，不自动重放写请求；403 显示权限拒绝。
- 登录页与 AdminLayout 分离；路由 meta 权限只改善 UX，不作为安全边界。

## 审计与 bootstrap

- request context 提供 adminUserId/requestId；Application 层写入 AuditLog，不信任客户端 actor。
- 一次性 bootstrap CLI 从环境读取 username/password，已有 super_admin 时默认拒绝；命令与日志不回显密码。

## 迁移与回滚

- Prisma Migration 只新增表/索引和可空 actor 字段；先部署兼容 schema，再启用 Guard。
- 回滚应用可保留新增表；不得通过删除安全表回退到公开写接口。故障时只允许受控维护窗口，不允许永久旁路 Guard。

## 备选方案

| 方案 | 优点 | 风险 | 结论 |
|---|---|---|---|
| JWT 存 localStorage | 简单 | XSS 后难撤销、长期凭证暴露 | 不采用 |
| MySQL 不透明会话 Cookie | 可撤销、无新基础设施 | 每请求查会话，需要索引/缓存评估 | 推荐 |
| Redis Session | 高吞吐 | 当前无 Redis，扩大运维 | 暂不采用，容量证据出现后重评 |
