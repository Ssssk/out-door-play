# 安全评审

## 信任边界与数据流

- 不可信边界：uni-app 用户端、Admin 浏览器、所有 HTTP body/query/path/header。
- 当前链路：客户端 → 无认证 `/v1` API → NestJS Service → Prisma → MySQL。
- 当前未接入 Redis、RabbitMQ、对象存储或第三方登录；其安全边界在相应 Change 引入时评审。

## 身份、授权和资源级访问

- 未发现 Guard、JWT、Session、RBAC 或资源 Policy。
- `/v1/admin/**` 的查询、修改、审核、封禁、删除和油价写入均可在没有可信主体的情况下调用。
- `/v1/me/permissions` 返回固定 operator 权限，不基于认证主体，不能作为授权证据。
- `/v1/user/me` 当前也没有可信用户主体，资料更新与收藏读取存在越权语义。

## 输入、输出和外部访问

- 正向控制：全局 `ValidationPipe` 已启用 `whitelist`、`forbidNonWhitelisted`、`transform`。
- 待修复：认证端点、写端点和高成本查询尚无限流；CORS 默认允许本机与局域网 HTTP Origin，仅适合本地开发。
- Swagger `/v1/docs` 当前无环境开关；生产必须关闭或保护。

## 敏感数据、Secret 和日志

- 文件名检查发现本地 `.env*` 与微信私钥文件，但 `git ls-files` 未发现它们被跟踪；检查过程中未读取或输出 Secret 值。
- `.gitignore` 已覆盖 `private.*.key`、`.env`、`.env.development`、`.env.local` 与 `.env.*.local`。
- 仍需在 CI 增加真正 Secret Scanner，并检查历史提交；本轮未执行历史扫描。

## 依赖、上传、MQ 与部署权限

- 官方 npm Registry 审计失败：35 个漏洞，其中 11 high；详见供应链评审。
- 当前未发现上传或出站 HTTP 主路径；首次引入时必须做 MIME/大小/域名/超时约束。
- 当前无 MQ；不得把 RabbitMQ 通用规则写成已验证实现。

| 风险 ID | 等级 | 条件与影响 | 证据 | 修复 | 状态 |
|---|---|---|---|---|---|
| SEC-P1-001 | P1 | 未认证调用 Admin/用户写接口可修改路线、城市、油价、用户、UGC 和报表 | controller 路由扫描，无 Guard/Policy | 独立 `admin-foundation`/identity Change 实现认证、RBAC、资源授权、审计与 401/403 测试 | open，阻塞发布 |
| SEC-P1-002 | P1 | 依赖树存在 11 个 high 漏洞，包含构建链命令注入/路径读取、DoS 和 MariaDB TLS 风险 | `004-security-audit.evidence.json` | 独立依赖安全 Change 分层升级/override，执行构建、目标端与集成回归 | open，阻塞 Security Gate |
| SEC-P2-001 | P2 | 默认 CORS 接受局域网 HTTP Origin，若原样用于部署会扩大浏览器调用面 | `apps/api/src/main.ts` | 环境化严格 Origin allowlist，生产拒绝通配/局域网正则 | open |
| SEC-P2-002 | P2 | Swagger 与写接口缺少生产环境保护/限流 | `apps/api/src/main.ts`、Controller 扫描 | 配置开关、认证和限流；添加启动配置校验 | open |

## 残余风险与批准

本轮为只读安全评审，没有实施认证或依赖升级。`SEC-P1-001`、`SEC-P1-002` 未关闭，Security Gate 保持 pending，任何部署或发布候选均被阻塞。

