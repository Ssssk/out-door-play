# Requirements / Design Gate 批准

- Change：`CHG-ADMIN-FOUNDATION-001`
- 批准人：用户（产品、架构与安全 Owner）
- 时间：2026-08-30
- 用户回复：`OK，开搞`
- 上下文：紧接在“Admin 采用 MySQL 不透明 Cookie 会话 + RBAC + CSRF”的明确批准请求之后，视为批准该推荐方案。

批准：username 登录；一次性 CLI bootstrap；2 小时空闲/12 小时绝对过期；super_admin、operator、content_reviewer、analyst；同站部署优先；首期不含 MFA；服务端默认拒绝、CSRF 与可信审计必须实现。
