# 安全评审

## 信任边界与数据流

- 浏览器只持有 HttpOnly `admin_session`；数据库只存 SHA-256 token 摘要。CSRF token 仅保存在前端内存并与 session hash 绑定。
- `/v1/admin/**` 由全局 Guard 默认拒绝；只有登录 handler 显式 `PublicAdminEndpoint`。

## 身份、授权和资源级访问

- 角色：super_admin/operator/content_reviewer/analyst；服务端按 permission code 授权。
- 路线 action 依据 action 类型二次检查 `route:audit` 或 `route:shelf`，避免仅靠 Controller 粗粒度权限。

## 输入、输出和外部访问

- 登录 DTO 白名单、长度限制；失败使用统一消息。写请求必须 Origin allowlist + `X-CSRF-Token`。
- 开发环境自动加入 Admin localhost；生产只读取显式 `ADMIN_ALLOWED_ORIGINS`，缺失时写请求 fail closed。

## 敏感数据、Secret 和日志

- scrypt 参数版本化，随机 salt，constant-time compare；bootstrap 密码只从环境读取且不输出。
- Audit actor 来自 Guard 请求上下文；审计不记录 Cookie、密码、CSRF、Authorization 或完整请求体。

## 依赖、上传、MQ 与部署权限

| 风险 ID | 等级 | 条件与影响 | 证据 | 修复 | 状态 |
|---|---|---|---|---|---|
| AUTH-P1-002 | P1 | migration 未经真实 MySQL 演练 | 首次/重复 deploy、status、真实 HTTP 集成 | 已完成本地演练，CI 空库仍待补 | mitigated |
| AUTH-P1-003 | P1 | 尚无独立安全复核、正式管理员交付与 CI 空库验证 | 四角色真实矩阵、真实 browser E2E、本地 migration 均已通过 | 由独立 reviewer 复核，使用正式密钥交付管理员并在 CI 空库复验 | open |
| AUTH-P2-001 | P2 | 登录限流为单进程内存，水平扩容时不共享 | source review | 当前单实例可用；扩容前改共享限流存储 | accepted-for-dev |

## 残余风险与批准

- 本地 migration、会话、成功/拒绝审计、HTTP Cookie/CSRF、四角色真实矩阵和联合浏览器 E2E 已通过；独立复核、正式管理员交付与 CI 空库验证完成前 Security Gate 保持 pending。

