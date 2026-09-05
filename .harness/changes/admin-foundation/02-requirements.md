# 需求规格

### FR-AUTH-001 管理员认证与会话

- 管理员使用 username/password 登录；密码只保存版本化自适应哈希。
- 成功后使用 HttpOnly Cookie 承载随机不透明 session token；数据库只保存 token SHA-256 hash。
- 登录失败使用统一错误，避免账号枚举；连续失败和端点调用必须限流。

### FR-SESSION-001 会话生命周期

- 支持当前会话查询、退出、服务端撤销、空闲过期和绝对过期。
- 禁用管理员、密码重置或角色高危变化时撤销其全部会话。

### FR-RBAC-001 默认拒绝授权

- 所有 `/v1/admin/**` 默认要求认证和权限；权限由服务端 Guard/Policy 判定。
- 角色只作为权限集合，敏感资源仍执行资源/状态策略；前端隐藏按钮不构成授权。

### FR-CSRF-001 写请求保护

- Cookie 会话的 POST/PATCH/PUT/DELETE 必须校验与 session 绑定的 CSRF token 和 Origin。

### FR-AUDIT-001 可信审计

- 管理写操作记录 adminUserId、action、resource、reason、requestId、脱敏 before/after、时间和结果。

### FR-ADMINUI-001 Admin 登录与权限 UX

- 提供登录、退出、会话恢复、过期跳转、权限菜单与 401/403 安全提示；请求使用 credentials 和 CSRF header。

### NFR-SECURITY-001 安全与隐私

- Cookie 在生产为 Secure、HttpOnly、SameSite=Lax；日志不记录密码、Cookie、CSRF 或完整认证头。
- 无默认密码、无客户端 Secret、无明文 session token 存储。

### NFR-TRACE-001 可追踪

- 每个认证/授权决策和审计事件携带 requestId；测试覆盖匿名、低权限、他人资源和管理员边界。

## 非目标

- 本 Change 不实现移动端身份、MFA、第三方 SSO、Redis 或 RabbitMQ。
