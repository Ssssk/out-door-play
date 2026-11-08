# 需求澄清

## 决策日志

| 决策 ID | 决策 | 理由 | 来源 | 状态 |
|---|---|---|---|---|
| DEC-E01 | 采用两层分类：顶层 `Scene`（drive / play / wash）+ 可空子类型 `Discovery.subType`（fishing / camping / checkin，仅 play 下使用） | 用户明确「粗门玩玩就包括：钓鱼、露营、打卡」，单层枚举无法表达；`Discovery` 现无子类型字段，`tags Json` 非结构化，需显式列 | SRC-E01、SRC-E04 | closed |
| DEC-E02 | `enum Scene` 采用 expand-migrate-contract：一期新增 `play` / `wash` 但**保留 `fish`**；数据回填后观察一个发布周期，再另开 Change 移除 `fish` | `AGENTS.md` §9 要求删除/重命名支持新旧应用滚动共存；旧小程序包仍会传 `scene=fish` | SRC-E04、AGENTS.md | closed |
| DEC-E03 | 子类型固定枚举 `fishing`（钓鱼）/ `camping`（露营）/ `checkin`（打卡）；一期不做子类型配置后台，也不允许后台凭空新增子类型 | 用户只给出这 3 类；避免把配置面扩大到未定义业务 | SRC-E01 | closed |
| DEC-E04 | 保留 `GET /v1/spots/:id` 与小程序 `/pages/fishing-detail/index?spotId=` 作为「粗门玩玩 / 钓鱼」的详情链路，服务端按 `scene IN (fish, play)` + `subType=fishing` 放行 | DEC-002「拒列表、留详情」；已有分享链接与收藏条目不能变成死链 | SRC-E03、SRC-E04 | closed |
| DEC-E05 | 首页分类目录默认 3 项全启用：粗门溜车 / 粗门玩玩 / 粗门洗车；`SystemConfig.scene_tabs` 默认配置与后台「恢复默认」同步 | 用户明确要求 3 个 tab；**覆盖** `CHG-HOME-CATEGORY-001` DEC-010（默认仅 drive） | SRC-E01、SRC-E03 | closed（需 Gate 复核冲突） |
| DEC-E06 | 业务白名单扩展为 `drive` / `play` / `wash`（`fish` 仅作兼容值），后台仍不能凭空新增业务场景 | 用户选择「正式扩展 Scene 枚举」；保留「配置结构通用、枚举受约束」的治理方式 | SRC-E01、SRC-E03 | closed |
| DEC-E07 | 小程序一期不新增详情页：`drive` / `play`（非钓鱼子类型）/ `wash` 复用 `route-detail`，钓鱼子类型复用 `fishing-detail` | `pages.json` 只有两个详情页；新增页面会扩大发版范围与审核风险 | SRC-E04 | closed |
| DEC-E08 | 「粗门玩玩」子类型在小程序以卡片标签展示 + 列表 `subType` 可选筛选，不引入第三层 tab；后台提供二级子类型筛选 | 一期控制 UI 复杂度；用户未要求小程序子类型 tab | SRC-E01 | closed（需 Gate 确认） |
| DEC-E09 | 迁移分三阶段：Expand（加 enum 值与列/索引）→ Migrate（可预览幂等回填）→ Contract（移除 `fish`，另开 Change） | 生产 ENUM 变更不可逆，必须先可共存、再迁数据、后收口 | AGENTS.md §9、§13 | closed |
| DEC-E10 | `CHG-HOME-CATEGORY-001` 的实现作为本 Change 的代码基线被适配，**不单独发布**；其 Gate 状态不自动推进 | 该 Change 仍在 `implementing`、代码未提交未发布；单独发布会与新枚举/默认配置冲突 | SRC-E03、SRC-E04 | closed |
| DEC-E11 | 实现阶段把本 Change 契约登记进 `apps/api/src/scripts/verify-openapi-contract.ts` 的 `contractPaths` | `contractPaths` 是硬编码白名单，未登记会「假通过」 | SRC-E04 | closed |
| DEC-E12 | 发布顺序：Migration Expand → API → 数据回填 → 管理后台 → 小程序构建上传/审核/发布；每一步有停止阈值 | 服务端先行可让旧包共存；小程序包不可瞬时回滚 | AGENTS.md §13、发布 Gate | closed |

## 开放问题与假设

