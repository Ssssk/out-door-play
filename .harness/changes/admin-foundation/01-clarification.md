# 澄清与推荐决策

| ID | 问题 | 推荐基线 | Owner | 状态 |
|---|---|---|---|---|
| AUTH-Q-001 | 管理员登录标识 | 唯一 `username`，不强制收集邮箱/手机号 | 用户 | closed：批准 |
| AUTH-Q-002 | 初始账号交付 | 一次性 CLI 从环境变量读取密码；禁止 seed/hardcode 默认密码 | 用户 | closed：批准 |
| AUTH-Q-003 | 会话时长 | 2 小时空闲、12 小时绝对过期；敏感操作后续可要求重认证 | 用户 | closed：批准 |
| AUTH-Q-004 | 角色集合 | super_admin、operator、content_reviewer、analyst；权限细粒度分配 | 用户 | closed：批准 |
| AUTH-Q-005 | 部署同站策略 | Admin 与 API 优先同站反代；跨站部署需单独 Cookie/CORS/CSRF 设计 | 用户 | closed：批准 |
| AUTH-Q-006 | MFA | 首期非目标；Security Owner 可因部署风险提升为必需 | 用户 | closed：首期非目标 |

2026-08-30 推荐项已由用户批准，可进入实现；Security Gate 仍需独立复验。
