# 验收标准

### AC-AUTH-001 登录与枚举防护

- GIVEN 有效/无效账号，WHEN 登录，THEN 有效账号建立会话；无效用户名和密码返回相同公开错误，日志不含密码。

### AC-SESSION-001 生命周期

- GIVEN 有效、退出、撤销、空闲过期和绝对过期会话，WHEN 访问受保护 API，THEN 仅有效会话成功，其余返回 401。

### AC-RBAC-001 默认拒绝

- GIVEN 匿名、analyst、reviewer、operator、super_admin，WHEN 调用读写/审核/系统配置 API，THEN 仅显式权限允许，其他返回 401/403。

### AC-CSRF-001 CSRF

- GIVEN Cookie 会话，WHEN 写请求缺失/伪造 CSRF 或 Origin 不允许，THEN 返回 403 且无数据变化。

### AC-AUDIT-001 审计

- GIVEN 授权写操作成功或业务拒绝，WHEN 查询审计记录，THEN actor/action/resource/requestId/result 可追踪且敏感字段脱敏。

### AC-UI-001 前端会话

- GIVEN 冷启动、会话有效/过期、无权限，WHEN 访问 Admin 路由，THEN 正确恢复、跳转登录或显示权限拒绝，不发生无限 401 重放。
