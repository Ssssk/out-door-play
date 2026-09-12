# 粗门溜溜

户外自驾路线、钓点与加油服务发现小程序。项目采用 pnpm workspace：

- `apps/mobile`：UniApp + Vue 3 + TypeScript + Vite 5 + Wot Design Uni + Pinia + UnoCSS。
- `apps/api`：NestJS 11 + Prisma + MySQL 本地开发 API。
- `apps/admin`：Vue 3 + Vite + TypeScript + Element Plus + Pinia + ECharts 运营管理后台。
- `miniprogram`：原微信原生初始工程，仅作为历史视觉参考。

## 本地启动

要求 Node.js 20+、pnpm 10+、Docker Desktop。

```bash
pnpm install
pnpm db:up
pnpm db:deploy
pnpm db:seed
pnpm --filter @chumen/api admin:bootstrap
pnpm dev
```

MySQL 容器名为 `chumen-mysql`，宿主机端口为 `3307`，数据保存在 Docker Volume `chumen_mysql_data`。首次开发数据库结构变更使用 `pnpm db:migrate -- --name <migration-name>`；部署已有迁移使用 `pnpm db:deploy`。默认开发连接配置在 `apps/api/.env.development`，个人覆盖值可写入不会提交的 `apps/api/.env`，字段模板见 `apps/api/.env.example`。

默认地址：

- H5：终端中 Vite 输出的地址（通常为 `http://localhost:5173`）
- Web 管理后台：`http://localhost:5174/admin/`
- API：`http://127.0.0.1:3100/v1`
- Swagger：`http://127.0.0.1:3100/v1/docs`
- 健康检查：`http://127.0.0.1:3100/v1/health`

生产域名：官网首页为 `https://www.chumenliuliu.cloud/`，运营后台为 `https://www.chumenliuliu.cloud/admin/`，小程序生产 API 为 `https://www.chumenliuliu.cloud/v1`。本地开发地址保持不变。

首次创建后台超级管理员前，在不提交的 `apps/api/.env` 临时设置 `ADMIN_BOOTSTRAP_USERNAME`、`ADMIN_BOOTSTRAP_PASSWORD`（至少 12 位）和 `ADMIN_BOOTSTRAP_DISPLAY_NAME`，运行上述 bootstrap 命令后立即删除这三项。已有 `super_admin` 时命令会拒绝重复创建，密码不会输出到日志。

Mobile Vite 开发服务器默认只监听 `127.0.0.1`。如果使用真机调试，再显式设置 `MOBILE_DEV_HOST=<电脑局域网IP>`，同时将移动端 API 地址改为该 IP；只在受信任局域网短时开放，并确保系统防火墙限制 3100/5173 端口来源。

## 微信小程序

```bash
pnpm build:mp-weixin
pnpm security:audit
pnpm security:sbom
```

随后用微信开发者工具打开仓库根目录；`project.config.json` 已指向 `apps/mobile/dist/build/mp-weixin`。

### 手动插件发布与 GitHub Actions

浏览器插件的“上传开发版”是在本机通过微信开发者工具上传开发版本；“体验版”按钮是生成扫码预览二维码。它们都不是微信公众平台的提交审核或线上正式发布。

`main` 分支上的小程序变更默认仍会触发 GitHub Actions，上传另一份受控的体验版本。GitHub Runner 无法读取某台开发机的插件记录，因此不会自动判断“本机刚刚已经上传过”，直接 push 会再次执行体验版 CI。

如果本次代码已经用插件上传并确认不需要远程 CI 再上传一次，请在提交说明中加入标记：

```text
feat: 调整路线页面 [skip-miniprogram-experience]
```

该标记只跳过小程序体验版 Job，不影响后端和管理 Web 的 CI；不加标记则保持默认自动发布。`workflow_dispatch` 手动运行不受该提交标记影响。

## 验证

```bash
pnpm type-check
pnpm test
pnpm build:h5
pnpm build:mp-weixin
```

更多边界与后续持久化方案见 [架构说明](docs/architecture.md)。
