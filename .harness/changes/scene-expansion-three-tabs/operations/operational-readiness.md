# 运营就绪

> 状态：计划稿，全部项 `not-run`。Operations Gate 需 SLO、容量、告警、Runbook、值班、备份恢复与 Incident 计划就绪并经人工批准。

## 就绪清单

| 项 | 本 Change 要求 | 产物 | Owner | 状态 |
|---|---|---|---|---|
| SLO / SLI | 路线列表 P95 ≤ 200ms、可用性目标与正确性口径 | `operations/slo.yaml` | 后端 Owner | `not-run` |
| 容量 | `sub_type` 列与新增索引的磁盘/行数评估；回填批次大小 | `verification/performance-test.md` 报告 | 数据库 Owner | `not-run` |
| 告警 | 5xx 升高、`SCENE_SUBTYPE_INVALID` 突增、兼容映射失败、回填失败 | 告警规则与路由 | 运维 Owner | `not-run` |
| 日志 | 兼容映射、非法子类型、回填批次、隐藏场景拒绝四类事件可按 requestId/traceId 检索 | 日志断言测试 | 后端 Owner | `not-run` |
| Runbook | 配置回滚、兼容映射降级、旧包共存处置、回填中止 | Runbook 文档 | 运维 Owner | `not-run` |
| 值班 | 发布窗口与观察期值班人、升级路径 | 值班表 | 发布负责人 | `not-run` |
| 备份恢复 | 回填前备份点、反向映射清单、15 分钟恢复演练 | `operations/disaster-recovery.md` | 数据库 Owner | `not-run` |
| Incident | 分级、止血、回滚、复盘与知识沉淀 | `operations/incident-plan.md` | 运维 Owner | `not-run` |

## 发布后观察

- 观察指标：3 个分类的列表请求量占比、422 错误率、兼容 `scene=fish` 请求量、详情 5xx、配置保存 409 频率、回填相关慢查询。
- 停止阈值：`scene=fish` 请求出现 422/500、旧包白屏、钓鱼分享详情 5xx、P95 超 200ms 且持续、回填行数不一致。
- 观察结论与生产观察期记录写入 `evidence/`；当前无观察数据。

## 结论

尚未执行任何运营就绪检查，Operations Gate 保持 `pending`；当前 `not-run`。
