# 知识检索

- 查询：Admin、Guard、RBAC、session、Cookie、CSRF、401、冷启动、审计、Prisma。
- 命中：KB-INBOX-003（draft，401 single-flight）、KB-INBOX-006（draft，客户端授权反模式）、ADR-006（verified，Prisma/条件基础设施）。
- 采用：客户端权限不作安全边界；401 不无限重放；保持 Prisma、暂不引入 Redis。
- 限制：两个 KB 为 draft，只用于风险/测试清单；认证实现需由当前 Change 的测试和安全复验验证。
- 新增并验证：KB-SOL-001，记录 Docker 重启后 Prisma/MySQL 8 RSA 握手失败的诊断、安全边界与修复。
