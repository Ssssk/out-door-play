# 数据迁移计划

## Schema 与数据变化

- 新增 `admin_users`：管理员身份、版本化密码哈希、状态、失败次数、临时锁定时间。
- 新增 `admin_roles`、`admin_permissions`、`admin_user_roles`、`admin_role_permissions`：显式 RBAC，不把角色名写死为授权结论。
- 新增 `admin_sessions`：只保存 session token 的 SHA-256、CSRF token 的 SHA-256、空闲/绝对过期与撤销时间。
- 兼容扩展 `audit_logs`：保留现有 `operator/discovery_id`，新增可空 `admin_user_id/resource_type/resource_id/reason/request_id/result`。
- 不改动移动端用户表，不引入 Redis、JWT 或 MQ。

## 数据规模和锁影响

- 所有认证/RBAC 表均为新表，不扫描现有业务大表。
- `audit_logs` 只新增可空列和普通索引；MySQL 8 仍可能在 DDL 期间持有 metadata lock，生产执行前检查长事务。
- 当前本地数据量很小；生产按 `information_schema.tables` 的实际行数和数据量重新评估执行窗口。

## Expand / Migrate / Contract 步骤

1. Expand：部署新增表、索引和 `audit_logs` 可空列；旧应用仍可运行。
2. Bootstrap：通过一次性 CLI 从环境变量创建首个 `super_admin`，密码不进入命令行参数、日志或 seed。
3. Enable：部署 Guard、认证 API 和 Admin 登录页；验证匿名请求默认 401。
4. Reconcile：核对角色/权限种子、活跃管理员、有效会话和审计 actor 覆盖率。
5. Contract：本 Change 不删除旧 `operator` 字段；待审计消费者迁移完成后另立 Change。

## 校验 SQL/指标

```sql
SELECT COUNT(*) FROM admin_users WHERE status = 'active';
SELECT r.code, COUNT(rp.permission_id) FROM admin_roles r LEFT JOIN admin_role_permissions rp ON rp.role_id = r.id GROUP BY r.code;
SELECT COUNT(*) FROM admin_sessions WHERE revoked_at IS NULL AND absolute_expires_at > NOW();
SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL 1 DAY AND request_id IS NULL;
```

- 登录成功/失败计数、401/403 比例、会话创建/撤销、CSRF 拒绝、审计写入失败均需可观测。

## 回滚或前向修复

- 应用回滚可保留新增表和可空列；不允许通过关闭 Guard 恢复公开 Admin 写接口。
- migration 已执行后不做生产 `DROP TABLE` 回滚；采用前向修复。
- 如认证故障，进入受控维护窗口，通过 bootstrap CLI 恢复管理员或撤销异常会话。
- 如 schema 部署失败，在应用启用 Guard 前停止发布并修复 DDL；不得部分启用认证。

## 演练结果

- 2026-08-30 本地 MySQL 8.4 `chumen_local`：migration `20260830220000_admin_auth_foundation` 首次 deploy 成功。
- 重复 `prisma migrate deploy`：`No pending migrations to apply`；`prisma migrate status`：schema up to date。
- Prisma `format`、`validate`、`generate`：通过。
- 真实 HTTP：登录、session、Admin read、CSRF/Origin 拒绝、报表创建/删除、logout、撤销后 401 通过。
- 审计查询：3/3 success，3/3 requestId 命中；session 1/1 revoked。
- 测试管理员及关联审计/会话、临时报表已清理为 0；角色/权限基线保留。
- 尚待 CI 空库演练和生产数据规模/metadata lock 评估。

