# Incident 响应计划

## 事件等级和触发条件

| 等级 | 触发条件 |
|---|---|
| P0 | 首页完全不可用、所有用户看不到任何分类、列表接口大面积 5xx |
| P1 | 隐藏场景列表未生效（伪安全）、配置保存静默覆盖、详情或分享链接不可用、生产数据被误删 |
| P2 | 单个后台账号无法保存、并发冲突提示异常、日志事件缺失、配置生效明显延迟 |
| P3 | 文案歧义、非关键样式偏差 |

## Incident Commander 与角色

- Incident Commander：发布负责人 / Q-004 指定人选。
- 角色：产品 Owner（业务影响与对外口径）、架构 Owner（API/数据）、前端/后端实现者（只读诊断与修复）、独立 Reviewer（修复评审）、Operations Owner（观测与值班）。
- 主要实现者不得担任最终独立 Reviewer 并批准自己的修复（`AGENTS.md` §6 红线 12）。

## 告警、通信和升级路径

- 告警路由见 `operations/slo.yaml`；通信渠道由 Q-004 指定。
- 升级顺序：运营发现 → 发布负责人 → 架构/安全 Owner → 产品 Owner；涉及 P0/P1 时立即通知全部角色。
- 记录事件时间线、影响范围、决策人与证据路径，不把口述写成已执行证据。

## 只读诊断与止损顺序

1. 后台查看 `revision` / `updatedAt` 与当前 `items`，确认是否误配。
2. 调用公开 `GET /v1/config/scene-tabs`，核对启用项与排序。
3. 检索 `scene_tabs_config_invalid` / `scene_tabs_config_rejected` / `scene_tabs_config_conflict` / `scene_tabs_list_denied` 日志，按 requestId/traceId 串联。
4. 用只读 SQL 核对 `system_configs` 单行，不执行任何写入。
5. 止损优先「恢复默认」；若代码缺陷导致，按 `release/rollback-plan.md` 执行 API/后台 revert。

## 功能开关、回滚和数据保护

- 业务级开关即运营配置；默认配置是安全垫。
- 不执行数据库回滚、`DELETE`、备份还原（除非经发布负责人明确授权）；不做数据清理或收藏迁移。
- 小程序包不可瞬时回滚，需在沟通中明确用户侧生效时间取决于微信版本更新。

## 用户、业务和管理层通知

- P0/P1 由产品 Owner 决定对外口径；不自动发送外部消息、邮件或通知（需明确授权）。
- 内部通知包含：影响端（小程序/后台）、影响范围、已采取的止损、预计恢复与观察窗口。

## 恢复验证和观察窗口

- 验证清单见 `release/rollback-plan.md`「回滚后验证」；观察一个业务日，保持 DEFAULT 配置不变更。
- 退出标准：指标回到基线、无 0 分类、详情可用、日志无异常激增，并由产品 Owner 确认。

## 复盘、证据和防复发 Change

- 满足强制沉淀条件（P0/P1、同类问题第二次发生、排障超过 30 分钟）时执行 `knowledge-capture`。
- 复盘产物：时间线、根因、修复 SHA、防回归测试 ID、门禁缺口与后续 Change 编号。
- 不得把未生效设计写入 Wiki，不得把未验证经验标记为 `verified`。
