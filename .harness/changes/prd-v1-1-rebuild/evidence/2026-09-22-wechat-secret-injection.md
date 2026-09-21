# 2026-09-22 微信登录 Secret 注入修复证据

- Change：`CHG-OUTDOOR-V110-001`，关联 `CHG-MOBILE-IDENTITY-001`
- 类型：production configuration incident / CI workflow bugfix
- 用户请求：确认 `production` Environment 已配置 `WECHAT_APP_ID`、`WECHAT_APP_SECRET` 后要求“给我处理吧”
- 修复提交：`e8255ff2f992ce092b0894138f4548d06f1097aa`
- 环境：Windows 本地验证；GitHub Actions `production` Environment；Docker Compose API

## 修复前证据

- 公网 `POST /v1/auth/wechat/login` 返回 HTTP 503、`AUTH_PROVIDER_UNAVAILABLE`。
- 目标服务器和 API 容器中的两个配置键存在但值为空；未读取或保存实际 Secret。
- 原生产工作流没有引用 `${{ secrets.WECHAT_APP_ID }}` 或 `${{ secrets.WECHAT_APP_SECRET }}`，只会把 `DEPLOY_ENV_FILE` 与腾讯地图配置写入服务器。

## 代码修复

- 在 `deploy` Job 的 `Write deployment environment` 步骤显式映射两个 GitHub Environment Secret。
- 生成远端环境文件前执行非空校验，删除旧键后追加独立 Secret，避免 `DEPLOY_ENV_FILE` 内旧空值或重复键覆盖。
- 不输出 Secret；通过 base64 管道传输并保持目标文件权限 `0600`。
- 部署后以无效微信 code 冒烟，要求 HTTP 401 和 `AUTH_CODE_INVALID`，从而同时发现未注入、凭证错误或微信 Provider 不可达。

## 本地验证

- `node --test tools/ci/deploy-production.test.mjs`：2/2 passed。
- `node --test tools/ci/changed-components.test.mjs`：3/3 passed；相关脚本 `node --check` passed。
- `node --test tools/miniprogram-ci/describe-change.test.mjs`：4/4 passed；相关脚本 `node --check` passed。
- API：type-check passed；17 个测试文件、91 项测试 passed；4 份契约共 18 个 operation passed；build passed。
- Admin：type-check passed；2 个测试文件、4 项测试 passed；build passed。
- 微信小程序：`pnpm build:mp-weixin` passed；仅有既有 Sass/UnoCSS 警告。
- `pnpm lint`：退出码 0，0 error、19 个既有 warning。首次与 Vite 构建并发时因临时 timestamp 文件消失返回 ENOENT；构建结束后单独重跑通过，未通过重复运行掩盖业务测试失败。
- `pnpm format:check`、`pnpm security:secret`、`node .harness/scripts/validate-harness.mjs` passed。
- `docker compose -f compose.prod.yaml config --quiet` passed。首次错误使用不存在的 `.env.example`，退出码 1；去掉该无效参数并用脱敏占位配置重跑通过。

## 生产执行与发布边界

- 当前仓库中的 Implementation、Verification、Security、UAT、Operations 和 Release Gate 仍为 pending；`CHG-MOBILE-IDENTITY-001` 的发布计划也明确标记“未授权执行”。
- 因此本证据目前只证明修复代码和本地门禁通过；生产 workflow dispatch、容器重建、配置存在性复核和公网认证冒烟均为 `not-run`，不得描述为已上线。
- 生产执行需要 Release/Operations/Security Owner 对本次配置修复和回滚范围作明确批准；执行后补记 run URL、SHA、镜像 digest、开始/结束时间、结果和观察窗口。

## 回滚与停止条件

- 回滚仅需部署上一已知可用提交或移除本次独立 Secret 注入；不涉及数据库 schema 或数据写入。
- 若工作流非空检查失败、认证冒烟不是 401/`AUTH_CODE_INVALID`、公开健康/POI 回归或容器不健康，立即停止，不把 503 当成可接受结果。
