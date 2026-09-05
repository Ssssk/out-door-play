---
name: api-contract-design
description: 设计或变更 NestJS HTTP API 的 OpenAPI、DTO、错误码、认证、幂等与兼容契约，并核对 uni-app 调用模型；任何公开接口变化都应使用。
---

# API 契约设计

## 触发条件

- 新增、修改、弃用或删除 HTTP API、字段、错误码、认证方式或分页规则。
- uni-app 请求模型与 NestJS DTO 不一致，或旧客户端兼容策略需要调整。
- 内部接口被多个模块、后台管理端或第三方使用。

## 不适用场景

- 纯内部函数签名且不跨模块边界。
- RabbitMQ 事件契约；使用 message-contract。
- 需求和权限规则仍未确认。

## 前置 Gate

- 需求 Gate 已通过，接口相关 AC、调用方和数据口径明确。
- 影响分析已识别旧客户端、第三方和内部消费者。
- 破坏性变更必须有人工批准的版本或迁移策略。

## 必读上下文

1. `rules/06-API与错误协议规范.md`、`rules/11-安全与隐私规范.md`。
2. `wiki/05-接口协议.md`、`wiki/09-认证与权限模型.md`、`wiki/10-错误码模型.md`。
3. 当前 `contracts/openapi.yaml`、`error-codes.yaml`、需求、AC、设计和影响分析。
4. NestJS Controller/DTO/Presenter 与 uni-app `api/`、types、调用页面。
5. 历史 API 事故、兼容模式和相关 Change。

## 输入

- 业务能力、调用角色、权限、业务规则和目标端。
- 请求/响应数据口径、并发控制、幂等需求和兼容窗口。
- 预期流量、超时、限流和可观测性要求。

## 执行步骤

1. 选择资源导向 path、HTTP method 和稳定 `operationId`，避免动词堆叠与语义冲突。
2. 定义认证方式、资源授权、租户/用户数据范围和敏感字段处理。
3. 定义 path/query/header/cookie 参数，标明必填、类型、格式、枚举、范围和默认值。
4. 定义 request body schema，并区分缺失、null、空字符串、空数组和零值语义。
5. 定义每个成功状态码和响应 schema；创建、异步受理、无内容分别使用正确语义。
6. 定义可预期业务错误、校验错误、认证授权、冲突、限流和服务异常错误码。
7. 为列表定义游标或页码、稳定排序、过滤、总数成本和最大 page size。
8. 为写操作定义幂等键、重复请求响应、冲突版本和乐观锁行为。
9. 定义超时、取消、可重试性和客户端错误提示映射。
10. 比较旧契约，分类 additive、compatible-deprecation 或 breaking；给出共存窗口。
11. 更新 OpenAPI 与错误码契约，再映射到 NestJS DTO/Swagger 装饰器和前端 TypeScript 类型。
12. 建立 FR/AC → operationId → 契约/集成/E2E 测试的追踪。

## 技术约束

- 全局 ValidationPipe 使用 whitelist、forbidNonWhitelisted 和必要 transform；DTO 必须有运行时校验。
- 不直接返回 TypeORM Entity；使用明确 Presenter/Response DTO，避免字段意外泄漏。
- 数据库 bigint/雪花 ID 对 JSON 客户端输出字符串；金额不用二进制浮点。
- 时间使用 ISO 8601 并声明 UTC 或业务时区；日期和时间点不得混用。
- 新增响应字段默认应可被旧客户端忽略；新增必填请求字段属于破坏性变化。
- 禁止自由 `object`、无约束 `additionalProperties` 或只描述 200 成功路径。
- 错误响应结构至少包含稳定 code、可展示 message 策略、requestId 和必要 details。
- uni-app 不直接展示服务端未知异常文本；通过稳定错误码映射中文提示。

## 产物

- `contracts/openapi.yaml`、`contracts/error-codes.yaml`。
- operationId、权限、幂等、并发、分页、弃用和兼容说明。
- NestJS DTO/Presenter 与前端请求/响应类型的映射表。
- 契约测试清单和追踪矩阵更新项。

## 验证与证据

- OpenAPI 通过语法和 schema 校验，所有引用可解析。
- 对照实现验证 method/path/status/header/body 和错误码一致。
- 使用非法、边界、无权限、重复、冲突、超时和旧客户端请求验证契约。
- 生成或编译前端类型，确认 bigint、nullable、枚举和可选字段未失真。

## 停止与升级条件

- 权限、数据口径、幂等或兼容策略未确定。
- 发现无法兼容的公开接口删除、字段改义或错误码重用。
- API 需要暴露敏感数据、生产内部标识或未经批准的管理能力。
- 实现限制迫使改变 AC 或业务规则。

## 禁止事项

- 不用 HTTP 200 包装所有业务和系统错误。
- 不把 Controller 中临时对象当作正式契约。
- 不删除旧字段后要求用户“同步升级”而没有发布窗口。
- 不从 TypeScript 类型推断运行时输入已经安全。

## 完成定义

OpenAPI、错误码、NestJS DTO 和 uni-app 类型语义一致；成功与失败路径完整；认证、幂等、并发和兼容策略可验证；需求到契约测试可追踪；API 评审具备全部证据。
