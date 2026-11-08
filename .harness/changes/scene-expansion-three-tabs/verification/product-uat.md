# 产品 UAT

> 状态：计划稿，`not-run`。UAT Gate 必须由产品与业务验收人在冻结候选制品上通过，AI 不得代批。关联 `AC-EXP-001` 至 `AC-EXP-016`、`release/release-plan.md`、TEST-E-015。

## 冻结候选制品

- 待产生：API 制品 digest、后台构建产物、微信小程序体验版/提审版本号、当前代码 SHA、Migration 版本与回填批次号。
- 冻结前必须完成：实现 Gate、验证 Gate、安全 Gate 的证据齐备；`pnpm test:contract` 与四组合滚动矩阵通过。
- 当前无任何候选制品，`not-run`。

## 目标端矩阵

| 端 | 环境 | 验收人 | 状态 |
|---|---|---|---|
| 微信小程序体验版 / 真机 | 测试环境 | 产品 Owner | `not-run` |
| 微信正式包（发布后观察） | 生产 | 产品 Owner | `not-run` |
| 管理后台 Chrome | 测试环境 | 业务验收人 | `not-run` |
| H5 构建回归 | 本地/测试环境 | 测试执行者 | `not-run` |

只验证 H5 不得宣称微信小程序通过（`AGENTS.md` §6 红线 11）。

## 验收清单

| 编号 | 检查项 | 关联 AC | 结果 |
|---|---|---|---|
| UAT-E-01 | 小程序首页与后台均出现粗门溜车 / 粗门玩玩 / 粗门洗车 3 个分类 | AC-EXP-001 | `not-run` |
| UAT-E-02 | 后台可新建并筛选钓鱼 / 露营 / 打卡 3 个子类型 | AC-EXP-002 | `not-run` |
| UAT-E-03 | 非法组合有中文提示且未落库 | AC-EXP-003 | `not-run` |
| UAT-E-04 | 无数据分类展示明确空态 | AC-EXP-004 | `not-run` |
| UAT-E-05 | 钓鱼历史内容完整、详情与分享链接可打开 | AC-EXP-005、AC-EXP-006、AC-EXP-007 | `not-run` |
| UAT-E-06 | 收藏条目不丢且按新分类返回 | AC-EXP-008 | `not-run` |
| UAT-E-07 | 旧包 `scene=fish` 请求仍正常 | AC-EXP-009、AC-EXP-014 | `not-run` |
| UAT-E-08 | 隐藏分类拒列表、留详情；配置保存/恢复默认与 409 冲突提示正确 | AC-EXP-010、AC-EXP-011 | `not-run` |
| UAT-E-09 | 城市/榜单/seed/mock 与新枚举一致，无旧白名单文案 | AC-EXP-012 | `not-run` |
| UAT-E-10 | 契约、锁与复制延迟、权限日志、a11y 证据可查 | AC-EXP-013、AC-EXP-015、AC-EXP-016 | `not-run` |

## 结论与签署

- 结论：尚未执行，无通过与不通过判定。
- 签署栏（执行后填写）：产品 Owner、业务验收人、独立 Reviewer、发布负责人；执行人与最终独立 Reviewer 不得为同一人。
- 证据：验收记录、目标端截图、制品 digest、时间与退出码，写入 `evidence/`。
