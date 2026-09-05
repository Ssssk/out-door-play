# 后端领域设计

## 受影响模块和聚合

- `Identity`：`UserIdentity` 将微信/dev provider subject 映射为内部 User；不保存微信 `session_key`，subject 以服务端 HMAC 摘要持久化。
- `MobileSession`：服务端可撤销会话；access/refresh 明文只在签发边界出现，持久层只存 SHA-256；轮换替换同一 session 的两类摘要。
- `UserProfile`：当前用户昵称、头像引用和统计；主体来自认证上下文。
- `Favorite`：现有 `(userId, discoveryId)` 唯一关系；只允许 online Discovery。

## 用例输入/输出

- `LoginWithWechat(code)` -> provider subject -> user/profile + opaque token pair/expiry。
- `LoginWithDevIdentity(handle)` -> 仅 non-production 且显式开关 -> user/profile + token pair。
- `RefreshSession(refreshToken)` -> 条件轮换 -> 新 token pair；旧 pair 立即失效。
- `AuthenticateAccess(accessToken)` -> `MobilePrincipal { userId, sessionId }` 或统一认证拒绝。
- `Logout(principal)` -> 当前 session `revokedAt`，幂等返回。
- `Get/UpdateProfile(principal.userId, input)` -> 当前资料；不接受目标 userId。
- `List/Add/RemoveFavorite(principal.userId, discoveryId/scene)` -> 当前用户确定结果。

## 业务不变量和状态转换

- provider identity 唯一；不做 provider 间自动账号合并。
- User.status=`banned` 不能登录、刷新或使用 access；发现禁用时拒绝并撤销活跃 session。
- access 15 分钟；refresh 30 天；refresh 成功后 access/refresh 都轮换。
- refresh 重放、过期、撤销和不存在对外统一 `AUTH_REFRESH_INVALID`。
- 资料昵称服务端 trim 后 1-16 字；未知字段拒绝；头像只允许 HTTPS 或项目相对静态引用且最长 255。
- 收藏新增前确认 Discovery online；重复新增/删除返回确定状态，不泄露其他用户关系。

## Repository/服务端口

- `IdentityProvider.exchange(input)`：微信/dev 的平台边界；微信实现固定官方 URL、5 秒 Abort、响应运行时校验。
- `IdentityRepository.findOrCreateUser(provider, subjectHash)`：短事务内 upsert identity/user。
- `SessionRepository.create/authenticate/rotate/revoke/revokeAllForUser`：Prisma adapter，摘要条件查询/更新。
- `ProfileRepository.get/update`、`FavoriteRepository.list/upsert/delete`：Prisma adapter。
- `TokenIssuer`、`SubjectHasher`、`Clock`、`IdGenerator` 作为可控端口；生产用 Node crypto，测试用 deterministic fake。

Domain 不依赖 NestJS/Prisma/fetch。为控制本次范围，现有 user 模块允许以 Application Service + Prisma adapter 渐进落地，不迁移无关模块。

## 事务、并发和幂等

- 微信 HTTP 在事务外完成；平台成功后才执行 identity/user/session 数据库事务。
- identity upsert 依赖 `(provider, providerSubjectHash)` 唯一约束；并发首次登录捕获唯一冲突后重读，不创建两个用户。
- refresh 使用单条条件 `updateMany`：旧 refresh hash、未撤销、未过期；成功计数必须为 1。生成 token 在事务外，摘要替换在原子写内。
- logout 使用 sessionId/access hash 条件 `updateMany`，重复调用不产生额外副作用。
- favorite add 先在短事务内校验 online Discovery，再使用复合主键 upsert；remove 使用 deleteMany，天然幂等。
- 数据库事务内不调用微信、日志后端或其他外部服务。

## 领域事件

- 本 Change 不发布 MQ 事件，不新增 Outbox。
- 认证成功/失败、refresh 拒绝、logout、dev provider 拒绝是结构化安全日志/指标，不是领域消息；不得包含 token、code、OpenID 或 session_key。
