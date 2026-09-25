# GitHub Actions 部署

仓库中的 `.github/workflows/deploy-production.yml` 仅允许从 `main` 分支手动触发。它先在 GitHub Runner 验证 API 和管理端镜像构建，再通过 SSH 上传当前 SHA 源码，由授权测试服务器构建 SHA 镜像、执行 Prisma migration 并启动 Docker Compose。普通代码 push 不会直接修改服务器。

## 新会话快速入口

部署与数据同步统一按 `.harness/knowledge/inbox/KB-INBOX-012-本地Docker到测试服同步Runbook.md` 执行：本地 Docker 构建、迁移、完整栈和冒烟全部通过后，才允许 push 并手动运行远端部署。MySQL 业务数据不随代码部署自动同步；只有在明确授权、备份和逐表对账就绪时才单独导入。

## GitHub 配置

在仓库的 `Settings -> Environments` 创建 `production` Environment；建议为它配置 Required reviewers。然后在该 Environment（或仓库 Actions secrets）设置：

- `DEPLOY_HOST`：服务器公网 IPv4
- `DEPLOY_PORT`：SSH 端口，默认 `22`
- `DEPLOY_USER`：服务器 SSH 用户，不是宝塔面板用户名
- `DEPLOY_SSH_KEY`：该 SSH 用户对应的私钥，仅保存到 GitHub Secret
- `DEPLOY_KNOWN_HOSTS`：预先核验过的 SSH 主机公钥，禁止在工作流中关闭主机校验
- `DEPLOY_DIR`：服务器部署目录，建议 `/opt/chumen`
- `DEPLOY_ENV_FILE`：生产环境变量文本，不要提交到 Git。至少包含：

```dotenv
APP_HTTP_PORT=80
APP_HTTPS_PORT=443
MYSQL_DATABASE=chumen
MYSQL_USER=chumen
MYSQL_PASSWORD=使用随机生成的字母数字密码
MYSQL_ROOT_PASSWORD=使用随机生成的字母数字密码
IDENTITY_SUBJECT_HMAC_KEY=至少32个随机字符
WEB_NGINX_CONFIG=/opt/chumen/nginx/production.conf
TLS_CERT_DIR=/opt/chumen/certs
ACME_WEBROOT=/opt/chumen/certbot-webroot
```

另外在同一个 `production` Environment 中创建以下独立 Secrets；工作流会把它们写入远程 `.env.production`，并覆盖 `DEPLOY_ENV_FILE` 中同名的旧行：

- `CORS_ORIGINS`：`https://www.chumenliuliu.cloud,https://chumenliuliu.cloud`
- `ADMIN_ALLOWED_ORIGINS`：`https://www.chumenliuliu.cloud,https://chumenliuliu.cloud`
- `ADMIN_COOKIE_SECURE`：`true`
- `WECHAT_APP_ID`、`WECHAT_APP_SECRET`：微信登录配置
- `TENCENT_MAP_KEY`、`TENCENT_MAP_SECRET`：腾讯地图配置；当前工作流要求 `TENCENT_MAP_KEY` 非空

工作流会自动把当前提交 SHA 对应的 `API_IMAGE` 和 `WEB_IMAGE` 写入该文件。不要把宝塔面板密码或 SSH 私钥放入仓库变量、`.env` 文件或日志。

## 首次运行前

1. 确认服务器 SSH 用户的公钥已写入 `~/.ssh/authorized_keys`，并先手动验证该用户可以登录。
2. 给服务器部署用户授予 Docker 权限：`sudo usermod -aG docker <用户>`，重新登录后执行 `docker compose version`。
3. 为云厂商安全组放行对外 HTTP/HTTPS 端口；不要放行 MySQL 端口。Web 容器内 Nginx 监听 80/443，官网根路径由 `website/dist` 提供，管理后台位于 `/admin/`，API 位于 `/v1/`。
4. 将证书复制到 `TLS_CERT_DIR`，把证书续期后的复制和 Nginx reload 配置为 Certbot deploy hook；`docker/nginx/production.conf` 负责 HTTP 跳转、ACME challenge、HTTPS 和同域 API 代理。
5. 在微信公众平台将 `www.chumenliuliu.cloud` 加入 request 合法域名；体验版构建已固定使用 `https://www.chumenliuliu.cloud/v1`。
6. 配置好 Secrets 后，从 `Actions -> Deploy production -> Run workflow` 手动触发一次，并检查 Environment 审批。

## 当前 HTTP 试运行

可先将 `APP_PORT` 设为 `8080`，并把 `CORS_ORIGINS`、`ADMIN_ALLOWED_ORIGINS` 都设为 `http://服务器公网IP:8080`，同时将 `ADMIN_COOKIE_SECURE=false`，用于临时测试网页、API 和容器健康状态。正式域名接入后必须恢复为 `https://www.chumenliuliu.cloud` 与 `ADMIN_COOKIE_SECURE=true`；当前远程服务器已经使用 80/443 和 HTTPS，不应再用该临时端口配置。

服务器宿主机只需 SSH、Docker Engine、Docker Compose 和证书续期工具。Node.js、MySQL 与 Nginx 均在镜像/容器内运行；工作流使用 Compose `--wait` 等待服务健康，不依赖宿主机安装 Node.js 或 MySQL。
