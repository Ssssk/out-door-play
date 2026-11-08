# 需求澄清

## 决策日志

以下决策来自用户在本会话的明确口径（SRC-001、SRC-002、SRC-004）与当前代码事实（SRC-003）。来源与决策已于 2026-11-08T07:11:04Z 由用户回复「确认」在需求 Gate 书面核对，见 `approvals/2026-11-08-requirements-design.md` 与下方 Q 表。

| 决策 ID | 决策 | 理由 | 来源 | 状态 |
|---|---|---|---|---|
| DEC-001 | 只做首页内部分类目录（场景胶囊）的显隐、名称、排序；不改底部 `tabBar` | 用户截图指向首页分类胶囊；`tabBar` 由 `pages.json` 编译期决定，改它需要发版且是独立能力 | SRC-001、SRC-004 | closed |
| DEC-002 | 隐藏语义为「拒列表、留详情」：隐藏场景的路线/收藏列表接口返回空列表，但详情、收藏详情、分享直达仍可打开 | 用户已定口径；避免下线分类后出现打不开的分享链接与收藏死链 | SRC-004 | closed |
| DEC-003 | `City.scenes` 城市级覆盖留二期；一期只修正后台误导文案与后端注释，不改变其写入行为 | 该字段当前无任何运行时效果（列表/详情查询均不读取），复用它会把「全局分类」与「城市资料」语义混在一起 | SRC-003、SRC-004 | closed |
| DEC-004 | 配置结构通用，但 `scene` 只能取已知枚举 `drive` / `fish`；后台不能凭空新增业务场景 | Prisma `enum Scene`、`ListRoutesDto`、后端 admin service、小程序 `Scene` 类型四处均有白名单；新增场景需要独立 Change 打通数据、详情页与审核 | SRC-003、SRC-004 | closed |
| DEC-005 | 复用 `SystemConfig`（`key = scene_tabs`，`value` 为 JSON），零 schema 迁移 | 已有 `qrcodes` 的公开读 + 管理端读写完整范式；本需求只需一份键值配置，不需要新表 | SRC-003、ADR-006 | closed |
| DEC-006 | 后台模块位置：在「系统配置」分组下新增独立菜单项「首页分类目录」、路由 `/system-config/scene-tabs`、页面 `SceneTabsConfigView.vue`，沿用 `PageHeader` + `apiGet/apiPut` + `canWrite` 范式 | 用户要求「在这个后台 tab 进行模块设计」；新增独立项比改造已上线的 `QrConfigView.vue` 更符合最小改动原则，且可单独路由、单独审计 | SRC-002、SRC-003 | closed |
| DEC-007 | 管理端写入用 `revision` 乐观锁（值内整数，每次保存 +1），冲突返回 409 `CONFIG_VERSION_CONFLICT` | 多名运营可能同时编辑；静默覆盖会造成分类误下线 | `api-contract-design` 技能要求 | closed |
| DEC-008 | 服务端不引入 Redis、RabbitMQ 或进程内配置缓存；公开读按主键直读 `system_configs`，读取端字段级兜底 | ADR-006 规定无批准用例不引入基础设施；多实例进程内缓存无法在保存时失效，会产生长时间不一致 | ADR-006、SRC-003 | closed |
| DEC-009 | 小程序保留「上次成功配置」作为进程内兜底；配置接口失败/404/超时时回退内置默认（仅 `drive` 启用），不得阻塞首页渲染 | 滚动发布期可能「新小程序包 + 老服务端」；配置不可用不应导致首页白屏 | SRC-003、`NFR-RELI-001` | closed |
| DEC-010 | 上线默认配置：`drive`「粗门溜车」启用、`fish`「粗门钓鱼」隐藏；与上线前 C 端可见行为一致 | 现状 `SceneTabs.vue` 只渲染 `drive`；默认不改变用户可见内容才能安全发布 | SRC-003 | closed |
| DEC-011 | 实现阶段必须把本 Change 的 `contracts/openapi.yaml` 登记进 `apps/api/src/scripts/verify-openapi-contract.ts` 的 `contractPaths` | `contractPaths` 是硬编码白名单，未登记时 `pnpm test:contract` 会「假通过」 | SRC-003、KB-INBOX-008 | closed |
| DEC-012 | 发布顺序：API（默认配置与现状一致，无可见变化）→ 管理后台 → 小程序重新构建上传并提交审核；小程序端上线后才由运营开启新分类 | 服务端先行可保证新旧客户端共存；小程序包无法瞬时回滚，默认配置与旧行为一致是安全垫 | SRC-003、DEC-010 | closed |

