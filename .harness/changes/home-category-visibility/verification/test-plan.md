# 测试计划

> 需求 Gate / 设计 Gate 已批准。2026-11-08 已执行单元测试、契约测试、类型检查与双端构建（见 `evidence/2026-11-08-implementation.md`）；集成测试、E2E、性能、可访问性与 UAT 仍为 `not-run`。禁止把计划、模拟输出或旧报告写成执行证据。

| 测试 ID | 关联需求/验收 | 层级 | 环境 | 前置数据 | 预期 | 自动化 |
|---|---|---|---|---|---|---|
| TEST-UNIT-001 | FR-CFG-001、FR-CFG-007、AC-CFG-001、AC-CFG-009 | 单元 | Node/Vitest | 无配置记录、正常配置 | 未配置返回 DEFAULT（仅 drive 启用）；公开投影只含启用项、按 sort/scene 稳定排序 | 是 |
| TEST-UNIT-002 | FR-CFG-003、FR-CFG-005、FR-CFG-009、AC-CFG-003、AC-CFG-004、AC-CFG-005 | 单元 | Node/Vitest | 隐藏 fish、存在 fish 在线数据 | 列表/收藏用例短路返回空数组；详情用例不调用配置服务 | 是 |
| TEST-UNIT-003 | FR-CFG-004、FR-CFG-006、AC-CFG-008 | 单元 | Node/Vitest | 各类非法 items | 未知 scene、重复 scene、空/超长 label、非整数 sort、额外字段、0 启用项均被拒绝 | 是 |
| TEST-UNIT-004 | FR-CFG-007、NFR-RELI-001、AC-CFG-010 | 单元 | Node/Vitest | 缺字段/类型错/未知 scene/0 启用项 JSON | 返回 DEFAULT 并记录 `scene_tabs_config_invalid`，不抛未处理异常、不改写 DB | 是 |
| TEST-UNIT-005 | FR-CFG-008、NFR-RELI-001、AC-CFG-006、AC-CFG-007、AC-CFG-011 | 组件/单元 | Vitest + uni-app 组件测试 | 404 / 5xx / 超时 / 并发 onShow / 卸载 | 复用 inflight、返回 cached 或 DEFAULT、卸载后不写状态、隐藏场景不被预取 | 是 |
| TEST-UNIT-006 | NFR-OBS-001、FR-CFG-011、AC-CFG-019 | 单元 | Node/Vitest | 五类事件触发 | 事件名可检索、含 requestId/traceId、不含 Secret 与完整用户输入 | 是 |
| TEST-INT-001 | FR-CFG-003、FR-CFG-005、FR-CFG-009、AC-CFG-003、AC-CFG-004、AC-CFG-005 | 集成 | 容器化 MySQL + Nest 测试应用 | 真实 `system_configs` 记录、`Discovery`/收藏种子数据 | 隐藏场景列表 200 空数组、详情 200 有数据、取消隐藏后收藏可原样返回 | 是 |
| TEST-INT-002 | FR-CFG-004、FR-CFG-006、NFR-SEC-001、AC-CFG-008、AC-CFG-012 | 集成 | 容器化 MySQL + 真实 Guard | 只读账号与写账号、非法 payload | 403 / 422 稳定错误码，配置记录无变化，响应不返回原始实体 | 是 |
| TEST-INT-003 | FR-CFG-007、NFR-PERF-001、AC-CFG-010、AC-CFG-019 | 集成 | 容器化 MySQL | 无记录、损坏记录、压测数据 | 读取端兜底；单次主键读耗时用于 P95/P99 采样 | 是 |
| TEST-INT-004 | FR-CFG-011、AC-CFG-013、AC-CFG-014 | 集成 | 容器化 MySQL，并发请求 | 同一 `expectedUpdatedAt` 的两个 PUT | 第一次成功且 revision+1，第二次 409；三次快速点击只写一次 | 是 |
| TEST-CT-001 | FR-CFG-001、FR-CFG-002、AC-CFG-017 | 契约 | `apps/api` 构建产物 | 本 Change `contracts/openapi.yaml` 已登记 `contractPaths` | `pnpm test:contract` 退出码 0 且覆盖 3 个 operation；移除登记后不再覆盖（反证） | 是 |
| TEST-E2E-001 | FR-CFG-001、FR-CFG-008、NFR-A11Y-001、AC-CFG-001、AC-CFG-002、AC-CFG-007、AC-CFG-018 | E2E | 微信小程序体验版/真机 + H5 冒烟 | 默认配置 / 修改后配置 | 分类、顺序、名称、吸顶、下拉刷新、选中态校正、a11y 属性符合 AC | 部分人工 |
| TEST-E2E-002 | FR-CFG-002、FR-CFG-004、FR-CFG-010、FR-CFG-011、AC-CFG-002、AC-CFG-008、AC-CFG-012、AC-CFG-014、AC-CFG-015 | E2E | Chrome + 测试环境后台 | 只读/可写账号、城市种子数据 | 保存、权限、校验、409、重复提交、恢复默认、城市页文案与行为 | 是 |
| TEST-E2E-003 | FR-CFG-005、FR-CFG-008、NFR-COMPAT-001、NFR-RELI-001、AC-CFG-005、AC-CFG-011、AC-CFG-016 | E2E | 四组合环境（旧/新包 × 旧/新服） | 默认配置、一条分享链接 | 四种组合首页仅 drive、详情可开、新包+旧服静默回退 | 部分人工 |
| TEST-PERF-001 | NFR-PERF-001、NFR-OBS-001、AC-CFG-019 | 性能 | 容器化 MySQL，20 RPS × 5min | 已配置记录 | P95 ≤ 200ms、P99 ≤ 500ms、错误率 < 0.1%，日志无敏感字段 | 是 |
| TEST-A11Y-001 | NFR-A11Y-001、AC-CFG-018 | 可访问性 | 小程序目标端 + Chrome | 多分类配置 | tablist/tab/aria-selected 保留、70rpx 触控、键盘焦点可见 | 人工 |
| TEST-UAT-001 | FR-CFG-001、FR-CFG-005、NFR-COMPAT-001、AC-CFG-001、AC-CFG-002、AC-CFG-005、AC-CFG-016 | 产品 UAT | 微信小程序体验版 | 默认 + 运营改配 | 产品签署分类显隐、名称排序、详情可达、兼容矩阵 | 人工 |
| TEST-UAT-002 | FR-CFG-002、FR-CFG-010、AC-CFG-015 | 产品 UAT | 测试环境后台 | 运营账号 | 产品签署配置页可用性与城市页文案修正 | 人工 |

