# 技术设计（已获架构 Owner 批准）

> 2026-09-01 根据已通过的 Requirements Gate 补齐；用户在收到明确 Design Gate 提示后要求按剩余清单继续，Design Gate 已记录为通过。Implementation、Security、UAT、Operations、Release 仍保持 pending。

## 目标与非目标

- 目标：实现 `FR-IDENTITY-001` 的微信/开发身份交换、15 分钟 access、30 天单次轮换 refresh、退出/禁用撤销；实现 `FR-PROFILE-001`、`FR-FAVORITE-001` 的可信主体和资源隔离。
- 目标：让 uni-app 以显式会话状态处理冷启动、并发 401、错误和弱网；资料/收藏仅在服务端成功后进入成功态。
- 非目标：手机号/H5 正式 OAuth、账号合并、头像二进制上传、Redis、RabbitMQ、生产 Secret、生产发布和替代微信真机 UAT。
- 约束：保留 Prisma 7 + Prisma Migration + MySQL；根 API 继续 `/v1`；公开发现接口保持匿名可读。

## 当前流程

```text
mobile page -> outdoorApi -> request -> /v1/user/*
                                  -> UserService -> Prisma
                                     固定 userId=local-dev-user

mobile Pinia 本地持久化 profile/favoriteIds
服务端失败 -> 页面仍可能写本地并显示成功
```

现状没有普通用户 Guard、身份表或会话表。`GET/POST /user/me` 与 `GET /user/favorites` 共享固定主体，详情页收藏只改本地数组。

## 目标架构与数据流

```text
WeChat login code ──> Identity API ──> WeChatIdentityProvider (5s timeout)
H5 dev handle ──────> Identity API ──> DevIdentityProvider (non-production + flag)
                                      │
                                      v
                            Identity Application
                                      │
                        Prisma repositories / MySQL
                     user_identities + mobile_sessions
                                      │
                         opaque access/refresh pair

uni-app auth store -> authenticated request -> MobileAuthGuard
                                              -> trusted principal.userId
                                              -> User/Profile/Favorite use cases
                                              -> users/favorites/discoveries
```

- `Identity` 负责外部身份映射和会话生命周期；`User` 负责资料与收藏，不接收客户端 `userId`。
- Controller 只做 DTO、Guard principal 与 Presenter 适配；Application 编排；Domain 表达状态/令牌不变量；Infrastructure 实现 Prisma 与微信 HTTP 端口。
- 不引入 Redis/MQ。MySQL 是身份映射、会话和收藏的唯一业务真相。

## 业务不变量和状态转换

1. `provider + providerSubjectHash` 唯一映射一个 User；微信 OpenID 用服务端 HMAC-SHA-256 后持久化，明文只存在于单次请求内。
2. access/refresh 均为至少 256 bit CSPRNG 不透明 token；数据库只存 SHA-256 摘要。
3. 会话状态：`active -> rotated`（同一行原子换两类摘要）或 `active -> revoked`；过期是按时间判定的终态。旧 token 不得恢复。
4. refresh 原子条件包含旧 `refreshTokenHash`、`revokedAt IS NULL`、`refreshExpiresAt > now` 与正常用户；并发更新只有一个 `count=1`。
5. access Guard 同时验证摘要、access 过期、未撤销和 User.status=`normal`。禁用用户拒绝并可撤销其全部会话。
6. 资料和收藏只使用 Guard 注入的 `userId`；DTO/query/path 不出现目标用户 ID。
7. 收藏唯一性由现有 `(user_id, discovery_id)` 主键保证；只有 `online` Discovery 可收藏/查询。
8. 客户端资料/收藏写失败不提交本地成功态；退出/换号清空用户范围缓存。

## 成功、失败、超时、重复与补偿时序

### 登录

1. 小程序调用 `uni.login` 取得 code；code 只发送一次。
2. API 使用服务端 AppID/AppSecret 调用 `code2Session`，5 秒 Abort；不自动重试一次性 code。
3. 成功后 HMAC 身份标识，在短事务内 upsert identity/user 并创建 session；token 明文仅返回一次。
4. 无效 code -> `AUTH_CODE_INVALID`；超时/平台 5xx -> `AUTH_PROVIDER_UNAVAILABLE`；客户端显示可重试但重新获取 code。

### 刷新并发

1. 客户端所有读请求共享一个 refresh Promise。
2. 服务端对旧 refresh 摘要执行条件更新并一次性替换 access/refresh 摘要与到期时间。
3. `count=0` 统一返回 `AUTH_REFRESH_INVALID`；不区分过期、撤销或已轮换，避免泄露会话状态。
4. 客户端原子保存新 token pair；失败清理旧 pair 并进入 anonymous。POST/PATCH/DELETE 不自动重放。

### 收藏与资料

