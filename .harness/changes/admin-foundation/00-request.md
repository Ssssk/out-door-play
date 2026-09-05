# CHG-ADMIN-FOUNDATION-001 管理端认证与权限基础

## 来源与目标

- 来源：父 Change 已批准“管理端独立认证、RBAC、资源授权和审计”；安全评审确认当前 Admin API 无 Guard。
- 目标：在不引入 Redis 的前提下，为 Vue Admin 与 NestJS Admin API 建立可撤销会话、默认拒绝 RBAC、CSRF 防护和可信审计主体。

## 当前事实

- Admin SPA 直接调用 `/v1/admin/**`，没有登录页、会话 store 或路由保护。
- API 提供路线、榜单、城市、油价、用户、UGC、报表等敏感读写，无 Guard/Policy。
- `/v1/me/permissions` 返回固定 operator 权限，不代表真实主体。
- MySQL 已有 `AuditLog`，但 actor 可信度不足。

## 范围

- 包含：管理员账号、密码哈希、会话、登录/退出/当前会话 API、RBAC/Policy、CSRF、Admin 登录页与请求层、审计 actor、401/403/越权测试。
- 不包含：移动端微信登录、SSO/MFA、组织多租户、生产发布、Redis Session、普通业务页面重做。

## 成功信号

- 未登录访问 Admin API 返回 401；低权限动作返回 403；授权角色只能执行映射权限。
- 会话可过期、撤销、退出；数据库只保存 token hash，不保存明文会话。
- 所有管理写操作记录可信 actor、动作、资源和脱敏 before/after。
- Admin 登录/退出、刷新恢复和权限菜单有自动化测试。
