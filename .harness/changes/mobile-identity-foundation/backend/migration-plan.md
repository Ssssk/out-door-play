# 数据迁移计划（Prisma 7）

> 仓库 Skill 中的 TypeORM 术语被更高优先级的已批准 `ADR-006` 覆盖；本 Change 只使用 Prisma schema 与版本化 Prisma Migration。

## Schema 与数据变化

- 新增枚举 `IdentityProvider { wechat, dev }`。
- 新增 `user_identities`：`id varchar(64)`、`user_id varchar(64)`、`provider enum`、`provider_subject_hash char(64)`、时间字段；外键 User cascade；唯一 `(provider, provider_subject_hash)`，索引 `user_id`。
- 新增 `mobile_sessions`：`id/user_id`、`access_token_hash char(64)`、`refresh_token_hash char(64)`、`access_expires_at`、`refresh_expires_at`、`revoked_at`、时间字段；两类 hash 唯一；索引 `(user_id, revoked_at)`、access/refresh expiry。
- User 增加 identities/sessions 关系字段（数据库只新增反向外键表，无 users 表列变更）。
- 不修改现有 Favorite 复合主键，不回填生产用户，不引入 Redis/MQ。

## 数据规模和锁影响

- 两张新表初始为空，DDL 不扫描现有业务大表；`users` 仅被新外键引用。
- MySQL 8.4 创建表/索引仍需要 metadata lock；发布前检查长事务、磁盘、数据库版本与 migration 权限。
- 当前只有本地开发规模，不能外推生产执行时长。生产行数/备份/维护窗口未知，阻塞 Release Gate 而不阻塞隔离实现。

## Expand / Migrate / Contract 步骤

1. Expand：部署新枚举/表/唯一约束/索引；旧应用继续使用 users/favorites。
2. Verify：Prisma `format/validate/generate`；空库和现有库 `migrate deploy/status`；检查表/索引/外键。
3. Seed-dev：仅开发 seed 显式创建 dev identity，可选择绑定 `local-dev-user`；生产 migration/seed 不创建默认主体。
4. Enable：部署 Identity/Guard/API，再启用前端登录入口；匿名 user API 从此返回 401。
5. Observe：核对 login/refresh/401、会话增长与唯一冲突。
6. Contract：本 Change 不删除旧列/表；`POST /user/me` 的删除需后续兼容 Change。

## 校验 SQL/指标

```sql
SELECT provider, COUNT(*) FROM user_identities GROUP BY provider;
SELECT COUNT(*) FROM user_identities ui LEFT JOIN users u ON u.id = ui.user_id WHERE u.id IS NULL;
SELECT COUNT(*) FROM mobile_sessions WHERE access_token_hash = refresh_token_hash;
SELECT COUNT(*) FROM mobile_sessions WHERE revoked_at IS NULL AND refresh_expires_at > NOW();
SELECT user_id, discovery_id, COUNT(*) FROM favorites GROUP BY user_id, discovery_id HAVING COUNT(*) > 1;
```

- 额外验证：hash 均为 64 hex；无明文 token/OpenID/session_key 列；重复 refresh 只有一次更新；封禁用户会话不可认证。

## 回滚或前向修复

- 应用回滚可保留 additive 表；不得恢复固定 `local-dev-user` 或匿名写接口。
- 认证异常时关闭前端入口并撤销所有移动 session，公开发现继续只读可用；修复后要求重新登录。
- migration 已在生产执行后不通过 drop 新表回滚；采用前向修复。删除身份表会破坏账号映射，必须另行批准和备份。
- 如果 DDL 在启用 Guard 前失败，停止启用并修复；不得部分开放登录。

## 演练结果

- 2026-09-01 首次尝试：`not-run/blocked`，当时 Docker Desktop 引擎未就绪，`127.0.0.1:3307` 无 MySQL 监听。
- 2026-09-05 最终演练：本地隔离 MySQL 8.4 已恢复；空库首次 `prisma migrate deploy` 与重复 deploy 均通过，5 个 migration 全部生效且无 pending。
- 同一隔离库中的 20 路 refresh、双账号资料/收藏隔离、10 路并发收藏幂等及 Admin session 回归通过；测试结束后容器已停止。
- 远端 GitHub CI 尚未产生绑定 push/PR SHA 的空库证据；生产 migration、备份恢复和发布时间窗仍未授权/未执行。
