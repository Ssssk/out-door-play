# 测试计划

| 测试 ID | 关联需求/验收 | 层级 | 环境 | 前置数据 | 预期 | 自动化 |
|---|---|---|---|---|---|---|
| UT-IDP-001 | FR-IDENTITY-001 / AC-IDENTITY-LOGIN-001 | 单元 | Node | provider fake | 微信成功/无效/超时/畸形响应安全映射 | 是 |
| UT-SESSION-001 | FR-IDENTITY-001 / AC-IDENTITY-SESSION-001 | 单元 | Node | fixed clock/random | token 生命周期、摘要、撤销/过期状态正确 | 是 |
| UT-GUARD-001 | NFR-SEC / AC-AUTHORIZATION-001 | 单元 | Nest test | session repo fake | 缺失/失效/封禁 401，principal 只来自 Guard | 是 |
| UT-USER-001 | FR-PROFILE-001 / AC-PROFILE-001 | 单元 | Node | profile repo fake | trim/边界/非法头像/失败不写 | 是 |
| UT-FAV-001 | FR-FAVORITE-001 / AC-FAVORITE-001 | 单元 | Node | discovery/favorite fake | online、404、重复新增/删除确定结果 | 是 |
| UT-CLIENT-001 | NFR-REL / AC-CLIENT-SESSION-001 | 单元 | Vitest/uni mock | 20 个并发 401 | 一次 refresh，读最多重放一次，写不重放 | 是 |
| CT-OPENAPI-001 | 全部 API AC | 契约 | Nest runtime | OpenAPI delta | method/path/security/status/schema/error code 一致 | 是 |
| IT-MIG-001 | FR-IDENTITY-001 | MySQL 集成 | 隔离 MySQL 8.4 | 空库+现有 migration | deploy/status/generate/索引/外键通过 | 是 |
| IT-REFRESH-001 | AC-IDENTITY-SESSION-001 | MySQL 并发 | 隔离 MySQL 8.4 | 一个 refresh token | 并发 20 次只有 1 成功，旧 pair 全失效 | 是 |
| IT-AUTHZ-001 | AC-AUTHORIZATION-001 | API/MySQL | 双 dev 账号 | A/B 资料与收藏 | 匿名 401，A 不能读写 B，DTO 不接受 userId | 是 |
| IT-FAV-001 | AC-FAVORITE-001 | API/MySQL | online/offline discovery | 同一收藏并发写 | 唯一关系、确定状态、不可见 404 | 是 |
| E2E-H5-001 | AC-TARGET-001 | E2E | H5 + dev API + MySQL | dev A/B | 登录、改昵称、收藏、退出与失败路径闭环 | 是 |
| BUILD-WX-001 | AC-TARGET-001 | 构建 | 微信构建 | 无 Secret | 编译通过且前端包无 AppSecret/HMAC key | 是 |
| UAT-WX-001 | AC-TARGET-001 | 真机 UAT | 微信真机/正式配置 | 受控测试账号 | code2Session、恢复、弱网、退出 | 人工；当前 pending |
| SEC-001 | NFR-SEC | 安全 | 候选制品 | 双账号/扫描配置 | Secret/SAST/SCA/SBOM、日志与 dev fail-closed 通过 | 混合 |

## 单元与组件

- 固定 Clock/ID/Random；不访问真实微信或网络。
- 对 token 明文不落库、错误不含平台响应、用户禁用、昵称边界、收藏重复与 client 竞态做可观察断言。
- 有意破坏 refresh 原子条件或允许写重放时测试必须失败。

## MySQL 集成

- 使用 compose 的隔离 MySQL 8.4，不连接生产；migration 后生成 dev A/B 与 online/offline Discovery。
- 验证唯一约束、外键、轮换条件更新、回滚、封禁、双账号隔离与清理。
- 2026-09-05 Docker 恢复后已在本地隔离 MySQL 8.4 执行：migration 首次应用与重复 deploy、20 路 refresh、双账号隔离和 10 路并发收藏均通过。GitHub CI 空库容器仍待远端 run 证据。

## API/事件契约

- 将 delta OpenAPI 与 Nest runtime Swagger 比对，验证 Authorization、未知字段拒绝、401/404/422/429/503 和稳定 code。
- 本 Change events 为空，RabbitMQ 测试为 not-required 候选，需架构 Gate 批准而非伪造空测试。

## uni-app E2E 与目标端

- H5 只用 dev provider，覆盖登录、profile、favorite、logout、刷新失败和服务端失败不假成功。
- 微信构建检查不包含 Secret；真机 UAT 必须有正式凭证/设备/版本/网络记录。H5 不替代。

## UI/UX 与可访问性

- 检查 loading/error/anonymous/expired/pending/empty；昵称错误关联；触控区域、键盘遮挡、错误不只靠颜色。

## 性能、容量和耐久

- 无批准生产 SLO，不宣称性能 Gate 通过。至少测 provider 5 秒超时、单次 session 索引查询和 20 并发 refresh 正确性。

## 安全与软件供应链

- 扫描 AppSecret/HMAC key/token/OpenID/session_key；检查日志脱敏、生产 dev endpoint 404、水平越权、refresh 重放。
- 执行现有 Secret/SAST/SCA/SBOM；P0/P1 或未处置 high 阻塞 Security Gate。

## 产品 UAT

- H5 与微信分别记录候选 SHA、环境、账号、执行人和结果；微信正式能力当前 pending。

## 迁移、备份恢复和故障演练

- 空库/现有库 migration；应用回滚保留表；全量 session 撤销演练只在隔离库。
- 生产备份/RPO/RTO 未定义，Operations/Release 不能通过。

## 影响面和核心回归

- 公开 cities/routes/spots/fuel 仍匿名可读；Admin auth/RBAC 不受 mobile Bearer Guard 影响；H5/微信/Admin/API 构建不回归。

## 不稳定测试治理

- 禁止任意 sleep；并发测试等待可观察 Promise/数据库条件并设置有限超时。首次失败保留，不能重跑到偶然绿色。

## 退出标准

- 当前 SHA/制品：`HEAD a2a56a79851bda3ca129f27e63b3cf17b02a8b8b` + 未提交工作树，处于 implementing；已有本地构建制品但尚未冻结发布候选。
- 必需 Evidence：命令、环境、commit、时间、退出码、报告；MySQL/HTTP/E2E/微信真机分别留证。
- 允许 not-required 的批准人：架构 Owner（Redis/MQ/performance）、Operations Owner（运营项）、产品 Owner（UAT 场景）；Codex 不代签。
