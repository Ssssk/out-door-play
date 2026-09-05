---
id: KB-INBOX-008
title: OpenAPI 到 uni-app 生成链路的契约指纹与手写代码保护
type: pattern
status: draft
scope: [api, frontend, backend, codegen]
stack: [nestjs, openapi, typescript, uni-app]
tags: [codegen, fingerprint, breaking-change, generated-code, contract-test]
owner: unassigned
last_verified: null
related_changes: []
---

# 要解决的问题

从 NestJS/OpenAPI 生成 TypeScript 类型、请求方法、Mock 或 composable 能减少手写漂移，但生成器也可能静默改变 nullable、bigint、枚举、日期、错误结构和默认值，覆盖手写代码，或在前端自行发明服务端未声明的幂等/重试语义。

# 来源与证据等级

- 来源：`fullstack-api-codegen-onepiece-3.0.zip`，SHA-256 `e58f08d42a49de8ade5ffd725c97abf49e7a2bcbcb4f34ed3267e2dff38571b4`。
- 源包强调 schema fidelity、deterministic generation、protected custom code 和 breaking-change governance。
- 当前项目没有接入真实生成器，状态为 draft。

# 使用条件

- OpenAPI 是跨端 API 契约的单一规范来源，且已通过 API 设计 Gate。
- 需要为 uni-app 生成类型、请求层或测试 fixture。
- 团队能够固定生成器版本并在 CI 中审查 Diff。

# 实施方式

1. 规范化 OpenAPI 后计算契约指纹；记录 OpenAPI SHA、生成器名称/版本、配置 SHA 和依赖锁 SHA。
2. 生成到独立目录，不直接混入手写业务逻辑；生成目录顶部标注“禁止手改”。
3. 自定义请求适配、认证、错误映射和 UI composable 放在稳定手写层，通过生成类型组合。
4. 在临时目录生成并比较 Diff；只有评审后才替换正式生成物。
5. 执行 breaking-change 分类：删除/改义、必填请求新增、响应收窄、枚举收窄、错误码重用均需兼容计划。
6. 生成器只表达契约已有语义；不得自动为写操作添加重试、离线重放或幂等保证。
7. 后端 DTO/Presenter、OpenAPI、生成类型和运行时契约测试形成同一追踪链。

# NestJS/uni-app 技术约束

- NestJS 输入 DTO 使用运行时校验；生成的 TypeScript interface 不能替代 ValidationPipe。
- TypeORM bigint 对 JSON 使用字符串；Decimal、日期时间、nullable 与 missing 语义需要显式映射。
- 生成请求层不能直接展示未知服务端 message；使用稳定错误码映射。
- 生成物必须可重复：同一输入和工具版本运行两次无 Diff。
- 不将 Mock 通过视为后端实现契约通过。

# 风险和反例

- 反例：生成脚本直接覆盖 `src/api` 中的手写代码。
- 反例：只比较 TypeScript 编译结果，不检查 OpenAPI breaking change。
- 反例：生成器看到 POST 就默认自动重试或设置 idempotency key。
- 风险：生成器升级可能改变命名、nullable 或 union 表达，必须独立 Change。

# 验证清单

- OpenAPI lint/schema 校验通过，所有 `$ref` 可解析。
- 两次洁净生成哈希一致；正式目录与临时输出 Diff 已审查。
- 契约测试覆盖成功、输入错误、认证授权、冲突、限流和服务异常。
- 编译并运行至少一个 uni-app 实际调用路径，验证 bigint/日期/nullable/枚举。
- CI 对未提交生成 Diff、手改生成物和 breaking change 失败。

# 失效条件

- OpenAPI 版本、生成器、模板、TypeScript 或请求适配层升级。
- 服务端不再以 OpenAPI 为权威契约，或引入 GraphQL/gRPC 等新边界。

# 关联实现与证据

- `skills/api-contract-design/SKILL.md`
- `rules/06-API与错误协议规范.md`
- `skills/integration-e2e-test/SKILL.md`
- 晋级前需在真实仓库建立可复现 codegen 命令和 CI Diff 证据。

