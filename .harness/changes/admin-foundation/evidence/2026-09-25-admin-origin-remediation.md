# 2026-09-25 远程 Admin Origin 配置修复

- Change：`CHG-ADMIN-FOUNDATION-001`
- 类型：生产配置修复 / Incident 响应
- 目标：`124.223.220.242`，`/opt/chumen`，`chumen-api-prod`
- 执行者：Codex（用户明确授权）
- 时间：2026-09-25 08:31~08:32（Asia/Shanghai）

## 修复前证据

- 远程 API 与 MySQL 均为 healthy，镜像提交为 `6a54d25c9ba3016bbc4a70611e30da54d0560b0c`。
- 使用虚构账号和 `Origin: https://www.chumenliuliu.cloud` 请求登录，返回 `403 ADMIN_CSRF_INVALID`（来源不受信任）。
- 远程容器运行时的 `ADMIN_ALLOWED_ORIGINS`、`CORS_ORIGINS` 均不包含生产根域或 `www` 域；未输出变量原值。

## 执行动作

1. 将 `/opt/chumen/.env.production` 备份至：
   `/opt/chumen/backups/.env.production.before-admin-origin-20260925T083139+08:00`
2. 将以下两项精确设置为无尾斜杠的 HTTPS 域名列表：

   ```dotenv
   CORS_ORIGINS=https://www.chumenliuliu.cloud,https://chumenliuliu.cloud
   ADMIN_ALLOWED_ORIGINS=https://www.chumenliuliu.cloud,https://chumenliuliu.cloud
   ```

3. 使用 `docker compose --env-file /opt/chumen/.env.production -f /opt/chumen/compose.prod.yaml up -d --no-deps --force-recreate --wait --wait-timeout 120 api` 仅重建 API；未执行迁移、数据库写入或 Web 容器重启。

## 修复后验证

- API 容器：healthy，运行时两项配置均与目标值一致。
- `GET https://www.chumenliuliu.cloud/v1/health`：HTTP 200，`Access-Control-Allow-Origin` 为 `https://www.chumenliuliu.cloud`，credentials 为 true。
- 使用虚构账号调用登录：HTTP 401，`ADMIN_AUTH_FAILED`；不再返回来源校验 403，且无 `Set-Cookie`。
- `GET https://www.chumenliuliu.cloud/admin/`：HTTP 200，Nginx 正常提供 SPA。

## 限制与后续

- 未使用真实管理员凭据执行登录，避免触碰 Secret；请业务 Owner 用真实账号完成一次 UAT。
- 本次仅修复生产环境变量，未改变代码、数据库 schema 或 Change Gate 状态。
