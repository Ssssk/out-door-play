# 需求规格

> 2026-09-05：用户在收到六项推荐口径后连续要求继续开发并要求改完运行项目，Requirements/Design Gate 已按 `gate-decisions.json` 记录为 passed。

## 用户与场景

- 匿名访客：选择已开通城市，在“粗门溜车/粗门钓鱼”之间切换，浏览公开列表与详情。
- 已登录用户：使用同一发现链路，并复用已批准的服务端收藏能力；本 Change 不改变认证和收藏契约。
- 内容运营：通过既有后台维护内容；只有 `online` 且所属城市启用的资源可被移动端发现。

## 功能需求

### FR-DISCOVERY-CITY-001 已开通城市选择

- 描述：首页通过内联 bottom sheet 展示服务端已启用城市，选择后立即刷新当前场景列表并持久化最近选择。
- 来源 ID/锚点：`SRC-DISCOVERY-PRD-HOME`“品牌标题与城市选择”；`SRC-DISCOVERY-PRD-FISH`“城市选择抽屉”。
- 业务规则：城市 code 为 6 位数字且必须来自服务端启用名单；候选按 code 稳定排序；连续选择同一城市不重复请求。
- 权限：匿名可读和本地选择，不写服务端用户资料。
- 数据口径：API 为候选真相；API 失败可展示审核过的本地城市 fallback，并明确降级状态。
- 失败行为：城市读取失败且无 fallback 时显示可重试错误；不得允许任意手工 code 进入请求。

### FR-DISCOVERY-LIST-001 按城市与场景浏览发现列表

- 描述：按 `cityCode + scene + limit` 获取公开路线或钓点，前端完全按服务端确定顺序展示。
- 来源 ID/锚点：`SRC-DISCOVERY-PRD-HOME`“场景切换/路线推荐卡片”；`SRC-DISCOVERY-PRD-FISH`“页面结构/数据接口”。
- 业务规则：scene 仅为 `drive/fish`；limit 为 1..20，产品页面默认 10；只返回 `online` 内容；Top N 的 `rank` 为正整数且升序，同 rank 按参考距离升序、ID 升序。
- 权限：匿名只读。
- 数据口径：`distanceKm` 是运营维护的参考距离，不是实时用户距离；钓点深度用 `depthM`，路线落差用 `elevationM`。
- 失败行为：参数非法返回稳定 422；真实空结果显示 empty；网络/服务失败可显示明确标识的本地 fallback，不把 fallback 宣称为实时数据。

### FR-DISCOVERY-DETAIL-001 路线与钓点详情

- 描述：按稳定 ID 查看与 scene 匹配的公开详情，展示 Hero、指标、路线/钓点信息、介绍、标签及可用的海拔信息。
- 来源 ID/锚点：`SRC-DISCOVERY-PRD-ROUTE`、`SRC-DISCOVERY-PRD-SPOT`“业务概览/页面结构/数据接口”。
- 业务规则：`/routes/:id` 只返回 drive，`/spots/:id` 只返回 fish；offline、pending、不存在或 scene 不匹配统一视为公开 404。
- 权限：匿名可读；收藏仍按 identity Change 要求登录。
- 数据口径：详情字段由 API Presenter 冻结；缺少可选字段时显示 `--` 或隐藏对应区块，不制造默认业务事实。
- 失败行为：404 显示资源不可用并提供返回；服务不可用时可展示同 ID 本地 fallback，必须显示“离线推荐”提示与重试入口。

### FR-DISCOVERY-ACTION-001 分享、收藏与系统地图

- 描述：详情支持分享、收藏和立即出发；分享使用目标端标准能力，收藏复用服务端授权写接口，出发使用宿主系统地图能力。
- 来源 ID/锚点：`SRC-DISCOVERY-PRD-ROUTE`、`SRC-DISCOVERY-PRD-SPOT`“底部操作栏/交互”。
- 业务规则：写操作 pending 时禁止重复；未登录收藏先进入登录且安全回跳；地图名称使用中性文案，不承诺具体品牌 SDK。
- 权限：公开分享/地图；收藏需要普通用户会话。
- 失败行为：分享或地图不可用时给出明确提示，不假成功；收藏失败保持原服务端状态。

