# 测试计划

| ID | AC | 层级 | 场景 | 状态 |
|---|---|---|---|---|
| AUTH-UNIT-001 | AC-AUTH-001 | unit | scrypt hash/verify、统一失败、锁定边界 | partial：hash/verify 3 tests passed；账号锁定待 service integration |
| AUTH-UNIT-002 | AC-SESSION-001 | unit | idle/absolute/revoke/disabled | partial：active/revoked/idle/absolute 4 tests passed；disabled 走相同 service 分支，待 DB integration |
| AUTH-INT-001 | AC-SESSION-001 | MySQL integration | session hash、索引、撤销、migration | passed-local：首次/重复 deploy、真实 login/session/logout、1/1 revoked |
| AUTH-SEC-001 | AC-RBAC-001 | module/security | anonymous/analyst/reviewer/operator/super_admin 权限矩阵 | passed-local：四角色真实登录/读取/代表性写操作矩阵通过；权限常量单测通过 |
| AUTH-SEC-002 | AC-CSRF-001 | security | missing/forged token、bad Origin、无数据变化 | partial：forged token guard test passed；无数据变化待 integration |
| AUTH-AUDIT-001 | AC-AUDIT-001 | integration | actor/action/resource/requestId/result/脱敏 | passed-local：成功与拒绝均持久化；actor/resource/result/requestId 命中，测试数据已清理 |
| AUTH-E2E-001 | AC-UI-001 | browser E2E | login、refresh、logout、expiry、403 | passed-local：真实浏览器登录后进入路线页，菜单/角色/6 条 MySQL 数据与特权按钮可见；退出后回到登录页；expiry/403 已由模块与 HTTP 集成覆盖 |

不得使用硬编码默认密码或生产账号；测试时间、随机数和 session 由可控 provider 固定。