- 资料更新先在 DTO trim/校验，再更新当前 user。服务端失败保留表单和错误，不能显示成功。
- 收藏先校验 online Discovery，再 `upsert`；重复请求返回同一 `favorited=true`。取消使用 `deleteMany`，0/1 行均返回 `favorited=false`。
- 不做离线写队列；网络失败由用户显式重试。

## 前端设计

- 页面：新增 `/pages/login/index`；mine 匿名显示登录入口；edit/favorites/detail 收藏操作通过 `requireAuth(returnTo)` 进入登录并安全回跳。
- 状态：新增 `auth` Pinia，状态为 `initializing | anonymous | authenticated | refreshing | expired`；只持久化 token pair、过期时间和最小 profile，不再持久化 `favoriteIds/profile` 作为业务真相。
- API：拆分 `identityApi`、`userApi`；request 接受 `auth: none|optional|required` 与 `retryAfterRefresh`。受保护 GET 最多重放一次；写请求不自动重放。
- 微信：`uni.login` adapter；H5：仅在 dev endpoint 可用时显示开发账号输入。生产 H5 没有正式身份提供方，必须隐藏/禁用 dev 登录。
- UI：覆盖初始化、登录中、provider 失败、弱网、会话过期、保存中、收藏中、失败与空状态；同一写动作 pending 时禁用重复点击。
- 详细页面流和职责见 `frontend/page-flow.md`、`frontend/component-design.md`。

## 后端设计

- 新增 `identity` 模块：AuthController、DTO/Presenter、MobileAuthGuard、IdentityApplicationService、token/session policy、WeChat/Dev provider、Prisma adapters。
- `user` 模块渐进拆分 Profile/Favorite application use case；现有 Controller 改为从 principal 取 userId。此次只改受影响垂直切片，不重构其他模块。
- 外部微信 HTTP 不进入数据库事务；收到平台身份后才开启短事务。配置在启动时校验：生产必须有微信配置且 dev provider 强制关闭。
- 预期配置：`WECHAT_APP_ID`、`WECHAT_APP_SECRET`、`IDENTITY_SUBJECT_HMAC_KEY`、`DEV_IDENTITY_ENABLED`；值不得进入日志、Evidence 或前端包。
- 事务、端口和模型见 `backend/domain-design.md`。

## API、错误码与兼容

- 新端点：`POST /v1/auth/wechat/login`、`POST /v1/auth/dev/login`、`POST /v1/auth/refresh`、`POST /v1/auth/logout`。
- 受保护：`GET /v1/user/me`、`PATCH /v1/user/me`、兼容别名 `POST /v1/user/me`、`GET/POST/DELETE /v1/user/favorites`。
- `Authorization: Bearer <opaque access token>`；refresh 只出现在 refresh request body，绝不放 URL。
- 旧客户端对 user API 从匿名 200 变为 401 是有意安全收紧；公开 cities/routes/spots/fuel 不变。旧 `POST /user/me` 暂保留一个发布窗口并标记 deprecated。
- 契约见 `contracts/openapi.yaml`、`contracts/error-codes.yaml`；本 Change 不产生消息事件，`contracts/events.yaml` 明确空集。

## 数据、索引、迁移

- 新增 `IdentityProvider { wechat, dev }`。
- `UserIdentity(id,userId,provider,providerSubjectHash,createdAt,updatedAt)`；唯一 `(provider, providerSubjectHash)`，`userId` 索引用于账号会话清理/审计。
- `MobileSession(id,userId,accessTokenHash,refreshTokenHash,accessExpiresAt,refreshExpiresAt,revokedAt,createdAt,updatedAt)`；两类摘要各自唯一；索引 `(userId,revokedAt)`、`accessExpiresAt`、`refreshExpiresAt`。
- 全部为 additive 新表/枚举；不回填现有 users/favorites。开发 seed 可显式绑定 `local-dev-user`，生产不得自动创建默认账号。
- 迁移、校验和恢复见 `backend/migration-plan.md`。

## Redis 与 RabbitMQ

- Redis：不采用。当前没有容量证据支持新增运维依赖；会话撤销/轮换要求强一致，直接使用 MySQL。
- RabbitMQ：不采用。登录、资料和收藏均为同步闭环，无批准的异步消费者。
- 若会话查询容量或跨服务隔离出现真实约束，另立 Change/ADR，不能在本实现中偷加缓存或消息。

## 安全与隐私

- 威胁：token 窃取、refresh 重放、水平越权、伪造 dev 登录、OpenID/session_key 泄露、微信 SSRF/重定向、日志泄密。
- 控制：CSPRNG token + DB hash；refresh 单次原子轮换；资源主体来自 Guard；dev 双条件 fail closed；微信 URL 固定官方 HTTPS 地址、不跟随任意用户 URL；5 秒超时/响应大小上限；错误统一映射。
- HMAC key 与 AppSecret 只来自服务端环境。日志只记录 requestId、provider、结果码、耗时桶和内部 user/session ID 的必要摘要，不记录授权头、code、token、OpenID、session_key。
- 中高风险 Change 需要独立安全 Reviewer；现有 SCA 高危项未关闭前 Security Gate 不得通过。

