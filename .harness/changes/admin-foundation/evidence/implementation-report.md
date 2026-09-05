# Admin Foundation 实施证据（2026-08-30）

## 已通过

- Prisma schema `format` + `validate`：exit 0。
- API `tsc --noEmit`：exit 0。
- API Vitest：5 files / 13 tests passed（crypto、session lifecycle、Guard、角色权限基线、既有 route service）。
- Admin `vue-tsc --noEmit`：exit 0。
- Admin Vitest：2 files / 4 tests passed（client envelope、auth store cold-start/login）。
- API build、Admin production build：exit 0。
- uni-app H5 与微信小程序构建：exit 0，证明 Admin 安全改造未破坏移动端编译基线。
- 本地浏览器冒烟：匿名访问 `/` 自动跳转 `/login?redirect=/routes`；用户名/密码有可访问标签；不满足长度时登录按钮禁用，合法长度后启用；API 不可用时显示统一安全错误，不泄露账号状态。

## 未通过/未运行

- CI 空库 migration、独立安全复核：not-run。
- Security/Verification/UAT/Operations/Release Gate：pending。

## MySQL 与真实 HTTP 集成

- Docker Desktop 由用户授权启动；MySQL 8.4 容器 healthy。
- migration 首次应用成功；重复 deploy 无待执行 migration；schema status up to date。
- 临时 super_admin bootstrap 成功，密码未输出或落盘。
- 匿名 Admin 401；不存在用户与错误密码均 401 且公开消息一致。
- login 200；Cookie 包含 HttpOnly、SameSite=Lax、Path=/v1/admin；session 200；角色为 super_admin。
- 缺 CSRF 403；恶意 Origin 403；报表创建 201、删除 200；logout 200；退出后 401。
- AuditLog：3 条 success、3 条 requestId 命中；AdminSession：1 条且 revoked。
- 测试管理员、测试 session/audit、临时报表最终查询均为 0。

## 四角色真实 RBAC 矩阵

| 角色 | 登录 | 读取路线 | 代表性动作 | system:write |
|---|---:|---:|---:|---:|
| analyst | 200 | 200 | 创建报表 403 | false |
| content_reviewer | 200 | 200 | 路线上下架 403 | false |
| operator | 200 | 200 | 创建报表 201，随后删除 | false |
| super_admin | 200 | 200 | 读取用户 200 | true |

- 路线动作权限拒绝审计：HTTP 403；AuditLog `resource_type=routes`、`resource_id=bafen-shanlu`、`result=rejected`、requestId 命中。
- 审计实现修复为：路线动作成功由领域事务记录，拒绝由统一拦截器记录，避免成功重复且不漏拒绝。
- 四个测试账号、session、审计和临时报表清理后均为 0。

## 前后端联合浏览器 E2E

- 同时运行 NestJS API 与 Admin Vite 开发服务，通过真实浏览器访问 `http://127.0.0.1:5174/`。
- 使用临时 `super_admin` 登录成功，进入路线页；角色、完整菜单、特权按钮和来自 MySQL 的 6 条路线均正确显示。
- 点击退出后返回 `/login`，登录表单恢复未认证状态。
- E2E 完成后关闭浏览器与开发服务；QA 管理员、session 和 RBAC 审计复核均为 0。

## 重要发现

- Windows 上并发运行两个带 `prisma generate` 的 API 验证任务会争抢生成目录；改为串行 generate 后稳定通过。CI 不应并发执行同一 workspace 的 Prisma generate。
- Docker 重启后 MySQL 8 完整认证可能要求 RSA 公钥；已通过仅限本地的 `DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL=true` 修复并复验，生产默认关闭且应使用 TLS/固定公钥。详见 `KB-SOL-001`。
