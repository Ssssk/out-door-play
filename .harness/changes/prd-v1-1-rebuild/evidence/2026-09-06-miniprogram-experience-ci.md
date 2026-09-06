# 2026-09-06 微信小程序体验版 CI 证据

## 范围

- Change：`CHG-OUTDOOR-V110-001`
- 目标：`main` 移动端相关变更后自动构建微信小程序、上传开发版本并生成体验预览二维码。
- Secret：上传私钥仅进入 GitHub Actions Secret；本文和仓库不记录私钥内容。

## 配置核对

- 桌面配置 AppID 与根 `project.config.json` AppID 一致。
- 桌面私钥符合 PEM 结构；根目录同名副本被 `.gitignore` 排除，当前索引和 Git 历史均未跟踪任何 `*.key`。
- GitHub 已创建 Secret `WECHAT_MINIPROGRAM_PRIVATE_KEY`，以及公开 Variables `WECHAT_MINIPROGRAM_APPID`、`WECHAT_MINIPROGRAM_API_BASE_URL`、`WECHAT_MINIPROGRAM_ROBOT`；未读取或回显 Secret 值。
- GitHub Variable `WECHAT_MINIPROGRAM_UPLOAD_ENABLED` 已于 2026-09-06 经用户明确接受风险后设为 `true`，工作流允许读取上传私钥并调用微信上传接口。

## 待执行验证

- 本地 `pnpm build:mp-weixin`：`passed`；Windows/Node 22/pnpm 11.19.0，使用测试服务器 API 地址构建，退出码 0；保留现有 Sass 弃用警告。
- 本地上传脚本 `--validate-only`：`passed`；校验 AppID、PEM 私钥和 `apps/mobile/dist/build/mp-weixin`，退出码 0，未调用微信上传接口。
- 移动端 `type-check`：`passed`；退出码 0。
- 移动端单元/组件测试：`passed`；6 个测试文件、11 个测试通过，退出码 0。
- Workflow `actionlint 1.7.12`：`passed`；退出码 0。
- `pnpm security:secret`：`passed`；退出码 0。
- `node .harness/scripts/validate-harness.mjs`：`passed`；0 warnings、0 errors、退出码 0。
- GitHub Actions 实际上传：`failed`；workflow run `34004031599`（[run](https://github.com/Ssssk/out-door-play/actions/runs/34004031599)），构建、依赖安装和私钥注入通过；微信上传步骤返回 `errCode=-10008 invalid ip`，拒绝 GitHub-hosted Runner 出口 IP `172.183.135.243`，退出码 1，未生成体验二维码 Artifact。
- 微信开发者工具/真机扫码：`not-run`。

## 固定出口 self-hosted Runner

- 用户在当前任务中明确授权将微信上传任务切换到测试服务器固定出口；GitHub 仓库级 Runner `chumen-wechat-uploader` 已注册，标签为 `self-hosted`、`Linux`、`X64`、`wechat-uploader`。
- Runner 使用 GitHub 官方 `actions/runner v2.337.0` Linux x64 制品，本地与服务器均按 GitHub 安装页给出的 SHA-256 `70920811a4f8ad4328818682bca5c6469c1c942fab52448868071d0063816613` 校验通过；一次性注册令牌已消费且未写入仓库或证据。
- 服务以专用 `github-runner` 非 root 系统账号运行，不属于 Docker 组；systemd 状态为 `enabled/active`，日志显示 `Connected to GitHub` 与 `Listening for Jobs`。
- systemd hardening 已启用：`NoNewPrivileges`、`ProtectSystem=strict`、`ProtectHome`、`PrivateDevices`、空 capability set、拒绝 link-local/云主机 metadata 网段、`/opt/chumen` 不可访问；实测 Runner 账号不能读取 `/opt/chumen/.env.production`。
- 工作流已在本地拆分为 GitHub-hosted 构建 Job 与固定出口上传 Job；上传 Job 不 checkout 源码，只下载无密钥构建 payload，私钥使用后执行 `always()` 清理。该 workflow 尚待提交、push 和真实 run 验证。

## 已知边界

- `miniprogram-ci@2.1.31` 官方包的隔离锁文件包含 1103 个依赖；2026-09-06 使用 npm 官方审计端点得到 41 critical、16 high、18 moderate、1 low，Security Gate 保持 pending。
- 微信上传密钥启用了 IP 白名单；固定出口 self-hosted Runner 已就绪，但小程序管理员仍需在微信公众平台的“代码上传密钥”IP 白名单中加入该测试服务器公网 IP，之后才能真实重试。
- 当前 API 仍使用公网 IP 的 HTTP 测试入口；`chumenliuliu.cloud` 当前解析/HTTPS 不可用，正式真机请求仍需先完成 DNS 指向实际服务器、HTTPS 证书和 `/v1/` 反向代理，再将该域名加入微信 request 合法域名，并同步 GitHub API 地址变量。
- 上传开发版本和生成二维码不等于微信审核通过或正式线上发布。
