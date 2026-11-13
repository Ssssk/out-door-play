# 验收标准

## AC-EXP-001 三个顶层分类可用

- **关联需求**：FR-EXP-001、FR-EXP-006
- **GIVEN** 新 API、新后台、新小程序包均已部署且 `scene_tabs` 使用默认配置
- **WHEN** 用户进入小程序首页，运营打开后台「路线列表」
- **THEN** 小程序首页与后台筛选区均出现「粗门溜车 / 粗门玩玩 / 粗门洗车」3 个分类
- **AND** 「全部」仍可作为后台默认筛选
- **验证方式**：目标端人工 + 后台浏览器 E2E

## AC-EXP-002 子类型可新建与筛选

- **关联需求**：FR-EXP-002、FR-EXP-005
- **GIVEN** 运营具备 `route:edit`，打开「新建粗门玩玩路线」
- **WHEN** 依次选择子类型钓鱼 / 露营 / 打卡并保存 3 条路线
- **THEN** 3 条记录落库为 `scene=play` 与对应 `subType`，后台选中「粗门玩玩」后按子类型筛选能分别查到
- **AND** 选择「粗门溜车」或「粗门洗车」时子类型字段不出现且提交值为 null
- **验证方式**：后台 E2E + 数据库只读校验

## AC-EXP-003 非法组合被拒绝

- **关联需求**：FR-EXP-002、NFR-SEC-001
- **GIVEN** 运营提交 `scene=play, subType=null`、`scene=wash, subType=camping`、`scene=fish`（新写入）、未知 `subType`
- **WHEN** 调用管理端创建/更新接口
- **THEN** 全部返回 422 `SCENE_SUBTYPE_INVALID` 或 `COMMON_VALIDATION_FAILED`，数据库无新增或变更行
- **AND** 前端逐项展示中文提示，不展示内部异常堆栈
- **验证方式**：API 集成测试 + 契约测试

## AC-EXP-004 空分类不出现空白页

- **关联需求**：FR-EXP-006、Q-E01
- **GIVEN** 「粗门洗车」尚无数据
- **WHEN** 用户在小程序切到该分类，运营在后台筛选该分类
- **THEN** 展示明确空态文案与引导，不出现白屏、无限 loading 或吸顶条塌陷
- **验证方式**：目标端人工 + 后台 E2E

## AC-EXP-005 钓鱼数据回填正确

- **关联需求**：FR-EXP-003、NFR-MIG-001
- **GIVEN** 迁移前存在 3 条 `scene=fish` 的 Discovery、2 条 fish Ranking、4 个城市 `scenes` 含 fish
- **WHEN** 执行 dry-run 后再执行回填
- **THEN** dry-run 报告行数与实执行一致；3 条记录变为 `scene=play, subType=fishing`，Ranking 与城市 JSON 中的 fish 变为 play，`SystemConfig.scene_tabs` 不含 fish
- **AND** 第二次执行回填变更行数为 0（幂等）
- **验证方式**：迁移演练报告 + 只读 SQL 校验

## AC-EXP-006 回填可恢复

- **关联需求**：FR-EXP-003、NFR-MIG-001
- **GIVEN** 回填前已创建备份点并保存反向映射清单
- **WHEN** 在测试环境执行恢复演练
- **THEN** 15 分钟内把 3 条记录、Ranking 与城市 JSON 还原为 `scene=fish`，且收藏/分享链接仍可打开
- **验证方式**：演练记录 + 恢复后只读校验

## AC-EXP-007 分享链接与详情可达

- **关联需求**：FR-EXP-008、DEC-004
- **GIVEN** 迁移前分享出去的 `/pages/fishing-detail/index?spotId=liangzihu` 链接
- **WHEN** 迁移后从聊天打开，并直接调用 `GET /v1/spots/liangzihu`
- **THEN** 返回 200 且详情页完整渲染，钓鱼专属字段（水深/岸线/钓具）不丢失
- **AND** `GET /v1/routes/:id` 对 drive/play/wash 记录均返回 200
- **验证方式**：目标端人工 + API 集成测试

## AC-EXP-008 收藏不丢且按新分类返回

