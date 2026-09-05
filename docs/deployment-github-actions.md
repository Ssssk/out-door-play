# GitHub Actions 部署

仓库中的 `.github/workflows/deploy-production.yml` 仅允许从 `main` 分支手动触发。它会构建 API 和管理端镜像，推送到 GitHub Container Registry，然后通过 SSH 在 Ubuntu 服务器上执行 Prisma migration、启动 Docker Compose，并检查 `/v1/health`。普通代码推送只运行 CI，不会直接修改服务器。

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
APP_PORT=8080
MYSQL_DATABASE=chumen
MYSQL_USER=chumen
MYSQL_PASSWORD=使用随机生成的字母数字密码
MYSQL_ROOT_PASSWORD=使用随机生成的字母数字密码
IDENTITY_SUBJECT_HMAC_KEY=至少32个随机字符
CORS_ORIGINS=http://服务器IP:8080
ADMIN_ALLOWED_ORIGINS=http://服务器IP:8080
ADMIN_COOKIE_SECURE=true
```

工作流会自动把当前提交 SHA 对应的 `API_IMAGE` 和 `WEB_IMAGE` 写入该文件。不要把宝塔面板密码或 SSH 私钥放入仓库变量、`.env` 文件或日志。

## 首次运行前

1. 确认服务器 SSH 用户的公钥已写入 `~/.ssh/authorized_keys`，并先手动验证该用户可以登录。
2. 给服务器部署用户授予 Docker 权限：`sudo usermod -aG docker <用户>`，重新登录后执行 `docker compose version`。
3. 为云厂商安全组放行 `APP_PORT`；不要放行 MySQL 端口。
4. 当前服务器没有域名和 HTTPS，工作流只提供 HTTP 部署能力。微信小程序正式请求、生产管理员登录和安全 Cookie 仍需要域名与 TLS，完成前不能视为生产发布。测试环境若暂时使用 HTTP，可显式设置 `ADMIN_COOKIE_SECURE=false`。
5. 配置好 Secrets 后，从 `Actions -> Deploy production -> Run workflow` 手动触发一次，并检查 Environment 审批。

## 当前 HTTP 试运行

可先将 `APP_PORT` 设为 `8080`，并把 `CORS_ORIGINS`、`ADMIN_ALLOWED_ORIGINS` 都设为 `http://服务器公网IP:8080`，同时将 `ADMIN_COOKIE_SECURE=false`，用于测试网页、API 和容器健康状态。该开关只适用于临时 HTTP 测试；正式环境必须恢复为 `true` 并使用 HTTPS。

服务器宿主机只需 SSH、Docker Engine 和 Docker Compose。Node.js、MySQL 与 Nginx 均在镜像/容器内运行；工作流使用 Compose `--wait` 等待服务健康，不依赖宿主机安装这些运行时。
