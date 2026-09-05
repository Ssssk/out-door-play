---
name: change-completion
description: 在发布和观察完成后核对全部 Gate、追踪、证据、残余风险、Wiki 与知识沉淀，再完成 Change 和归档；准备标记 completed 时使用。
---

# Change 完成、知识沉淀与归档

## 触发条件

- Change 已发布并完成观察，准备从 `released` 进入 `completed`。
- 已完成但尚未归档的 Change 需要核对和移入 archive。
- 取消的 Change 需要记录原因、副作用和已产生知识。

## 不适用场景

- 尚在实现、验证、待发布或观察中的工作。
- 用文档补写掩盖实际未测试、未发布或未审批。
- 删除历史记录以保持目录整洁。

## 前置 Gate

- 需求、设计、实现、验证、安全和发布 Gate 均为 passed 或经规则允许的 not-required。
- 独立 Reviewer 通过，且 Reviewer 不是主要实现者。
- 不存在未解决 P0/P1；P2/P3 有 Owner、期限和风险接受。

## 必读上下文

1. `manifest.yaml`、治理、流程、测试、发布和知识治理 Rules。
2. 当前 Change 的全部文件、契约、diff、evidence、评审、部署和监控结果。
3. 当前 Wiki 与知识库，确定哪些事实、经验、事故、决策需要同步。
4. `knowledge-capture` Skill 与归档脚本说明。

## 输入

- 最终 SHA/制品、发布环境、版本、观察窗和生产验证结果。
- 完整 FR/NFR/AC、TASK、测试和 Gate 状态。
- 残余风险、后续 Change、Wiki 更新和知识候选。

## 执行步骤

1. 核对状态、审批和最终交付范围，比较请求、设计与实际 diff。
2. 对每个 FR/NFR/AC 追踪设计、TASK、测试、证据和最终结论。
3. 核对全部 TASK 状态；部分完成不得把整个 Change 写成完成。
4. 核对静态、单元、集成、契约、E2E、安全、回归和必要性能证据。
5. 核对独立 Reviewer 身份、结论、发现关闭和复评记录。
6. 核对实际发布、数据库迁移、灰度、冒烟、监控和回滚可用性。
7. 核对产品 UAT、目标端可获得性、Operations Gate、SLO、备份恢复和 Incident 计划。
8. 核对 `source-baseline.json`、`gate-decisions.json` 与全部 `.evidence.json` 机器记录一致。
7. 区分计划与事实；所有未执行项保留 `not-run`，不得改写成通过。
8. 将已经生效的架构、接口、数据、Key、事件、权限、部署事实同步到 Wiki。
9. 执行知识沉淀判断：经验、事故、ADR、模式、反模式或 Runbook 写入 knowledge。
10. 更新 `completion.md`，记录交付、证据、偏差、风险、知识和后续 Change。
11. 运行 `node .harness/scripts/validate-harness.mjs` 并保存真实输出。
12. 仅在所有完成条件满足后将状态改为 `completed`；之后才可运行归档脚本。
13. 归档后复核链接和索引，保留全部历史证据。

## 技术约束

- Wiki 只记录已上线当前事实，不记录未实现计划和过时临时方案。
- 知识记录必须注明状态、边界、证据和 last_verified，敏感数据需脱敏。
- Change 归档必须保留原始契约、证据、审批和失败记录，不压平为总结。
- 后续工作使用新 Change，不在已完成 Change 中继续无边界追加任务。
- 完成报告中的 SHA、版本和环境必须与发布证据一致。

## 产物

- 完整 `completion.md` 和准确的 `status.yaml`。
- 最终 `gate-decisions.json`、机器 Evidence、UAT 与运营就绪结论。
- 更新后的 Wiki、knowledge 记录及 `knowledge/index.yaml`。
- Harness 校验输出、最终追踪矩阵和残余风险清单。
- `completed` Change 或保留原结构的 archive 记录。

## 验证与证据

- 运行 Harness 校验为零错误；警告需处理或说明。
- 从每个 AC 随机反向打开证据，确认文件存在且对应最终 SHA/环境。
- 检查 Wiki 内容与生产实际一致，知识状态与验证证据匹配。
- 归档后本地链接有效，索引仍可检索，历史状态未被改写。

## 停止与升级条件

- 任何 Gate 未通过、证据缺失、追踪断裂或 Reviewer 不独立。
- 产品 UAT、Operations Gate 或来源基线未完成且没有合法 not-required 决策。
- 生产发布/观察未完成或实际结果与 completion 声明不一致。
- 存在未解决 P0/P1、未知数据副作用或无法回滚的异常。
- Wiki 或知识更新会把未验证计划写成当前事实。

## 禁止事项

- 不伪造命令、测试、审批、部署、监控或评审证据。
- 不因项目排期直接把 `released` 改为 `completed`。
- 不删除失败记录、风险和历史设计，不覆盖已归档 Change。
- 不让实现者以自己的总结替代独立评审。

## 完成定义

全部需求和 AC 有最终证据；所有 Gate 合规；生产结果和观察窗可核验；Wiki 与第二大脑已同步；残余风险受控；Harness 校验通过；Change 可以安全完成并保留可追溯历史。
