# CHG-MOBILE-DISCOVERY-001 mobile-discovery：原始请求

## 来源

- 提出人：用户（项目负责人）
- 日期：2026-09-05
- 关联 Change：`CHG-OUTDOOR-V110-001` 的 `FR-PLAN-001` 推荐首个移动端发现切片
- `source-baseline.json` 来源 ID：`SRC-DISCOVERY-USER-001`、`SRC-DISCOVERY-PRD-*`、`SRC-DISCOVERY-CODE-001`
- 原始版本/哈希：PRD v1.1.0 四份页面需求 SHA-256 已固定；代码为 `HEAD a2a56a7... + uncommitted-worktree`

## 业务目标

匿名移动端用户可以按已开通城市与 `drive/fish` 场景浏览服务端公开的路线/钓点列表，进入对应详情，并在 API 失败时获得明确、可恢复的 loading/empty/error/fallback 状态。城市、场景、列表顺序和详情内容由稳定契约约束，H5 与微信小程序复用同一业务逻辑。

## 当前现状与证据

- `apps/mobile` 已有首页、场景切换、内联城市抽屉、路线/钓点详情和本地 fallback；详情收藏由 `CHG-MOBILE-IDENTITY-001` 接入服务端真相。
- `GET /v1/cities`、`GET /v1/routes`、`GET /v1/routes/:id`、`GET /v1/spots/:id` 已存在，但 discovery 公开契约未冻结，城市 Controller 直接访问 Prisma，列表排序只有 `rank desc + id asc`。
- 首页城市抽屉只读静态 mock，未消费 `/v1/cities`；列表请求无可取消边界，空列表没有独立 empty UI；详情 API 失败会静默替换为本地内容，用户无法区分陈旧 fallback。
- 当前 schema 已足以表达此切片，不需要新增表、Redis 或 RabbitMQ。

## 初始范围

- 包含：首页品牌/城市入口、城市候选、drive/fish 场景、公开列表、路线详情、钓点详情、loading/empty/error/fallback、H5/微信构建、API/组件/集成/E2E 验证。
- 包含：只读公开接口的 DTO、Presenter、稳定错误码、排序/分页上限和运行时 OpenAPI 差异测试。
- 复用但不重新设计：已实现的登录、资料、收藏会话与授权写接口。
- 不包含：真实定位个性化距离、油价/加油站、运营端内容编辑、评论/组队/UGC、生产发布、真实地图供应商 SDK、Redis/MQ。

## 约束与风险

- 目标平台：H5 + 微信小程序；微信构建不替代真机验收。
- 服务端 MySQL 是公开内容真相；本地 fallback 只能明确标识为降级内容，不能与最新服务端内容混淆。
- 不读取或发送真实位置；`distanceKm` 仅使用运营维护的当前字段，不能宣传为实时“距你”。
- 工作树包含用户未提交实现，只做小步增量，不覆盖重写现有页面。
- PRD 内城市入口、Mock/服务端真相和地图入口存在冲突，见 `01-clarification.md`。

## 成功信号

- 相同 city/scene 查询返回确定顺序，未知参数返回稳定 422，未上架资源不泄露。
- UI 能区分首次 loading、真实 empty、失败 fallback 与重试；快速切场景/城市不会被旧响应覆盖。
- route/spot 详情按 ID 和场景隔离，404 使用稳定公开错误码。
- 单元、组件、契约、MySQL 集成和 H5 E2E 通过；H5/微信构建通过。

## Change 分类与强度

- 类型：feature
- 风险：high（跨 mobile/API，且原始来源冲突）
- Gate：Requirements、Design、Implementation、Verification、Security、UAT；无数据迁移与新基础设施时 Operations 候选 not-required，仍由 Owner 裁决。

