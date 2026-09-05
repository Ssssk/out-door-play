# 验收标准

## AC-IDENTITY-LOGIN-001 微信登录与开发适配器边界

- **关联需求**：FR-IDENTITY-001、NFR-IDENTITY-SEC-001
- **GIVEN** 微信小程序取得一次性有效 code
- **WHEN** 客户端调用微信登录端点
- **THEN** 服务端通过 5 秒超时的 `code2Session` 交换身份，建立或复用本地用户，并只返回本系统 access/refresh token 与当前资料
- **AND** 响应、日志和数据库均不保存/暴露明文 AppSecret、`session_key`、OpenID 或 bearer token
- **AND** 无效 code、平台超时和平台错误映射为稳定错误码，不泄露微信原始响应
- **AND** 本地开发登录仅在 `NODE_ENV != production` 且显式开关开启时可用；生产配置必须 fail closed
- **验证方式**：provider 单元测试、API 契约、隔离 MySQL 集成、H5 开发 E2E、微信真机（正式凭证提供后）

## AC-IDENTITY-SESSION-001 会话轮换、撤销与禁用

- **关联需求**：FR-IDENTITY-001、NFR-IDENTITY-REL-001
- **GIVEN** 有效会话，access 生命周期 15 分钟、refresh 生命周期 30 天
- **WHEN** 同一 refresh token 被串行或并发使用多次
- **THEN** 只有第一次原子轮换成功，旧 access/refresh 立即失效，其余请求稳定返回 401
- **AND** 退出后该会话的 access/refresh 均失效；用户被封禁后其所有旧会话不能继续访问
- **验证方式**：单元、MySQL 并发集成、API E2E

## AC-AUTHORIZATION-001 服务端主体与资源隔离

- **关联需求**：FR-PROFILE-001、FR-FAVORITE-001、NFR-IDENTITY-SEC-001
- **GIVEN** 匿名请求、用户 A 与用户 B
- **WHEN** 调用资料或收藏读写端点
- **THEN** 匿名请求返回 401，用户 A 的请求只能读取/修改 A 的资料和收藏
- **AND** 请求 DTO/path/query 不接受目标 `userId`，直接构造跨用户请求也不能访问 B 的数据
- **验证方式**：Guard 单元、契约、双账号 MySQL 集成/E2E

## AC-PROFILE-001 当前用户资料读写

- **关联需求**：FR-PROFILE-001
- **GIVEN** 已登录普通用户
- **WHEN** 读取资料或提交 trim 后 1-16 字昵称及可选头像引用
- **THEN** 只返回/更新当前用户资料与统计；空昵称、超长昵称、未知字段或非法头像引用返回校验错误且数据不变
- **AND** 服务端失败时客户端保留表单、显示失败，不更新本地成功态
- **验证方式**：DTO/用例单元、MySQL 集成、H5/微信目标端人工验证

## AC-FAVORITE-001 收藏查询与幂等写入

- **关联需求**：FR-FAVORITE-001
- **GIVEN** 已登录用户与 online/offline/不存在的 Discovery
- **WHEN** 按 drive/fish 查询、收藏或取消收藏
- **THEN** 查询只返回当前用户对应场景的 online 项；重复收藏返回 `favorited=true` 且只保留一条关系，重复取消返回 `favorited=false`
- **AND** 不存在或不可见资源返回 404，客户端不得显示收藏成功或留下错误本地收藏态
- **验证方式**：用例单元、唯一约束/并发 MySQL 集成、H5/微信 E2E

## AC-CLIENT-SESSION-001 冷启动、401 与写请求恢复

- **关联需求**：NFR-IDENTITY-REL-001
- **GIVEN** 客户端冷启动或多个请求同时遇到 access 过期
- **WHEN** 恢复/刷新会话
- **THEN** 受保护请求等待同一个初始化/刷新 Promise，并发 401 至多产生一次 refresh
- **AND** 仅显式允许的幂等读请求最多重放一次；POST/PATCH/DELETE 不因 401 自动重放
- **AND** 刷新失败会清理两类 token、释放所有等待者并进入匿名态，不产生无限循环或卸载后回写
- **验证方式**：request/auth store 单元、H5 E2E、微信目标端验证

## AC-TARGET-001 目标端证据边界

- **关联需求**：FR-IDENTITY-001、FR-PROFILE-001、FR-FAVORITE-001
- **GIVEN** 候选构建与隔离测试环境
- **WHEN** 执行 H5 开发适配器流程和微信小程序流程
- **THEN** H5 可完成登录、改昵称、收藏、退出，微信小程序构建通过
- **AND** 在正式 AppID/AppSecret 与真机证据缺失时，微信 `code2Session` 联调和 UAT 必须保持 `pending/not-run`，不得用 H5 或模拟结果替代
- **验证方式**：H5 E2E、微信构建、微信真机人工 UAT

