# 后端领域设计

## 受影响模块和聚合

- `AdminIdentity`：AdminUser 为聚合根，拥有角色分配和密码/状态生命周期。
- `AdminSession`：服务端可撤销会话，token 明文只存在于 Cookie，持久层只存摘要。
- `Authorization`：Role 聚合权限，Guard 默认拒绝，Controller 只声明所需权限。
- `AuditLog`：可信 actor 来自已认证请求上下文，不接收客户端 operator。

## 用例输入/输出

- 登录：username/password -> HttpOnly Cookie + actor/permissions/csrfToken。
- 查询会话：Cookie -> actor/permissions/旋转后的 csrfToken。
- 退出：Cookie + CSRF + Origin -> 服务端撤销并清 Cookie。
- Admin 业务 API：有效 session + permission (+ 写请求 CSRF/Origin) -> 业务结果或 401/403。

## 业务不变量和状态转换

- `disabled` 管理员不能建立或继续使用会话。
- 5 次连续失败锁定 15 分钟；成功登录清零。用户名不存在也执行一次 scrypt，避免明显时序枚举。
- 会话空闲 2 小时、绝对 12 小时；任一过期或 `revokedAt != null` 均无效。
- 角色是权限集合；授权判断只依据规范化权限码。
- 任何写请求必须同时满足认证、权限、Origin 与 CSRF。

## Repository/服务端口

- 当前使用 `PrismaService` 作为基础设施端口；认证领域逻辑集中在 `AdminAuthService`。
- 时间、随机值和摘要封装为纯函数/可注入边界，单元测试不依赖真实 Cookie 或数据库。

## 事务、并发和幂等

- 登录创建会话与失败计数更新使用数据库原子 update/create。
- session token hash、username、role code、permission code 均唯一。
- 路线动作继续使用 `actionId` 幂等；审计 actor 改为请求上下文管理员。
- `lastSeenAt/idleExpiresAt` 滑动刷新最多每 5 分钟一次，避免每请求写库。

## 领域事件

- 本阶段不发布 MQ 事件；登录、退出、授权拒绝和业务写操作写结构化安全/审计日志。