## 开放问题与假设

| ID | 问题/假设 | 影响 | Owner | 状态 | 结论与日期 |
|---|---|---|---|---|---|
| Q-001 | 两张需求截图为会话内嵌图片，未落盘、无哈希；`source-baseline.json` 仍为 `pending`。需产品 Owner 书面确认截图内容即本 Change 范围 | `source-baseline.json` 能否标记 `verified`；需求 Gate 前置条件 | 用户（项目 Owner） | closed | 2026-11-08T07:11:04Z 用户回复「确认」核对范围；基线已标记 `verified`，截图无哈希的限制保留 |
| Q-002 | `fish` 默认显示名称采用「粗门钓鱼」（沿用首页「粗门溜车」命名风格），当前代码中该分类被注释关闭、无既有文案 | `FR-CFG-004` 默认值、`AC-CFG-002` 预期文案 | 用户（项目 Owner） | closed | 2026-11-08 确认采用「粗门钓鱼」 |
| Q-003 | 一期把收藏页的隐藏分类 tab 与收藏列表一并收口，已收藏的隐藏场景内容在收藏列表不可见，但详情仍可打开 | `FR-CFG-005`、`FR-CFG-009`、`AC-CFG-011` | 用户（项目 Owner） | closed | 2026-11-08 确认接受 DEC-002 统一口径；「已收藏内容始终可见」另立二期 |
| Q-004 | 小程序体验版/真机验收环境与 UAT、Operations、发布 Owner 的人选 | UAT Gate、Operations Gate、发布 Gate 的签署人 | 用户（项目 Owner） | closed | 2026-11-08 确认由用户本人担任产品、设计、UAT 与发布 Owner；安全、Operations、独立 Reviewer 与完成 Gate 在证据齐备后另行签署 |

## 来源冲突与版本差异

| 来源 ID | 冲突/变化 | 影响 FR/AC | 裁决人 | 状态 |
|---|---|---|---|---|
| SRC-003 vs `.harness/wiki/05-接口协议.md` | Wiki 当前资源清单未列 `/config/*`，但代码已存在 `GET /v1/config/qrcodes`；Wiki 属早期基线 | `04-impact-analysis.md`、`05-design.md` 以代码事实为准；Wiki 在实现完成后同步 | 用户（架构 Owner） | 已裁决，TASK-014 同步 Wiki |
| SRC-003 vs `apps/admin/src/views/CitiesView.vue:156` | 后台文案声称关闭城市场景影响首页 tab，实际运行时无效果 | `FR-CFG-010`、`AC-CFG-014` | 用户（产品 Owner） | 已裁决，按 DEC-003 纳入一期修正 |
| SRC-001/002 截图与代码现状 | 截图展示的是首页分类目录，代码中当前「钓鱼」分类被注释关闭；配置上线后仍默认关闭（DEC-010），避免误解为「上线即新增钓鱼入口」 | `FR-CFG-003`、`FR-CFG-004`、`AC-CFG-002` | 用户（产品 Owner） | 2026-11-08 确认按 DEC-010 处理 |

Q-001 ~ Q-004 已全部关闭；需求 Gate 与设计 Gate 于 2026-11-08T07:11:04Z 由用户回复「确认」批准，记录见 `approvals/2026-11-08-requirements-design.md`。Change 进入 `implementing`；Implementation、Verification、Security、UAT、Operations、Release、Completion Gate 仍为 `pending`，须在各自证据齐备后由对应角色签署，AI 不代批。

## 并入后续 Change 的说明（2026-11-08 用户裁决）

用户在 `CHG-SCENE-EXPANSION-001`（`scene-expansion-three-tabs`）的四条冲突裁决中选择「**A：并入本 Change，不单独发布**」：

- 本 Change 已实现但未提交、未发布的代码，作为新 Change 的代码基线被适配（新 Change DEC-E10），**不单独发布、不单独完成**。
- 本 Change 的验证、UAT、安全与发布证据归入新 Change 的验证计划与发布 Gate 记录，证据归属在新 Change 的批准文件中写明；DEC-012 的发布顺序由新 Change DEC-E12 覆盖。
- 本 Change 的 `status.yaml` Gate 值**不自动推进**，仍保持 `implementing` 与既有 Gate 状态；避免把未产生的证据写成已通过。
- 本说明仅为范围与发布归属的裁决留痕，不代表本 Change 的任何 Gate 被批准或完成。