| ID | 问题/假设 | 影响 | Owner | 状态 | 用户裁决（2026-11-08） |
|---|---|---|---|---|---|
| Q-E01 | 默认 3 个 tab 全启用，但「粗门洗车」与「露营/打卡」一期无数据，会显示空状态。是否接受，还是需要预置演示数据？ | `FR-EXP-006`、`AC-EXP-004`、空态文案 | 产品 Owner | 已裁决，待需求 Gate 书面确认 | 接受空态，不预置演示数据；不扩大 seed 范围，`AC-EXP-004` 按现状验收 |
| Q-E02 | 子类型英文标识采用 `fishing` / `camping` / `checkin`，中文「钓鱼 / 露营 / 打卡」；是否与品牌文案一致？ | `FR-EXP-002`、契约 schema | 产品 Owner | 已裁决，待需求 Gate 书面确认 | 确认 `fishing` / `camping` / `checkin` 与「钓鱼 / 露营 / 打卡」，写入契约 schema 与前后端文案 |
| Q-E03 | 兼容期是否需要在后台保留「钓鱼」顶层筛选入口，还是仅在 API 层兼容 `scene=fish`？ | `FR-EXP-004`、`FR-EXP-012` | 产品 Owner | 已裁决，待需求 Gate 书面确认 | 用户答复「放到 玩玩」：后台不设钓鱼顶层 tab，钓鱼归入「粗门玩玩」的 `fishing` 子类型；API 层保留 `scene=fish` 读兼容。与 `FR-EXP-004` 的 3 tab + 二级筛选一致 |
| Q-E04 | 生产数据回填的授权人、备份点、维护窗口与回滚演练安排 | `FR-EXP-003`、`NFR-MIG-001`、发布 Gate | 发布负责人 / 数据库 Owner | open（发布 Gate 前确认） | 尚未裁决 |

> 2026-11-08 用户已裁决 Q-E01 ~ Q-E03，随后逐条裁决四条冲突，并于同日**书面批准需求 Gate 与设计 Gate**（见 `approvals/2026-11-08-requirements-design.md`）。以上结论已生效；Change 进入 `implementing`，Implementation 及之后 Gate 仍为 `pending`。

## 与已批准 Change 的冲突登记

按 `AGENTS.md` §14，以下冲突已确认、已记录影响，并于 2026-11-08 由用户逐条裁决；AI 未自行选择更方便的一项。

| 冲突条目 | 已批准原文 | 本 Change 拟议 | 影响 | 裁决人 |
|---|---|---|---|---|
| `CHG-HOME-CATEGORY-001` DEC-004 | 「scene 只能取已知枚举 drive / fish；后台不能凭空新增业务场景」 | 白名单扩为 drive/play/wash（fish 兼容） | 需求口径、`FR-CFG-006`、`SceneTabDto` 校验、`contracts/openapi.yaml` | 产品 Owner + 架构 Owner |
| `CHG-HOME-CATEGORY-001` DEC-010 | 「上线默认配置：drive 启用、fish 隐藏」 | 默认 3 项全启用 | 默认配置、后台「恢复默认」、小程序默认分类、`AC-CFG-001` | 产品 Owner |
| `CHG-HOME-CATEGORY-001` FR-CFG-003 / FR-CFG-005 | 隐藏语义「拒列表、留详情」按 drive/fish 实现 | 语义不变，但过滤维度增加 play/wash 与 subType | 列表/收藏用例、详情放行规则 | 架构 Owner |
| `CHG-HOME-CATEGORY-001` 状态 `implementing` | 需求/设计 Gate 已 passed，代码已落地未发布 | 本 Change 独立 Gate，旧 Change 不单独发布 | 发布顺序、验证证据归属 | 发布负责人 |

## 冲突裁决记录（2026-11-08）

裁决人：用户（项目 Owner，兼产品 Owner、架构 Owner、UX Owner 与发布负责人口径；沿用 `CHG-HOME-CATEGORY-001` Q-004 的 Owner 安排）。裁决方式：结构化逐条裁决。

| 冲突 | 裁决结论 | 落地口径 |
|---|---|---|
| 1 · DEC-004 / FR-CFG-006 | **认可例外条款与口径修订** | DEC-004 原文「新增场景需要独立 Change」已由本 Change 满足；`FR-CFG-006` 修订为「业务写入白名单 ⊆ enum 值集合，兼容值 `fish` 只读不写」；本次范围固定为 `drive` / `play` / `wash` 三个值；「后台不能凭空新增业务场景」的治理边界保留 |
| 2 · DEC-010 / DEC-009 / DEC-012 | **采用两层默认** | 服务端下发默认 3 项全启用（满足 3 个 tab）；小程序**本地故障/旧服兜底仍仅 `drive`**；新包白名单扩为 3 值，但配置接口失败/404/损坏时降级到仅 `drive`，不展示 3 项内置默认；同步修订 `NFR-COMPAT-001` 阈值与 `AC-EXP-014` |
| 3 · FR-CFG-003 / FR-CFG-005 | **确认集合放行与统一过滤** | 详情端点永不引入分类显隐判断，只把单 scene 硬编码换成 `find(id, scenes[])` 集合放行；`scene=fish` 兼容映射后仍必须走 `enabledScenes()` 短路；钓点专属字段（水深/岸线/钓具）改按 `subType === 'fishing'` 判定 |
| 4 · 状态 `implementing` / DEC-012 | **A：并入本 Change，不单独发布** | 上一 Change 显式标记为「并入 `CHG-SCENE-EXPANSION-001`，不单独完成/发布」；其全部代码纳入本 Change 的验证计划与发布 Gate 记录，证据归属在批准文件中写明；上一 Change 的 Gate 值不自动推进 |

裁决已落盘；用户于 2026-11-08 书面批准需求 Gate 与设计 Gate（`approvals/2026-11-08-requirements-design.md`），`status.yaml` 进入 `implementing`。Implementation、Verification、Security、UAT、Operations、Release、Completion Gate 仍为 `pending`；生产 ENUM 变更、数据回填与发布仍需针对目标、环境、动作的明确授权，Q-E04 在发布 Gate 前关闭。
