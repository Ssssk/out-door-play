# 知识检索与沉淀

## 开始前检索

- 检索时间：2026-09-01（Asia/Shanghai）。
- 查询词与范围：移动身份/mobile identity、微信/code2Session、session、access/refresh、token hash、并发 401、收藏/favorite、水平越权、Prisma/MySQL/migration。
- 使用命令或方式：先读 `.harness/knowledge/index.yaml`，再以 `rg --hidden -n -i` 检索 `.harness/knowledge`、`.harness/wiki`、`.harness/changes`，并回查当前 Prisma schema、user/mobile 代码和相似 admin Change。
- 命中的知识 ID：`ADR-006`（verified）、`KB-INBOX-003`（draft）、`KB-INBOX-005`（draft）、`KB-INBOX-006`（draft）。

## 适用性判断

- `ADR-006`：直接适用。2026-08-30 verified，当前同为 NestJS/Prisma/MySQL 模块化单体；采用保留 Prisma、无真实用例不引入 Redis/MQ。它覆盖 database-migration Skill 中 TypeORM 默认术语。
- `KB-INBOX-003`：需验证后适用。采用其“初始化与 refresh 分离、single-flight、最多一次读重放、写不重放”作为测试假设；状态仍为 draft，不能替代当前实现测试。
- `KB-INBOX-005`：仅供边界参考。本 Change 没有批准离线写队列，因此采用“不自动排队/重放写请求”，不实现 command queue。
- `KB-INBOX-006`：仅作安全检查清单。采用“客户端登录/隐藏按钮不是授权边界、H5 不替代微信真机”的规则，但其状态 draft，不宣称已在本 Change 验证。
- `KB-SOL-001`：对 Docker/Prisma/MySQL RSA 故障可能相关，但当前症状是 Docker 引擎未就绪而非 RSA 握手；本轮不采用该修复。

## 过程中发现

- 原 Change 的 design Gate 标记 passed，但 `05-design.md`、AC、影响、任务和追踪矩阵仍是模板；属于 Gate/证据不一致。已于 2026-09-01 回退为 `requirements_ready + design pending`，等待用户架构批准。
- `source-baseline/gate-decisions` 使用 change 外相对路径和聊天描述，Harness 不接受为本地证据；已增加 change 内来源记录。
- 当前全局异常过滤器仍返回数值 HTTP code，不满足设计中的稳定字符串业务错误码；列为实现期契约同步项，尚未修改代码。
- database-migration Skill 写 TypeORM，与批准 Prisma 基线冲突；服从 `AGENTS.md`/`ADR-006` 并在 migration plan 显式记录。
- 是否满足强制沉淀条件：当前形成关键架构设计，但尚未批准/验证，不创建 verified Knowledge；保留在 Change 内。

## 完成时沉淀

- 新增/更新知识 ID：pending；Change 完成时根据并发 refresh、微信适配和客户端 single-flight 的真实证据决定是否晋级 `KB-INBOX-003` 或新建记录。
- 知识状态与验证证据：not-run。
- Wiki 同步项：只有设计批准、实现生效且验证后，才更新认证/权限、数据模型、接口和错误码 Wiki。
- 无需沉淀时的理由：当前仍在 Design Gate，不能把候选方案写成已验证事实。
