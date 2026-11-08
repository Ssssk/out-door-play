# 软件供应链安全评审

> 当前状态 `not-run`。本 Change 尚未实现，以下为评审范围与执行清单，不是已通过的结论。

## 制品与依赖范围

- 变更文件范围（预计）：`apps/api/src/modules/config/*`、`apps/api/src/modules/admin/*`、`apps/api/src/modules/routes/*`、`apps/api/src/modules/user/*`、`apps/api/src/scripts/verify-openapi-contract.ts`、`apps/mobile/src/components/SceneTabs.vue`、`apps/mobile/src/pages/index/*`、`apps/mobile/src/pages/favorites/*`、`apps/mobile/src/api/outdoor.ts`、`apps/mobile/src/types/domain.ts`、`apps/admin/src/router/index.ts`、`apps/admin/src/layout/AdminLayout.vue`、`apps/admin/src/views/SceneTabsConfigView.vue`、`apps/admin/src/views/CitiesView.vue`、`apps/admin/src/types/admin.ts`。
- **不新增第三方依赖**，不改锁文件（`pnpm-lock.yaml`）、不改构建脚本与基础镜像。
- 制品：API、后台静态资源、小程序 `mp-weixin` 包；记录各自 SHA/digest。

## Secret 扫描

- 检查新增/修改文件不含 Token、密码、Cookie 值、CSRF Token、真实用户数据或生产连接串。
- 管理端沿用 `configureAuthTransport` 注入 CSRF 的既有机制，不复制凭证到客户端常量。

## SAST 与危险配置

- 检查新增 DTO 的运行时校验完整性、全局 `ValidationPipe` 的 `whitelist/forbidNonWhitelisted` 未被绕过。
- 检查无 `dangerouslySetInnerHTML`、`v-html`、字符串拼接 SQL、动态 `Prisma` 原始查询。
- 检查不使用 ORM `synchronize`、不在事务内等待外部调用、不新增文件写入/上传接口。

## SCA、漏洞和许可证

- 因无新增依赖，SCA 结论沿用当前基线；执行现有 CI 的依赖审计命令并记录退出码与报告路径。
- 若实现阶段意外引入依赖，必须回到设计 Gate 重新评审，不得静默加入。

## SBOM 与制品来源

- 沿用现有 CI 制品生成流程；记录构建命令、Runner、时间与产物 digest。
- 小程序包来源：`pnpm build:mp-weixin` 产物 → 微信上传；不得使用未登记来源的二进制。

## 容器镜像、IaC 与CI权限

- 不改 Dockerfile、compose、IaC 与 GitHub Actions 权限。
- 契约登记改动在 `apps/api/src/scripts/verify-openapi-contract.ts`，属于源码白名单，不改变 CI 权限边界。
- 小程序体验版上传沿用现有工作流变量与环境，不新增 Secret。

## 发现、例外和到期时间

- 当前无发现（因为尚未执行）；任何 P0/P1 必须在 Security Gate 前关闭或显式阻塞。
- 例外：无；若 Operations Gate 对生产 APM 观测给出 `not-required`，需记录批准人、范围、期限与补救方案。

## 证据与结论

- 必需证据：`static`、`unit`、`integration`、`contract` 的报告，以及 `verification/security-review.md` 的风险关闭记录。
- 状态：`not-run`
