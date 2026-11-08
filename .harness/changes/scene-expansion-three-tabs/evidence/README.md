# 证据目录说明

> 现有执行证据：本地静态 / 单元 / 契约（`*-2026-11-08.evidence.json`）、正式环境部署与线上只读冒烟（`deployment-2026-11-08.evidence.json`）。需求/设计 Gate 已批准，Change 仍为 `implementing`；真实 MySQL 集成、备份恢复演练、微信端 UAT、E2E、独立 Reviewer 与后续 Gate 均 `not-run`。

## 命名与内容

- 机器可读证据：`evidence/<层级>-<日期>.evidence.json`，例如 `unit-2026-11-08.evidence.json`。
- 人工可读报告：`evidence/<主题>-<日期>.md`，例如迁移演练报告、四组合矩阵记录、目标端截图说明。
- 每个 `.evidence.json` 必须包含：`changeId`、`type`、`status`、`commit`、`environment`、`startedAt`、`finishedAt`、`command`、`exitCode`、`summary`、`runner`、`requirementIds`、`acceptanceIds`。
- `type` 取值限定：`static` / `unit` / `integration` / `contract` / `e2e` / `security` / `performance` / `migration` / `deployment` / `uat` / `accessibility` / `supply-chain` / `operational-readiness` / `backup-restore`。
- `status` 取值限定：`passed` / `failed` / `not-run` / `blocked`。

## 真实性要求

- 证据须绑定代码 SHA 或制品 digest、命令与参数、环境、依赖版本、开始与结束时间、退出码、报告位置、执行者或流水线身份（`AGENTS.md` §12）。
- 未运行的操作标 `not-run`，失败标 `failed`；不得把计划、模拟输出、旧报告或人工口述写成已执行证据。
- 不得删除、跳过、静默重跑或弱化失败测试以制造绿色结果。
- 截图只证明可视状态，不能替代接口、数据库、缓存、消息与错误路径验证。
- 目标端证据须写明具体端（微信小程序体验版/真机、后台 Chrome、H5），不得由 H5 推断小程序通过。

## Gate 与证据的关系

- 需求/设计 Gate 通过后，实现阶段才允许产生代码相关证据。
- 验证 Gate、安全 Gate、UAT Gate、Operations Gate、发布 Gate 均须引用本目录下的真实证据路径；`gate-decisions.json` 中已决策 Gate 的 `evidence` 数组必须指向存在的文件。
- 完成 Gate 要求至少一份机器可读 `.evidence.json` 且无未报告的失败或跳过项。