### FR-DISCOVERY-STATE-001 可恢复页面状态

- 描述：首页和详情必须区分 initializing、loading、content、empty、fallback、error、retry；返回列表保持城市、场景和可行的滚动位置。
- 来源 ID/锚点：四份 PRD 的状态机、交互与验收章节；`SRC-DISCOVERY-CODE-001` 当前实现差距。
- 业务规则：city/scene 变化采用 latest-wins；旧响应不得覆盖新选择；同一选择的重复请求合并或拒绝。
- 失败行为：切换失败时保留上一次成功内容并标明错误；请求结束必须释放 loading/pending。

## 非功能需求

### NFR-DISCOVERY-REL-001 确定性与弱网可靠性

- 20 次快速 city/scene 切换后，最终 UI 必须对应最后一次选择；取消、超时和卸载后不得回写旧状态。
- 列表排序必须稳定；相同数据库状态与查询参数返回相同 ID 顺序。

### NFR-DISCOVERY-SEC-001 公开数据最小化

- 公开 Presenter 只返回页面所需字段，不暴露内部审核、权重、审计或用户数据。
- ID、city、scene、limit 必须运行时校验；错误只返回稳定 code、公开 message 与 traceId。

### NFR-DISCOVERY-COMPAT-001 H5 与微信小程序

- 首批构建目标为 H5 + 微信小程序；平台能力经 adapter 隔离。
- H5 E2E 不能替代微信真机 UAT；无法验证的目标端项保持 pending。

### NFR-DISCOVERY-A11Y-001 可访问交互

- 场景 tab 暴露 tablist/tab/selected 语义；城市抽屉可关闭并恢复焦点；卡片支持点击及 H5 Enter/Space。
- loading、empty、fallback 与 error 不只依赖颜色区分，交互按钮有可读名称与 pending 状态。

## 非目标

- 真实定位、个性化距离或附近排序。
- 高德/腾讯等品牌地图 SDK、油价或加油站供应商。
- 新增 Discovery schema、后台编辑、Ranking 聚合改造、埋点平台、评论/UGC。
- Redis、RabbitMQ、生产迁移或发布。

## 来源追踪

| FR/NFR | 来源 ID | 来源锚点 | 版本 | Owner确认 |
|---|---|---|---|---|
| FR-DISCOVERY-CITY-001 | PRD-HOME/PRD-FISH | 城市选择模块/交互 | v1.1.0 mixed | approved recommended resolution |
| FR-DISCOVERY-LIST-001 | PRD-HOME/PRD-FISH | 场景、列表、接口、排序 | v1.1.0 mixed | approved recommended resolution |
| FR-DISCOVERY-DETAIL-001 | PRD-ROUTE/PRD-SPOT | 详情结构与接口 | v1.1.0 | approved |
| FR-DISCOVERY-ACTION-001 | PRD-ROUTE/PRD-SPOT + identity Change | 详情操作栏 | v1.1.0 | approved system-map resolution |
| FR-DISCOVERY-STATE-001 | 四份 PRD + CODE-001 | 状态机/当前差距 | current | approved |
| NFR-DISCOVERY-REL-001 | 四份 PRD + Harness Rules | 幂等/状态/弱网 | current | approved |
| NFR-DISCOVERY-SEC-001 | parent NFR-SEC-001 | 公开契约最小化 | current | approved |
| NFR-DISCOVERY-COMPAT-001 | parent DEC-PLATFORM-001 | H5 + 微信 | current | approved at program level |
| NFR-DISCOVERY-A11Y-001 | PRD 验收 + Harness UI Rules | aria/键盘/状态 | current | approved |

## 依赖与假设

- 依赖现有 Prisma City/Discovery 与已完成的 mobile identity 收藏边界。
- 假设此切片不增加表字段；若 Presenter 无法满足需求再返回 Design Gate，不自动 migration。
- 推荐结论已由用户继续开发指令确认，证据见 `approvals/2026-09-05-continue-development.md`。

## 未决问题

DISCOVERY-Q-001~006 已按推荐口径关闭；真实定位、品牌地图与生产 SLO 另起 Change。

