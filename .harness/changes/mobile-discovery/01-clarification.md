# 需求澄清

| ID | 问题/假设 | 影响 | Owner | 状态 | 推荐结论 |
|---|---|---|---|---|---|
| DISCOVERY-Q-001 | 首页旧正文要求跳城市占位页，钓鱼 V2 要求内联 bottom sheet；采用哪一个？ | 页面结构、路由、组件和 UAT | 产品/UX Owner | closed | 2026-09-05：采用 V2 内联城市抽屉 |
| DISCOVERY-Q-002 | 旧正文同时写“服务端持久化不支持”和 `GET /v1/*` 服务端数据；谁是公开内容真相？ | API、fallback、错误与数据新鲜度 | 产品/架构 Owner | closed | 2026-09-05：MySQL/API 为真相；本地数据仅显式降级 |
| DISCOVERY-Q-003 | `rank` 是 Top N 名次还是越大越热？当前实现按降序导致 Top 10 排在 Top 9/7 前。 | 用户可见顺序、契约和测试 | 产品 Owner | closed | 2026-09-05：Top N 正整数升序，同名次参考距离、ID 升序 |
| DISCOVERY-Q-004 | 未接入真实定位时能否显示“距你”？ | 真实性、隐私和目标端权限 | 产品 Owner | closed | 2026-09-05：改为“参考距离” |
| DISCOVERY-Q-005 | 钓点“平均水深”当前错误使用 `elevationM`；列表契约是否增加 scene-specific `depthM`？ | API Presenter、类型和卡片显示 | 产品/架构 Owner | closed | 2026-09-05：fish 使用 `depthM`，drive 使用 `elevationM` |
| DISCOVERY-Q-006 | 详情“立即出发”是否必须展示高德/腾讯品牌选择？ | 地图供应商、合规、失败降级 | 产品/架构 Owner | closed | 2026-09-05：仅宿主系统地图和中性文案 |

## 决策日志

| 决策 ID | 决策 | 理由 | 决策人 | 日期 |
|---|---|---|---|---|
| DISCOVERY-DEC-000 | 本轮先冻结 discovery Change，不在冲突关闭前编码 | 新功能跨 mobile/API，必须遵守 Requirements/Design Gate | Harness 规则 | 2026-09-05 |
| DISCOVERY-DEC-001 | 采用六项推荐口径并进入增量实现 | 用户连续要求继续开发并要求改完后运行；方案不新增 schema/供应商/基础设施 | 用户（产品与架构 Owner） | 2026-09-05 |

## 来源冲突与版本差异

| 来源 ID | 冲突/变化 | 影响 FR/AC | 裁决人 | 状态 |
|---|---|---|---|---|
| SRC-DISCOVERY-PRD-HOME vs SRC-DISCOVERY-PRD-FISH | 城市入口分别为占位跳转与 V2 内联抽屉 | 城市选择 FR/AC | 产品/UX Owner | open |
| SRC-DISCOVERY-PRD-HOME | 同文档同时声明静态原型、Mock fallback 与服务端 routes 真相 | 列表、降级 FR/AC | 产品/架构 Owner | open |
| SRC-DISCOVERY-PRD-* vs current code | Top N 语义与 `rank desc` 冲突；钓点深度字段显示错误 | 排序/卡片 FR/AC | 产品/架构 Owner | open |
| SRC-DISCOVERY-PRD-SPOT vs parent Q-008 | 品牌地图选择依赖尚未选定供应商 | 导航 AC | 产品/架构 Owner | open |

关键问题已按 `DISCOVERY-DEC-001` 关闭；新增实时定位、品牌地图或不同数据真相时必须重新进入 Requirements/Design Gate。

