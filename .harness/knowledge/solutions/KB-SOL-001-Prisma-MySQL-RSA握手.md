---
id: KB-SOL-001
title: Docker 重启后 Prisma 连接 MySQL 8 的 RSA 握手失败
type: solution
status: verified
scope: [backend, database, local-development]
stack: [nestjs, prisma, mysql, docker]
tags: [caching_sha2_password, allowPublicKeyRetrieval, docker-restart, prisma-adapter-mariadb]
owner: 用户（项目负责人）
last_verified: 2026-08-30
related_changes: [CHG-ADMIN-FOUNDATION-001]
---

# 现象与影响

Docker Desktop 重启后，MySQL 容器已经 `healthy`，但 Prisma MariaDB adapter 首次连接报 `RSA public key is not available client side`，导致本地 API、seed、管理员 bootstrap 或集成夹具无法连接数据库。

# 环境与触发条件

- MySQL 8.4 使用 `caching_sha2_password`。
- NestJS/脚本通过 `@prisma/adapter-mariadb` 连接本机 Docker 映射端口。
- Docker/MySQL 重启清空驱动侧已缓存的认证状态后触发完整认证握手。

# 排查过程与证据

1. `docker compose ps` 显示容器运行且健康。
2. 容器内 `mysql` 客户端可正常查询，证明卷和服务未损坏。
3. Prisma 错误 cause 明确要求提供 `cachingRsaPublicKey` 或启用 `allowPublicKeyRetrieval`。
4. MariaDB driver 类型声明确认支持 `allowPublicKeyRetrieval?: boolean`。

# 根本原因

本地非 TLS 连接未提供 MySQL 认证公钥，同时驱动默认禁止从服务端获取公钥；健康检查只证明 MySQL 可服务，不代表每种客户端认证配置都正确。

# 解决方法

## 临时止损

仅对明确的测试数据，可在容器内使用 MySQL 客户端完成清理并校验计数；禁止把它作为业务运行时绕过方案。

## 永久修复

- Prisma adapter 的所有入口统一读取 `DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL`。
- 本地 Docker 开发环境设为 `true`；示例和生产默认保持 `false`。
- 生产环境应使用 TLS 或受控的 `cachingRsaPublicKey`，不能为了便利无条件开启公钥获取。

# 无效方法及原因

- 只等待容器 `healthy`：不能改变客户端认证参数。
- 重复执行 Prisma 命令：完整握手仍会以同一原因失败。
- 全环境硬编码 `allowPublicKeyRetrieval: true`：扩大中间人攻击面，不符合生产安全边界。

# 验证方法与结果

- Docker/MySQL 重启后，设置本地开关为 `true`。
- 再次运行 `RBAC_FIXTURE_ACTION=cleanup`，Prisma 连接及事务执行成功。
- 容器内 SQL 复核 QA 管理员、会话、审计计数均为 0。

# 适用边界与失效条件

适用于受信任本机网络上的开发容器。远程、共享、预发和生产数据库必须优先使用 TLS/固定公钥，并保持该开关关闭。

# 关联文件、Change 与知识

- `apps/api/src/database/prisma.service.ts`
- `apps/api/prisma/seed.ts`
- `apps/api/prisma/bootstrap-admin.ts`
- `apps/api/prisma/rbac-integration-fixture.ts`
- `CHG-ADMIN-FOUNDATION-001`
