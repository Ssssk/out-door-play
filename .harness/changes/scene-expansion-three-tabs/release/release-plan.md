# 发布计划

> 状态：发布流水线脚本已就绪，实执行 `not-run`。发布 Gate 必须由授权人批准；AI 不得代批。用户于 2026-11-08 给出正式环境部署指令，范围见 `approvals/2026-11-08-production-deploy.md`。

## 前置条件

- 需求 Gate、设计 Gate、实现 Gate、验证 Gate、安全 Gate、UAT Gate、Operations Gate 依次通过并有真实证据。
- `01-clarification.md` 的 Q-E01 ~ Q-E03 与四条已批准 Change 冲突已于 2026-11-08 由用户逐条裁决并落盘，需在需求/设计 Gate 书面确认；Q-E04 在发布 Gate 前关闭。
- 用户裁决方案 A：`CHG-HOME-CATEGORY-001` 并入本 Change，不单独完成 / 发布；其代码全部纳入本 Change 的验证计划与发布 Gate 记录，本文件与 `gate-decisions.json` 的批准证据须写明该归属。
- 生产 Expand Migration、数据回填已获得针对目标、环境、动作的明确授权，备份点与恢复演练结论齐备。
- `CHG-HOME-CATEGORY-001` 的实现按 DEC-E10 作为代码基线随本 Change 一起发布，不单独发布。

## 发布顺序（DEC-E12）

| 步骤 | 动作 | 前置 | 停止阈值 | 状态 |
|---|---|---|---|---|
| R-01 | 部署 Expand Migration（只加 enum 值、列与索引，不改旧数据） | DDL 评估报告、备份点 | 锁等待或复制延迟超阈值 | `not-run` |
| R-02 | 发布 API（新枚举与兼容映射共存） | R-01 健康检查通过 | 旧包 `scene=fish` 出现 422/500 | `not-run` |
| R-03 | 执行可预览、幂等、可审计的数据回填与只读校验 | 生产授权、dry-run 一致 | 预览/实执行行数不一致 | `not-run` |
| R-04 | 发布管理后台（3 tab + 二级筛选 + 配置 3 项默认） | R-03 校验通过 | 配置保存 409 异常、路线列表 5xx | `not-run` |
| R-05 | 小程序构建上传体验版 → UAT → 提审 → 正式发布 | UAT Gate 通过、审核通道可用 | 真机白屏、分享详情不可用 | `not-run` |
| R-06 | 发布后观察与生产验证 | 值班与告警就绪 | 见 `operations/operational-readiness.md` 停止阈值 | `not-run` |

## 流水线实现（2026-11-08 已落盘，未实执行）

`.github/workflows/deploy-production.yml` 的 `deploy` job 按下列顺序执行；YAML 已通过 `yaml.parse` 语法校验，步骤数 15：

1. `Backup production database before schema expansion`：`mysqldump --single-transaction` 写入 `backups/pre-scene-expansion-<SHA>.sql.gz` 并 `test -s` 校验非空。
2. `Migrate, restart and backfill fuel prices`：既有 `db:deploy` 应用 Expand Migration，随后 `up -d --wait`。
3. `Backfill fish -> play/fishing (dry-run, apply, verify)`：三次调用幂等脚本，最后一次以 `mode=dry-run preview=0 discoveries / 0 rankings / 0 cities / 0 config` 作为停止阈值。
4. 既有数据源自检、磁盘诊断、站点同步与冒烟测试。

发布后须把工作流运行 ID、SHA、备份文件名、回填审计 JSON 与 `https://www.chumenliuliu.cloud/admin/routes` 的浏览器检查结果写入 `evidence/`；小程序包由 `deploy-miniprogram-experience.yml` 与微信审核通道单独处理，不在本流水线内。

## 灰度与监控

- API 与后台按现有灰度能力逐步放量；每步记录版本 digest、时间、执行者、退出码与观察指标。
- 观察指标：3 个分类列表请求占比、422 错误率、`scene=fish` 兼容请求量、详情 5xx、列表 P95、配置 409 频率。
- 小程序包不可瞬时回滚，正式发布前必须确认服务端兼容期覆盖旧包。

## 证据与签署

- 每步证据写入 `evidence/`，绑定制品 digest、SHA、命令、环境、时间与退出码。
- 签署：产品 Owner、架构 Owner、安全 Owner、发布负责人、独立 Reviewer；执行人与最终独立 Reviewer 不得为同一人。
- 当前未执行任何发布动作，无制品 digest、无批准记录。
