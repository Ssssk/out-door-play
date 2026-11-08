# 测试计划

> 状态：需求/设计 Gate 已批准，`06-tasks.md` TASK-E01 已完成，Change 进入 `implementing`。本文件**不代表任何测试已执行**；下表所有用例当前为 `not-run`。涉及生产 Migration、回填与发布的用例仍需针对目标、环境、动作的明确授权。

## 测试层级与命令

| 层级 | 命令 | 环境 | 覆盖 | 状态 |
|---|---|---|---|---|
| 静态检查 | `pnpm format:check`、`pnpm lint`、`pnpm type-check` | 本地工作树 | 类型与旧白名单残留 | `not-run` |
| 单元测试 | `pnpm test` | 本地工作树 | 枚举归一化、子类型校验、配置默认值、隐藏场景过滤 | `not-run` |
| 契约测试 | `pnpm test:contract` | 本地构建产物 | `contracts/openapi.yaml` 登记的 operation | `not-run` |
| 集成测试 | `pnpm test:integration` | 容器化 MySQL（与生产同版本） | DTO、Repository、详情、收藏、权限、错误码 | `not-run` |
| E2E | `pnpm test:e2e` | 本地全栈 | 后台路线列表与配置页主链路 | `not-run` |
| 构建回归 | `pnpm build:mp-weixin`、`pnpm build:h5`、`pnpm --filter @chumen/admin build` | 本地 | 三端构建产物 | `not-run` |
| 迁移演练 | `TASK-E02` / `TASK-E03` 产出的 dry-run 与恢复脚本 | 演练 MySQL | 行数、幂等、锁、恢复 | `not-run` |
| 目标端 | 微信体验版 + 真机 + 后台 Chrome | 测试环境 | 首页、列表、详情、分享、收藏 | `not-run` |
| 安全与供应链 | `pnpm security:scan` | 本地 | 依赖、Secret、越权 | `not-run` |

每条证据必须记录 Change ID、TASK/FR/AC/TEST ID、代码 SHA、命令、环境、依赖版本、开始/结束时间、退出码、报告位置与执行者；未运行标 `not-run`，失败标 `failed`，不得静默重跑或弱化断言。

## 用例清单

| TEST ID | 层级 | 关联 AC | 主要断言 | 状态 |
|---|---|---|---|---|
| TEST-E-001 | 静态检索 | AC-EXP-012 | 检索 `'drive' \| 'fish'`、`@IsIn(['drive','fish'])`、`scene === 'fish'` 等二元假设，除兼容映射与 Contract 说明外无遗漏 | `not-run` |
| TEST-E-002 | 单元 | AC-EXP-003、AC-EXP-011 | `normalizeScene()` / `assertSceneSubType()` 拒绝非法组合；配置默认 3 项；残留 fish 配置兜底不抛 500 | `not-run` |
| TEST-E-003 | 单元 | AC-EXP-010 | 隐藏场景列表返回 `[]`，详情与分享放行；`revision` 递增、并发冲突 409 | `not-run` |
| TEST-E-004 | 集成 | AC-EXP-002、AC-EXP-003 | play + 3 个子类型写入与筛选成功；`play/null`、`wash/camping`、新写入 `fish`、未知 subType 全部 422 且无落库 | `not-run` |
| TEST-E-005 | 集成 | AC-EXP-007、AC-EXP-008 | `GET /v1/routes/:id` 对 drive/play/wash 返回 200；`GET /v1/spots/:id` 放行 fish/play+fishing；收藏条目不丢且可打开 | `not-run` |
| TEST-E-006 | 集成 | AC-EXP-009、AC-EXP-014 | `scene=fish` 映射到 `play + fishing`，响应 `scene` 为真实存储值，无 422/500 | `not-run` |
| TEST-E-007 | 集成 | AC-EXP-010、AC-EXP-016 | 只读账号写入返回 403；四类日志事件可按 requestId/traceId 检索且不含敏感字段 | `not-run` |
| TEST-E-008 | 契约 | AC-EXP-013 | `pnpm test:contract` 退出码 0 且覆盖新参数；移除 `contractPaths` 本 Change 条目后反证不再覆盖 | `not-run` |
| TEST-E-009 | 迁移演练 | AC-EXP-005、AC-EXP-006 | dry-run 与实执行行数一致、第二次执行变更行数为 0、备份点可在 15 分钟内恢复 | `not-run` |
| TEST-E-010 | 性能/DDL | AC-EXP-015 | 列表 P95 ≤ 200ms；记录行数、锁等待、执行时长、复制延迟与磁盘占用 | `not-run` |
| TEST-E-011 | 后台 E2E | AC-EXP-001、AC-EXP-002、AC-EXP-004、AC-EXP-011 | 3 tab + 二级筛选 + 3 个新建按钮 + 空态 + 配置保存/恢复默认 | `not-run` |
| TEST-E-012 | 小程序目标端 | AC-EXP-001、AC-EXP-004、AC-EXP-007、AC-EXP-014 | 微信体验版与真机首页 3 分类、空态、详情分流 | `not-run` |
| TEST-E-013 | 滚动矩阵 | AC-EXP-014 | 旧包+旧服 / 旧包+新服 / 新包+旧服 / 新包+新服 四组合无 5xx、无白屏 | `not-run` |
| TEST-E-014 | 可访问性 | AC-EXP-016 | tab 语义角色、选中态、键盘可达与可见焦点、触控区域 | `not-run` |
| TEST-E-015 | 产品 UAT | AC-EXP-001 至 AC-EXP-016 | 冻结候选制品在产品与业务验收通过并签字 | `not-run` |
| TEST-E-016 | 安全 | AC-EXP-003、AC-EXP-016 | 越权与注入用例被拒、无 Prisma 实体直接外泄、日志脱敏 | `not-run` |
| TEST-E-017 | 构建回归 | AC-EXP-012、AC-EXP-013 | 小程序/H5/后台构建退出码 0，`components.d.ts` 无意外删改 | `not-run` |
| TEST-E-018 | 回归 | AC-EXP-001 至 AC-EXP-016 | 历史缺陷、共享能力与核心链路回归（含首页分类配置已有能力） | `not-run` |

## 前置与停止条件

- 前置：TASK-E01 人工 Gate 通过、TASK-E02 DDL 评估完成、演练 MySQL 与备份点可用、目标端测试包可获得。
- 停止：dry-run 行数与预期不符、备份不可恢复、旧包出现 422、无明确生产授权或工作区出现来源不明的重叠修改。
- Bugfix 须先保存修复前复现，再增加修复后防回归用例；异步测试禁止依赖任意 sleep，使用可观察条件与有限超时。

## 证据位置

执行报告写入 `evidence/`，机器可读文件按 `evidence/README.md` 的字段规范命名 `*.evidence.json`；截图只证明可视状态，不替代接口、数据库与错误路径验证。
