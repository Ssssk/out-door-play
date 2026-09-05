# 安全评审（威胁模型候选，待独立 Reviewer）

## 信任边界与数据流

- 不可信：uni-app/H5、微信 code、Authorization/header/body/query、dev handle。
- 外部可信但可能失败：固定微信 `code2Session` HTTPS endpoint。
- 服务端信任边界：Identity API/Guard、HMAC/token issuer、Prisma/MySQL、运行环境 Secret。
- 高敏感流：AppSecret/HMAC key 只在服务端配置；code/OpenID/session_key 只在单次交换内；access/refresh 明文只在客户端与签发/校验边界。

## 身份、授权和资源级访问

- Bearer Guard 默认拒绝 user/profile/favorite；principal 从 access hash 查询产生，DTO 不接受 userId。
- provider subject HMAC 唯一映射 User；不自动合并微信/dev 身份。
- banned 用户不能登录/刷新/访问；refresh 单次原子轮换；logout 撤销当前 session。

## 输入、输出和外部访问

- DTO whitelist + forbidUnknown；code/token/handle/昵称/头像引用长度和格式限制。
- 微信 URL 固定、HTTPS、5 秒 Abort、受控响应大小与运行时 schema；不接受用户 URL/重定向目标。
- 错误响应只用稳定 code、公开 message、traceId；不回传平台原始响应。

## 敏感数据、Secret 和日志

- DB 只存 token SHA-256 与 provider subject HMAC；不存明文 token/OpenID/session_key。
- 日志禁止 Authorization、code、token、OpenID、session_key、AppSecret/HMAC key；指标不用 user/session 高基数标签。
- uni-app 仅持久化恢复会话所需 token/expiry；退出/换号清空用户范围缓存。H5 dev 不承诺生产安全存储。

## 依赖、上传、MQ 与部署权限

- 优先 Node 内置 crypto/fetch；无上传、Redis、RabbitMQ、生产部署权限。
- production 必须 DEV_IDENTITY_ENABLED=false；正式 Secret 由受控运行环境注入且不得进入 CI fork/前端包。

| 风险 ID | 等级 | 条件与影响 | 证据 | 修复/控制 | 状态 |
|---|---|---|---|---|---|
| IDENTITY-P1-001 | P1 | 缺正式微信凭证/真机，无法证明真实身份边界 | status/AC-TARGET | 保持微信联调/UAT/Release pending | open |
| IDENTITY-P1-002 | P1 | dev provider 误开生产可伪造用户 | design/SEC-001、单元测试 | NODE_ENV + 显式 flag 双拒绝、生产 404 测试 | implemented/tested；待独立复核 |
| IDENTITY-P1-003 | P1 | 横向越权暴露资料/收藏 | AC-AUTHORIZATION、本地 MySQL 集成 | Guard principal、DTO 无 userId、双账号集成 | tested；待独立复核 |
| IDENTITY-P1-004 | P1 | refresh 重放产生多会话/旧 token 可用 | AC-SESSION、本地 MySQL 集成 | MySQL 条件轮换、并发 20 测试 | tested；待独立复核 |
| IDENTITY-P1-005 | P1 | token/OpenID/session_key/Secret 泄露 | SEC-001、Secret/SAST/SBOM | hash/HMAC、日志扫描、前端包扫描 | partial：扫描通过，SCA 仍有 2 Vite high |
| IDENTITY-P2-001 | P2 | 微信 provider 超时/故障导致登录不可用 | AC-LOGIN | 5 秒超时、安全错误、重新取 code | test-pending |
| IDENTITY-P2-002 | P2 | 本地持久 token 被宿主脚本/设备读取 | threat model | 短 access、refresh 轮换、最小持久化、退出清理 | residual |

## 残余风险与批准

- H5 正式认证/安全存储不在范围；生产 H5 不开放 dev 登录。
- bearer token 在不可信客户端无法绝对防提取，当前以短 access、轮换、撤销、TLS 和最小存储降低风险。
- Security Gate 必须由独立安全 Reviewer 在实现、双账号/并发测试、Secret/SAST/SCA/SBOM 与微信真机证据后判定；当前自动扫描与本地测试已执行，但因 2 个 Vite high、微信真机和独立评审缺失，结论仍为 `pending/failed`。
