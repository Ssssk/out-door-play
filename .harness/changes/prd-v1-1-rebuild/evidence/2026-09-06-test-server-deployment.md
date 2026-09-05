# 2026-09-06 授权测试服务器部署与数据同步证据

- Change：`CHG-OUTDOOR-V110-001`
- 环境：用户明确确认的 Ubuntu Server 24.04 LTS 测试服务器
- 执行者：Codex，依据用户在当前任务中的明确授权
- Secret：未写入本文；命令输出未保存私钥、数据库密码、管理员密码或完整数据

## 代码与制品

- GitHub 分支：`main`
- 已验证 GitHub Actions 部署 SHA：`58f90e5afef8df21db7054404ce3f073e4bd5a90`
- HTTP 管理端 Cookie 修复 SHA：`33de0ec`
- 修复后远端镜像：`chumen-api:33de0ec`、`chumen-web:33de0ec`
- 远端容器：`chumen-mysql-prod`、`chumen-api-prod`、`chumen-web-prod`

## 部署结果

- `compose.prod.yaml` 由 MySQL、API、Web/Nginx 三个服务组成。
- Web 宿主机测试端口映射到 Nginx 容器 80；`/v1/` 反向代理到 API 容器 3100。
- MySQL 3306 只在容器网络中使用，未作为应用访问入口暴露公网。
- Prisma 检测到 5 个 migrations，结果为 `No pending migrations to apply`。
- 三个容器在部署后均为 healthy/running。
- 外部 `/`、`/v1/health`、`/v1/cities`、`/v1/routes` 均返回 HTTP 200。

## 数据同步结果

- 本地开发库和远端库均为 MySQL 8.4 schema，`_prisma_migrations` 均为 5 条。
- 远端导入前所有业务表精确记录数为 0。
- 使用 data-only dump，同步 16 张有数据的表，排除 `_prisma_migrations`，未执行 drop table/database。
- 导入后本地与远端逐表精确 `COUNT(*)` 一致；包括城市、路线/钓点、油价/站点、用户/身份/收藏、UGC、榜单、报表、指标和管理员 RBAC 基础数据。
- 导入后的公共 API 验证：城市接口返回 9 条可见记录，路线接口返回 2 条可见记录。
- 服务器临时 dump 在校验成功后已删除；本地临时备份未进入仓库。

## 管理端登录回跳修复

- 现象：正确登录后路由立即返回登录页。
- 根因：HTTP 测试地址与 production 模式 `Secure` Cookie 冲突。
- 处理：代码增加 `ADMIN_COOKIE_SECURE` 显式开关；Compose 默认仍为 `true`，授权 HTTP 测试环境设为 `false`。
- 验证：登录接口 HTTP 200；Cookie 存在、`HttpOnly=true`、`Path=/v1/admin`、不含 `Secure`；API/Web/MySQL 容器健康。
- 安全边界：配置域名与 HTTPS 后必须恢复 `ADMIN_COOKIE_SECURE=true`。

## 未完成与边界

- 当前仍无域名和 TLS，不是正式生产发布证据。
- 微信小程序未由服务器 Docker 流程上传或发布。
- 新约定“完整本地 Docker Gate 后再远端部署”尚待下一次按 Runbook 全链路执行并取证。

