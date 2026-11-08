# 安全评审

## 信任边界与数据流

- 公开边界：`GET /v1/config/scene-tabs` 无鉴权，只返回启用分类的 `scene` / `label` / `sort` 与 `revision` / `updatedAt`；不返回隐藏项、操作者、内部备注或 `SystemConfig` 原始实体。
- 管理边界：`GET/PUT /v1/admin/config/scene-tabs` 经过现有 Cookie 会话 + CSRF + `RequireAdminPermissions` Guard；写入由运营触发，落库到 `system_configs`。
- 强制点：隐藏场景的列表拒绝发生在服务端用例层（`RoutesService.list`、`UserService.favorites`），不依赖小程序隐藏 tab；`.harness/wiki/09-认证与权限模型.md:21` 明确「服务端必须对每个受保护用例重新授权」。
- 配置值不是权限数据，也不是业务真相的替代品；`system_configs` 随既有数据库备份。

## 身份、授权和资源级访问

- 复用既有权限码 `config:read`（GET）与 `config:write`（PUT），不新增权限码、不改角色映射（`admin-auth.constants.ts`）。
- 只读账号直接调用 PUT 必须返回 403；前端 `canWrite` 隐藏按钮只是体验优化。
- 首次保存（无记录）时的唯一键冲突不得被当成成功，统一按 409 处理。

## 输入、输出和外部访问

- DTO 运行时校验：`@IsIn(['drive','fish'])`、`@IsString` + 长度 1-12、`@IsInt` + `@Min/@Max`、`@ArrayMinSize(1)`、`@ValidateNested({ each: true })`、`forbidNonWhitelisted`。
- 业务校验二次执行：至少一个启用项、`scene` 不重复、`revision` 非负；`label` 去首尾空白后校验。
- `label` 为纯文本，前端插值渲染，不做 HTML 注入；响应不回显未知内部异常文本，只返回稳定错误码映射的中文提示。
- 无外部 HTTP 调用、无上传、无第三方写入。

## 敏感数据、Secret 和日志

- 不引入 Secret、Token 或新凭证；管理端沿用既有 CSRF 注入（`apps/admin/src/api/client.ts`）。
- 日志只记录事件名、`scene`、`revision`、操作者与 UTC 时间，不记录完整 `label` 原文、Cookie、CSRF Token 或请求体。
- 事件名：`scene_tabs_config_invalid`、`scene_tabs_config_rejected`、`scene_tabs_config_conflict`、`scene_tabs_list_denied`、`scene_tabs_config_updated`；低基数标签不含用户 ID。

## 依赖、上传、MQ 与部署权限

- 不新增第三方依赖、不改构建脚本、不引入上传接口、不引入 MQ、不需要生产数据库写权限的脚本。
- 部署沿用既有流程；配置变更由运营在后台完成，属于已授权的业务操作，但「恢复默认」等破坏性操作需二次确认。
- 供应链评审见 `security/supply-chain-review.md`。

| 风险 ID | 等级 | 条件与影响 | 证据 | 修复 | 状态 |
|---|---|---|---|---|---|
| R-001 | P1 | 只在客户端隐藏分类，接口仍能取到隐藏场景内容（伪安全） | `TEST-INT-001`（not-run） | 服务端用例层短路过滤 + 绕过客户端的集成测试 | 设计中已缓解，待实现验证 |
| R-002 | P2 | 并发保存静默覆盖，导致分类误下线 | `TEST-INT-004`（not-run） | `expectedUpdatedAt` 条件更新 + 409 提示与自动重拉 | 设计中已缓解，待实现验证 |
| R-003 | P2 | 配置 JSON 损坏或 0 个启用项导致首页无分类 | `TEST-UNIT-004`（not-run） | 读取端字段级兜底 + 保存时业务校验 | 设计中已缓解，待实现验证 |
| R-004 | P2 | 运营输入超长/异常字符造成存储或渲染异常 | `TEST-INT-002`（not-run） | DTO 长度与类型校验、纯文本渲染、日志脱敏 | 设计中已缓解，待实现验证 |
| R-005 | P3 | 隐藏分类的已收藏内容在收藏列表不可见引发用户困惑 | 产品 UAT（not-run） | 文案说明 + Q-003 产品决策，详情仍可打开 | 待产品裁决 |

## 残余风险与批准

- P0/P1 不得在 Security Gate 前保持未关闭；R-001 必须由 `TEST-INT-001` 的真实集成测试证据关闭。
- 结论：`pending`；安全 Owner 与独立 Reviewer 待 Security Gate 执行时指定，未执行任何安全测试，全部证据为 `not-run`。
