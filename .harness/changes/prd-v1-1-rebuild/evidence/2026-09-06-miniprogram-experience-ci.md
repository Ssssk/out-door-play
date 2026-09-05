# 2026-09-06 微信小程序体验版 CI 证据

## 范围

- Change：`CHG-OUTDOOR-V110-001`
- 目标：`main` 移动端相关变更后自动构建微信小程序、上传开发版本并生成体验预览二维码。
- Secret：上传私钥仅进入 GitHub Actions Secret；本文和仓库不记录私钥内容。

## 配置核对

- 桌面配置 AppID 与根 `project.config.json` AppID 一致。
- 桌面私钥符合 PEM 结构；根目录同名副本被 `.gitignore` 排除，当前索引和 Git 历史均未跟踪任何 `*.key`。
- GitHub 已创建 Secret `WECHAT_MINIPROGRAM_PRIVATE_KEY`，以及公开 Variables `WECHAT_MINIPROGRAM_APPID`、`WECHAT_MINIPROGRAM_API_BASE_URL`、`WECHAT_MINIPROGRAM_ROBOT`；未读取或回显 Secret 值。
- GitHub Variable `WECHAT_MINIPROGRAM_UPLOAD_ENABLED` 当前保持 `false`；风险未批准时 Job fail closed，不安装上传依赖也不读取私钥。

## 待执行验证

- 本地 `pnpm build:mp-weixin`：`passed`；Windows/Node 22/pnpm 11.19.0，使用测试服务器 API 地址构建，退出码 0；保留现有 Sass 弃用警告。
- 本地上传脚本 `--validate-only`：`passed`；校验 AppID、PEM 私钥和 `apps/mobile/dist/build/mp-weixin`，退出码 0，未调用微信上传接口。
- 移动端 `type-check`：`passed`；退出码 0。
- 移动端单元/组件测试：`passed`；6 个测试文件、11 个测试通过，退出码 0。
- Workflow `actionlint 1.7.12`：`passed`；退出码 0。
- `pnpm security:secret`：`passed`；退出码 0。
- `node .harness/scripts/validate-harness.mjs`：`passed`；0 warnings、0 errors、退出码 0。
- GitHub Actions 实际上传：`not-run`。
- 微信开发者工具/真机扫码：`not-run`。

## 已知边界

- `miniprogram-ci@2.1.31` 官方包的隔离锁文件包含 1103 个依赖；2026-09-06 使用 npm 官方审计端点得到 41 critical、16 high、18 moderate、1 low，Security Gate 保持 pending，自动上传尚未启用。
- GitHub-hosted Runner 出口 IP 不固定，微信上传密钥 IP 白名单策略尚未验证。
- 当前 API 使用公网 IP 的 HTTP 地址；正式真机网络请求仍需要 HTTPS 域名与微信 request 合法域名配置。
- 上传开发版本和生成二维码不等于微信审核通过或正式线上发布。
