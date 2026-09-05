# 软件供应链安全评审

## 制品与依赖范围

- apps/api identity/user、apps/mobile auth/request/pages、Prisma schema/migration、锁文件和构建制品。
- 设计优先使用 Node 内置 crypto/fetch，不为 token/HMAC 新增依赖。

## Secret 扫描

- 必查 AppSecret、HMAC key、token、OpenID、session_key、Authorization；环境变量名可出现，真实值不得进入 Git/日志/Evidence/前端包。

## SAST 与危险配置

- 检查 dev provider production fail-closed、固定微信 HTTPS endpoint、超时/响应校验、Guard 默认拒绝、DTO 不接收 userId、日志脱敏。

## SCA、漏洞和许可证

- 复用 active `pnpm security:audit` 与许可证检查。前次基线仍报告 2 个 high，必须以候选锁文件重扫并处置/独立接受；不得沿用旧结果为通过。

## SBOM 与制品来源

- 候选构建生成 SBOM 并绑定 commit/digest；当前设计文档无可发布制品。

## 容器镜像、IaC 与 CI 权限

- 本 Change 不新增镜像/IaC；CI 使用隔离 MySQL、无生产 Secret、最小权限。

## 发现、例外和到期时间

- 微信正式 Secret/真机缺失、现有 high 漏洞和独立安全 Reviewer 缺失均阻塞 Security/Release；无已批准例外。

## 证据与结论

- 状态：`not-run`
- 结论：Design Gate 输入已准备，不能视为 Security Gate 通过。