- **关联需求**：FR-EXP-007、FR-EXP-008
- **GIVEN** 用户曾收藏钓鱼内容，迁移后该记录为 `play/fishing`
- **WHEN** 调用 `GET /v1/user/favorites?scene=play`
- **THEN** 返回该收藏条目，`type` 与详情分流正确，可打开详情
- **AND** 收藏行本身未被删除或改写
- **验证方式**：API 集成测试（真实 MySQL）

## AC-EXP-009 兼容期 fish 请求

- **关联需求**：FR-EXP-012、NFR-COMPAT-001
- **GIVEN** 旧小程序包或旧调用方仍在请求 `scene=fish`
- **WHEN** 调用 `GET /v1/routes?scene=fish` 与 `GET /v1/user/favorites?scene=fish`
- **THEN** 服务端映射到 `play + fishing` 并返回钓鱼内容，不返回 422 / 500
- **AND** 响应中 `scene` 为真实存储值 `play`，响应结构不变
- **验证方式**：API 集成测试 + 四组合矩阵

## AC-EXP-010 隐藏分类仍拒列表留详情

- **关联需求**：FR-EXP-007、FR-EXP-009
- **GIVEN** 运营在「系统配置 / 首页分类目录」隐藏「粗门洗车」
- **WHEN** 绕过客户端直接调用 `GET /v1/routes?scene=wash`
- **THEN** 返回 200 且空数组；已分享的 wash 详情仍返回 200
- **AND** 配置 `revision` 递增，保存并发冲突仍返回 409
- **验证方式**：API 集成测试 + 后台 E2E

## AC-EXP-011 首页分类配置 3 项

- **关联需求**：FR-EXP-009
- **GIVEN** 运营打开「系统配置 / 首页分类目录」
- **WHEN** 修改 3 个分类的名称、启停、排序并保存，或点击「恢复默认」
- **THEN** 默认值与保存值均只含 drive/play/wash；小程序下次进入首页按新值渲染
- **AND** 残留 `fish` 项的旧配置被读取端兜底为默认，不出现 500
- **验证方式**：后台 E2E + 小程序目标端人工 + 单元测试

## AC-EXP-012 白名单无遗漏

- **关联需求**：FR-EXP-001、FR-EXP-010、NFR-SEC-001
- **GIVEN** 实现完成后的全部源码
- **WHEN** 检索 `'drive' | 'fish'`、`@IsIn(['drive','fish'])`、`ENUM('drive','fish')` 与 `scene === 'fish'` 等二元假设
- **THEN** 除「兼容期映射」与「Contract 阶段说明」等明确标注的位置外，不再有遗漏的旧白名单
- **AND** 城市页、榜单页、seed、mock 均与新枚举一致
- **验证方式**：静态检索报告 + 代码评审记录

## AC-EXP-013 契约登记与校验

- **关联需求**：FR-EXP-007、DEC-E11
- **GIVEN** 本 Change 的 `contracts/openapi.yaml` 与实现后的 API
- **WHEN** 执行 `pnpm test:contract`
- **THEN** 退出码 0，且输出覆盖本 Change 登记的 operation（含 scene/subType 新参数）
- **AND** 故意移除 `contractPaths` 中本 Change 条目时不再覆盖（反证）
- **验证方式**：契约测试输出证据

## AC-EXP-014 滚动发布四组合

- **关联需求**：NFR-COMPAT-001、FR-EXP-012
- **GIVEN** Expand 迁移已执行、回填已完成，默认配置为 3 项启用
- **WHEN** 在「旧包+旧服」「旧包+新服」「新包+旧服」「新包+新服」下进入首页并打开一条钓鱼分享链接
- **THEN** 四组合无 5xx、无白屏，钓鱼详情均可打开
- **AND** 「新包+旧服」在配置接口 404 时降级到仅 `drive`（两层默认，见文末裁决修订），不向旧服请求 `scene=play`
- **验证方式**：目标端人工矩阵 + E2E

## AC-EXP-015 迁移期间锁与复制延迟

