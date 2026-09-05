# 验收标准

## AC-CITY-001 服务端城市与选择

- **关联需求**：FR-DISCOVERY-CITY-001
- **GIVEN** 服务端返回多个 enabled 城市和一个 disabled 城市
- **WHEN** 用户打开内联城市抽屉并选择新城市
- **THEN** 只展示 enabled 城市，选中态与持久化 cityCode 一致
- **AND** 当前 scene 只触发一次新城市列表请求
- **验证方式**：API 单元/组件/H5 E2E；微信真机人工

## AC-CITY-002 城市失败降级

- **关联需求**：FR-DISCOVERY-CITY-001、FR-DISCOVERY-STATE-001
- **GIVEN** 城市 API 超时或返回 5xx
- **WHEN** 用户打开城市抽屉
- **THEN** 显示明确 fallback 标识和审核过的本地候选，或在无 fallback 时显示可重试 error
- **AND** 不接受任意手工 cityCode
- **验证方式**：组件/E2E 故障注入

## AC-LIST-001 列表过滤与稳定排序

- **关联需求**：FR-DISCOVERY-LIST-001、NFR-DISCOVERY-REL-001
- **GIVEN** 两个城市、两个 scene、online/pending/offline 内容以及重复 rank
- **WHEN** 请求 `GET /v1/routes?city=420100&scene=drive&limit=10`
- **THEN** 只返回目标城市的 online drive 内容
- **AND** 按 `rank asc, distanceKm asc, id asc` 稳定排序，数量不超过 10
- **验证方式**：MySQL 集成 + 契约测试

## AC-LIST-002 参数边界与公开字段

- **关联需求**：FR-DISCOVERY-LIST-001、NFR-DISCOVERY-SEC-001
- **GIVEN** city 非 6 位数字、未知 scene、limit 为 0/21 或附带未知字段
- **WHEN** 调用公开列表 API
- **THEN** 返回 HTTP 422 与稳定错误码，不执行无界查询
- **AND** 合法响应不包含 rankWeight、审核、审计或用户字段
- **验证方式**：DTO 单元 + runtime OpenAPI/HTTP E2E

## AC-LIST-003 空、失败与 fallback 不混淆

- **关联需求**：FR-DISCOVERY-LIST-001、FR-DISCOVERY-STATE-001
- **GIVEN** 分别出现合法空数组和网络/服务失败
- **WHEN** 首页加载列表
- **THEN** 空数组展示真实 empty；失败展示明确标识的 fallback 或 error/retry
- **AND** fallback 不被标识为实时服务端结果
- **验证方式**：composable/组件/H5 E2E

## AC-LIST-004 快速切换 latest-wins

- **关联需求**：FR-DISCOVERY-STATE-001、NFR-DISCOVERY-REL-001
- **GIVEN** 旧请求延迟，新请求先返回
- **WHEN** 用户快速切换 20 次 city/scene
- **THEN** 最终 scene、city 与列表对应最后一次选择
- **AND** 旧响应、超时响应和页面卸载后的响应不回写 UI，pending 最终释放
- **验证方式**：可控 Promise 单元/组件测试，不使用任意 sleep

## AC-DETAIL-001 scene 隔离与 404

- **关联需求**：FR-DISCOVERY-DETAIL-001、NFR-DISCOVERY-SEC-001
- **GIVEN** online drive、online fish、offline 与不存在 ID
- **WHEN** 分别调用 route/spot 详情 API
- **THEN** 只有 ID 与 endpoint scene 匹配且 online 时返回详情
- **AND** 其余返回公开 404 稳定码，不泄露资源是否处于审核或下线状态
- **验证方式**：单元/MySQL 集成/契约

## AC-DETAIL-002 钓点水深与缺失字段

- **关联需求**：FR-DISCOVERY-LIST-001、FR-DISCOVERY-DETAIL-001
- **GIVEN** fish 内容具有 `depthM`，route 内容具有 `elevationM`
- **WHEN** 渲染列表与详情
- **THEN** 钓点“平均水深”来自 `depthM`，路线“路线落差”来自 `elevationM`
- **AND** 可选值缺失时显示 `--` 或隐藏区块，不互相借用字段
- **验证方式**：Presenter 单元 + DiscoveryCard 组件

## AC-ACTION-001 操作幂等与失败

- **关联需求**：FR-DISCOVERY-ACTION-001
- **GIVEN** 详情已加载
- **WHEN** 用户重复点击收藏、分享或立即出发
- **THEN** pending 期间同一动作不重复提交；地图使用宿主标准能力
- **AND** 未登录收藏进入安全登录回跳，任何失败均不显示成功状态
- **验证方式**：组件/H5 E2E；微信分享与地图真机

## AC-A11Y-001 语义与键盘

- **关联需求**：NFR-DISCOVERY-A11Y-001
- **GIVEN** H5 页面已加载
- **WHEN** 键盘用户操作 scene tab、城市抽屉、卡片与详情操作
- **THEN** tab selected、按钮名称、焦点关闭恢复和 Enter/Space 均可观察
- **AND** loading/empty/fallback/error 有文本或语义，不只用颜色
- **验证方式**：组件自动化 + H5 人工；微信触控人工

## AC-TARGET-001 双目标构建与验收边界

- **关联需求**：NFR-DISCOVERY-COMPAT-001
- **GIVEN** 当前候选工作树
- **WHEN** 执行 H5 与 mp-weixin build
- **THEN** 两个构建均成功且包内不含服务端 Secret
- **AND** 微信分享、返回、抽屉、地图与滚动状态在真机未验证前保持 pending
- **验证方式**：自动构建/Secret scan + 微信真机 UAT

