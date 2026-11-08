# 影响分析

以 2026-11-08 当前工作树为事实基线（含 `CHG-HOME-CATEGORY-001` 未提交的实现）。

| 区域 | 是否影响 | 当前事实 | 拟议变化 | 风险 | 验证 |
|---|---|---|---|---|---|
| Prisma schema / MySQL | 是 | `enum Scene {drive fish}`；`discoveries.scene`、`rankings.scene` 为 ENUM；`Discovery` 无子类型字段；索引 `(city_code, scene)` | 新增 `play` / `wash` enum 值（保留 fish）、`sub_type` 可空列与 `(city_code, scene, sub_type)` 索引 | P1：生产 ENUM 变更不可逆、大表 DDL 锁与复制延迟 | `AC-EXP-005`、`AC-EXP-006`、`AC-EXP-015` |
| 数据回填 | 是 | seed 30 条（fish 3 条）、2 条 fish ranking、4 城市 `City.scenes` 含 fish、`SystemConfig.scene_tabs` 有 fish 项 | 预览 + 幂等回填：`fish → play/fishing`，同步 ranking/城市 JSON/配置/seed；`favorites` 无需改行 | P1：漏迁或重复执行导致分类错乱、分享死链 | `AC-EXP-005`、`AC-EXP-007`、`AC-EXP-008` |
| 后端 DTO 与白名单 | 是 | 至少 12 处 `@IsIn(['drive','fish'])`：routes/user/admin/config 等 | 统一扩为 drive/play/wash（fish 读兼容），新增 `subType` 校验与组合规则 | P1：漏改导致 422 或绕过校验 | `AC-EXP-003`、`AC-EXP-012` |
| 后端服务与 Repository | 是 | `routes.service.ts:27-33` 把 route/spot 与 drive/fish 硬绑定；`prisma-discovery.repository.find(id, scene)` 单 scene 过滤；`user.service.ts` 二元 `type`/subtitle | 详情按 scene 集合 + subType 放行；列表/收藏按新枚举与子类型过滤；投影逻辑保留钓点专属字段 | P1：详情死链；P2：投影字段错乱 | `AC-EXP-007`、`AC-EXP-008`、`AC-EXP-009` |
| HTTP 契约 | 是 | `/v1/routes`、`/v1/user/favorites`、`/v1/config/scene-tabs`、管理端 routes/config 接口 | scene 枚举扩展、可选 `subType` 参数、scene_tabs 默认 3 项、`@ArrayMaxSize(3)`；新增错误码 | P2：契约未登记导致假通过 | `AC-EXP-013` |
| 小程序页面与组件 | 是 | `pages.json` 只有 route-detail / fishing-detail；首页与收藏页按 `scene === 'fish'` 二元分流；`SceneTabs.vue` 与 `useSceneTabs.ts` 白名单 drive/fish | 3 个分类 tab、卡片 `subType` 标签、按 scene+subType 分流；不新增详情页（DEC-E07） | P2：分流错误导致钓鱼详情打不开 | `AC-EXP-001`、`AC-EXP-007`、`AC-EXP-014` |
| 小程序 mock / 分享 | 是 | `mock.ts` 3 条 fishingSpots；`fishing-detail` 用 `?spotId=`；`route-detail` 用 `?routeId=` | mock 数据补 `scene=play, subType=fishing`；分享参数保持不变 | P1：分享链接失效 | `AC-EXP-007` |
| 运营后台 | 是 | `RoutesView.vue` 到处是 fish/drive 二元假设（tab、按钮、表单、payload）；`SceneTabsConfigView.vue` 默认 2 项；城市页/榜单页场景下拉 | 3 tab + 二级子类型筛选 + 3 个新建按钮 + 表单场景/子类型；配置页默认 3 项；城市/榜单同步 | P2：表单二元分支漏改导致字段丢失 | `AC-EXP-002`、`AC-EXP-004`、`AC-EXP-011` |
| 权限/隐私 | 是（复用） | `route:read/edit`、`config:read/write`、admin Guard | 不新增权限码；回填与配置保存记录操作者与时间 | P2：越权写入 | `AC-EXP-016` |
| 旧小程序包 / 消费者 | 是 | 旧包只认 drive/fish；`GET /v1/config/scene-tabs` 可能 404 | 兼容期接受 `scene=fish` 并映射；**两层默认**：服务端默认 3 项，新包 + 旧服降级到仅 `drive`，不向旧服请求 `scene=play` | P1：滚动期 422 / 白屏 | `AC-EXP-009`、`AC-EXP-014` |
| UI/UX、文案、可访问性 | 是 | 品牌文案只有「粗门溜车/粗门钓鱼」；tab 已有 `role`/`aria-selected` | 新增 3 个品牌文案与子类型文案；空态文案；保留 a11y 属性 | P2：空 tab 无引导 | `AC-EXP-004`、`AC-EXP-016` |
| CI / 契约 / 供应链 | 是 | `contractPaths` 硬编码白名单；无新增依赖 | 登记本 Change 契约；不新增第三方依赖 | P2：假通过 | `AC-EXP-013` |
| 发布、监控、Runbook | 是 | 服务器部署不改手机端代码包；现有 Nest 日志 | 发布顺序含 Migration 与维护窗口；增加兼容映射/回填事件日志；Runbook 含恢复演练 | P1：生产回填无授权或无恢复能力 | `AC-EXP-006`、`AC-EXP-016` |
| 已批准 Change 冲突 | 是 | `CHG-HOME-CATEGORY-001` DEC-004 / DEC-010 / FR-CFG-006，状态 `implementing` | 本 Change 按 2026-11-08 裁决修订其白名单与默认配置；旧 Change 并入本 Change、不单独发布（DEC-E10 / 方案 A） | 冲突已逐条裁决，待 Gate 书面确认 | `01-clarification.md` 冲突登记表与裁决记录 |

## 停止与升级条件

- 冲突条目未由产品 Owner 与架构 Owner 裁决前，不开始编码、不执行 Migration。
- 生产回填无明确授权、无备份点、无恢复演练结论时，发布 Gate 保持 `pending`。
- 发现需要移除 `fish` enum 值、新增第三层 UI 或引入新基础设施时，回到 `clarifying` 并升级给架构 Owner。