- **关联需求**：NFR-PERF-001、NFR-MIG-001
- **GIVEN** 演练环境使用与生产同版本的 MySQL/InnoDB，`discoveries` 行数与生产同量级
- **WHEN** 执行 ALTER 与回填
- **THEN** 记录行数、锁等待、执行时长、复制延迟与磁盘占用；列表查询 P95 ≤ 200ms，无长事务阻塞
- **AND** 大表 DDL 评估报告给出分批或在线变更结论
- **验证方式**：压测/演练报告 + 只读指标记录

## AC-EXP-016 权限、审计与日志

- **关联需求**：FR-EXP-011、NFR-OBS-001、NFR-A11Y-001
- **GIVEN** 只读账号、可写账号与一次成功回填
- **WHEN** 只读账号尝试写入，并采集日志
- **THEN** 写入返回 403；回填与配置保存日志含操作者与 UTC 时间；兼容映射、非法子类型、隐藏场景拒绝事件可检索
- **AND** 3 个 tab 与二级筛选保留 a11y 属性、可键盘操作，触控区域不低于现状
- **验证方式**：集成测试 + 浏览器/目标端人工检查 + 日志断言

## AC-EXP-017 露营 / 打卡目的地型字段口径

- 关联需求：FR-EXP-013
- **GIVEN** 运营打开「新建粗门玩玩路线」并选择子类型「露营」或「打卡」
- **WHEN** 填写并保存（仅终点与终点坐标）
- **THEN** 后台表单不出现难度 / 难度等级 / 建议时段 / 耗时 / 路线长 / 落差 / 车型 / 起点 / 起点坐标；提交 payload 仅含 `endPoint`、`endLongitude`、`endLatitude`（终点坐标同时作为导航坐标）
- **AND** 服务端落库该记录 `difficulty=''`、`level=null`、`bestTime=''`、`durationLabel=''`、`lengthKm=0`、`elevationM=0`、`carType=null`、`startPoint=null`，不出现「入门级」「待补充」等占位值
- **AND** 小程序端该卡片与详情不展示难度、耗时、路线长、落差、车型、出发地与「查看完整路线」
- **验证方式**：后台字段策略单测（`routeFormPolicy.test.ts`）、服务端字段策略单测（`admin.service.destination.spec.ts`）、小程序判定单测（`mobile/src/common/scenes.spec.ts`、`DiscoveryCard.component.spec.ts`）；目标端人工复核见 TASK-E19、TASK-E20

## 冲突裁决后的验收口径修订（2026-11-08）

以下修订优先于上文对应条目，裁决全文见 `01-clarification.md` 与 `02-requirements.md`。

| AC | 修订内容 |
|---|---|
| AC-EXP-001 | 「新 API、新后台、新小程序包均已部署且 `scene_tabs` 使用默认配置」明确为**服务端默认 3 项全启用**；本地故障兜底不在本用例范围 |
| AC-EXP-009 | 追加断言：`scene=fish` 兼容映射到 `play + fishing` 后仍受 `enabledScenes()` 短路约束；隐藏「粗门玩玩」时该请求返回空数组，不得绕过隐藏过滤 |
| AC-EXP-011 | 追加断言：「恢复默认」提交服务端 3 项默认；小程序在配置接口 404 / 5xx / 损坏时**降级到仅 `drive`**，不得显示内置 3 项默认 |
| AC-EXP-012 | 追加断言：业务写入白名单为 `drive` / `play` / `wash` 三值且是 `enum Scene` 值集合的子集；`fish` 只读不写；后台仍不能凭空新增业务场景 |
| AC-EXP-013 | 契约校验须覆盖 `BusinessScene` / `SceneQuery` / `PlayType` 与新增 `subType` 参数 |
| AC-EXP-014 | **替换原四组合断言**：GIVEN 服务端默认 3 项、小程序本地故障兜底仅 `drive`；WHEN 在四组合下进入首页并打开钓鱼分享链接；THEN 四组合均无 5xx、无白屏、无 422 且钓鱼详情可打开，其中「新包 + 新服」显示 3 个分类，其余组合至少 `drive` 可用；「新包 + 旧服」在配置接口 404 时降级到仅 `drive`，不向旧服请求 `scene=play` |
| AC-EXP-016 | 追加断言：一次发布包含两个 Change 的代码时，发布 Gate 记录写明证据归属；`CHG-HOME-CATEGORY-001` 的 Gate 值不自动推进 |
