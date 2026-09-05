# 影响分析

| 区域 | 变化 | 风险 | 验证 |
|---|---|---|---|
| Prisma/MySQL | AdminUser/Role/Permission/Session 及关系表；AuditLog actor 增强 | migration/唯一约束/回滚 | 空库升级、现有库升级、reconcile、回滚/前向修复 |
| NestJS | auth API、Guard、Policy、CSRF、限流、审计上下文 | 全 Admin API 行为从 200 变 401/403 | unit、module、MySQL integration、契约 |
| Vue Admin | login route/store、credentials、CSRF、菜单权限 | 冷启动 401 竞态、循环跳转 | store/router/client unit + E2E |
| CORS/Cookie | 同站优先、开发端口兼容 | Secure/SameSite/Origin 配置错误 | H5 浏览器矩阵、安全测试 |
| 运维 | bootstrap、账号禁用、会话撤销 | 默认账号泄露/恢复困难 | CLI dry-run、Runbook、审计 |
| Mobile | 无直接代码变化 | `/v1/me/permissions` 路径命名冲突 | 契约回归 |

P1 未修复前所有 Admin 写能力保持发布阻塞。