## 单元与组件

- `SceneTabsConfigService`：投影、校验、损坏兜底、条件更新冲突。
- `RoutesService` / `UserService`：隐藏场景短路、详情不引用配置服务。
- `SceneTabs.vue`：props 渲染、空/单项/多项、a11y、点击节流、吸顶容器仍在。
- `useSceneTabs.ts` / `useDiscovery.ts`：去重、竞态、卸载、缓存 key、预取裁剪、选中态校正。

## MySQL/Redis/RabbitMQ 集成

- MySQL：`system_configs` 真实 upsert/create/条件更新、损坏 JSON、并发冲突、收藏数据不因隐藏被删除。
- Redis / RabbitMQ：`not-required`（DEC-008、ADR-006，本 Change 未引入），由设计 Gate 记录理由，不写假证据。

## API/事件契约

- `pnpm test:contract` 覆盖 `getPublicSceneTabs`、`getAdminSceneTabs`、`updateAdminSceneTabs`；并做「移除登记则不再覆盖」的反证，防止白名单漏登记。
- 契约用例覆盖 200 / 403 / 409 / 422、请求体边界（空数组、null `expectedUpdatedAt`、额外字段）与响应 schema。
- 无事件契约（`contracts/events.yaml` 为空）。

## uni-app E2E 与目标端

- 主目标端微信小程序：体验版扫码 + 真机，覆盖 `AC-CFG-001`、`AC-CFG-002`、`AC-CFG-005`、`AC-CFG-007`、`AC-CFG-018`。
- H5 构建与冒烟：证明不因条件编译/平台属性导致构建失败。
- 后台 E2E：Chrome，覆盖保存链路与权限。
- 不得只验证 H5 就宣称小程序通过（`AGENTS.md` §6 红线 11）。

## UI/UX 与可访问性

- 见 `verification/accessibility-test.md`、`frontend/ui-ux-review.md`；截图只证明可视状态，不能替代接口与数据验证。

## 性能、容量和耐久

- 见 `verification/performance-test.md`；压测结果绑定 SHA、命令、环境、时间与退出码。
- 无独立 APM 时的生产观测缺口由 Operations Gate 显式裁决，不写成已通过。

## 安全与软件供应链

- 越权、注入、输入校验、错误码、日志脱敏见 `verification/security-review.md` 与 `security/supply-chain-review.md`。
- 无新增第三方依赖；仍执行现有 CI 的静态检查、lint、typecheck 与构建。

## 产品 UAT

- 见 `verification/product-uat.md`；产品在小程序体验版与后台分别验收并签署，冻结候选制品后才进入发布 Gate。

## 迁移、备份恢复和故障演练

- 无 schema 迁移；演练内容为损坏配置兜底与「恢复默认」前向修复，见 `backend/migration-plan.md` 与 `operations/disaster-recovery.md`。

## 影响面和核心回归

- 直接：首页分类、收藏页分类、后台配置页、公开/管理端配置接口、列表与收藏查询。
- 上下游：`GET /v1/routes`、`GET /v1/user/favorites`、两个详情页、路线地图页、分享链接、城市管理页、`listCache`。
- 共享能力：`request` 封装、`listCache`、`PageHeader`、`apiGet/apiPut`、admin Guard、`components.d.ts`（构建自动生成，需检查新增组件声明未被误删）。
- 历史缺陷回归：配置失败不白屏、小程序属性 camelCase 透传、H5/MP 双端构建、契约登记不漏检。
- 核心业务链路：进入首页 → 切分类 → 打开详情 → 收藏 → 分享 → 从分享返回。

## 不稳定测试治理

- 异步用例使用可观察条件与有限超时，禁止任意 `sleep`；并发用例以数据库最终状态与 HTTP 响应为断言，不以请求顺序为断言。
- `onShow` 相关测试显式控制生命周期，避免依赖 30s 节流 `STALE_REFRESH_GAP_MS` 的真实时间推进。

## 退出标准

- 当前 SHA/制品：`not-run`（实现后绑定具体 SHA 与制品 digest）
- 必需 Evidence 类型：`static`、`unit`、`integration`、`contract`、`e2e`、`performance`、`accessibility`、`uat`、`security`、`operational-readiness`、`deployment`
- 允许 `not-required` 的批准人：产品 Owner（App 端）、架构 Owner（Redis/RabbitMQ）、Operations Owner（生产 APM 观测）、发布负责人（生产灰度指标）
- 所有失败用例必须记录 `failed` 与处置，不得删除、跳过或静默重跑制造绿色结果。
