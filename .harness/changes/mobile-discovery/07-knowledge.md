# 知识检索与沉淀

## 开始前检索

- 检索时间：2026-09-05
- 查询词与范围：`discovery/首页/钓鱼/路线/城市/详情`、`uni-app/Vue/Pinia`、`NestJS/Prisma/MySQL`、`loading/empty/error/fallback/排序/旧响应覆盖`；范围为 `.harness/knowledge`、`.harness/wiki`、历史 Changes 与当前代码。
- 使用命令或方式：`rg -i` + 逐文件核对 `knowledge/index.yaml`、Wiki、PRD 和现有实现。
- 命中的知识 ID：`ADR-006`（verified）、`KB-INBOX-002`（draft）、`KB-INBOX-004`（draft）、`KB-INBOX-008`（draft）。
- 适用性判断：`ADR-006` 直接适用，继续使用 Prisma 且不引入空 Redis/MQ；三个 inbox 仅供测试与风险设计参考，不能作为唯一正式依据。
- 采用/不采用理由：采用按宿主能力隔离、请求竞态和运行时契约指纹的验证思路；具体 API/UI 仍以本 Change 经 Owner 裁决的 PRD 契约和当前代码事实为准。

## 过程中发现

- 新问题、无效尝试、决策或可复用模式：当前 `useDiscovery` 的 loading guard 会丢弃 loading 期间的新 city/scene 请求，且 scene 先改变，失败后没有恢复旧 tab；后续设计需要明确 latest-wins/cancel 语义。`CitiesController` 直接访问 Prisma，不符合后端分层要求。`rank desc` 与 Top N 语义、钓点水深使用 `elevationM` 均需 Owner 确认业务口径。
- 是否满足强制沉淀条件：暂不满足；Change 完成后依据竞态和降级验证决定是否晋级相关 inbox 记录。

## 完成时沉淀

- 新增/更新知识 ID：pending
- 知识状态与验证证据：pending
- Wiki 同步项：公开 discovery API、排序、降级与目标端事实在 Change 生效后更新
- 无需沉淀时的理由：pending