## UI/UX、文案、目标端与可访问性

- 登录页明确说明微信登录用途；H5 dev 模式必须显示“仅本地开发”标识。
- 错误文案基于稳定错误码：code 无效提示重新登录、网络/平台失败提示稍后重试、会话失效提示重新登录、无权限不展示内部原因。
- 输入错误与昵称字段关联；按钮最小触控区域遵循现有 Wot/项目 token；状态不只依赖颜色。
- H5 仅能证明 dev 流程；微信 `uni.login`、隐私授权、code2Session 必须真机。正式凭证缺失时保持 pending。

## 性能、容量、SLI/SLO 与错误预算

- 本 Change 没有已批准生产流量/SLO，不能伪造性能通过。设计预算：微信交换硬超时 5 秒；本地 auth DB 查询保持单次索引查询；收藏列表仍为当前小列表，不新增无界接口。
- 需采集：登录成功率、provider 错误率/延迟、refresh 成功/拒绝、401/429、session 查询延迟、收藏写错误率。标签不得包含 token/OpenID/userId 等高基数字段。
- 生产 SLO、容量和告警阈值由 Operations Owner 在发布前批准；当前保持 pending。

## 可观测性

- 所有认证响应保留 traceId/requestId。
- 结构化安全事件：login outcome、refresh outcome、logout、session rejected、dev provider rejected；只记录低敏感摘要。
- 不把微信原始响应或 DTO 全文记录到日志。外部失败记录安全分类与耗时，不记录 code/AppSecret。

## 备份恢复、RPO/RTO 与 Incident 响应

- `user_identities` 与 User 同等持久；`mobile_sessions` 可通过全量撤销安全降级，但不能从备份恢复出明文 token。
- 应用回滚保留 additive 表；认证故障不得通过恢复固定 `local-dev-user` 旁路 Guard。
- 泄露疑似事件：停止签发、轮换 HMAC/微信 Secret 的决策由安全/运维 Owner 批准，撤销全部 session，验证业务资料与收藏未越权。
- 生产 RPO/RTO、备份恢复演练和 Incident 联系链当前未具备，阻塞 Operations/Release Gate。

## 应用 CI、供应链、SBOM 与制品

- 使用已激活 `project-quality.json`：锁定安装、format、lint、type-check、unit、build、contract、MySQL integration、E2E、security、Harness。
- 新增依赖前必须 SCA/许可证核对；优先使用 Node 内置 `crypto`/`fetch`，不为 token/HMAC 引入第三方包。
- 最终制品绑定 commit/digest；SBOM 与候选制品一致。当前本地未提交工作树不构成可发布制品。

## 发布、迁移和回滚

1. 在隔离 MySQL 执行 additive migration，验证空库/现有库升级与 Prisma generate。
2. 部署兼容应用但保持登录入口关闭；确认配置校验、健康、旧公开 GET。
3. 仅在微信 Secret/真机/UAT/Security/Operations/Release Gate 通过后启用微信登录。
4. H5 dev provider 只用于非生产环境，生产部署验证其端点不可用。
5. 回滚应用时保留新表；不得回退到固定用户或匿名写。必要时撤销所有移动 session 并要求重新登录。

## 备选方案与决策

| 方案 | 优点 | 缺点 | 风险 | 结论 |
|---|---|---|---|---|
| 不透明 access/refresh + MySQL 摘要 | 可即时撤销、单次轮换、无新基础设施 | 每请求一次索引查询 | 容量需后续实测 | 推荐，待批准 |
| JWT access + DB refresh | access 无查库 | 禁用/退出不能立即撤销 access，密钥轮换复杂 | 不满足当前“退出均失效” | 不采用 |
| Redis 会话 | 高吞吐、TTL 原生 | 当前无 Redis/运维/SLO | 扩大范围和故障面 | 不采用；有容量证据再评审 |
| 客户端本地用户/收藏 | 实现简单 | 无可信主体、可越权、跨设备丢失 | 已知安全缺陷 | 禁止 |

## 未决问题与 Gate

- `IDENTITY-P1-001`：微信正式 AppID/AppSecret、隐私配置和真机环境由用户/发布 Owner 提供；阻塞微信联调、UAT、Security/Release。
- `IDENTITY-P1-002`：H5 正式身份提供方不在范围；生产 H5 不开放 dev 登录。
- 用户已授权按本设计进入实现；任何需要扩大为正式 H5 OAuth、新供应商、Redis/MQ 或生产操作的变化仍需返回对应 Gate。
