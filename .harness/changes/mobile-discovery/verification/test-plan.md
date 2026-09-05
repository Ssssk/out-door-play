# 测试计划

| 测试 ID | 关联需求/验收 | 层级 | 环境 | 前置数据 | 预期 | 自动化 |
|---|---|---|---|---|---|---|
| UT-DISCOVERY-API-001 | LIST/DETAIL AC | 单元 | Node/Vitest | fake repository | Presenter、scene、404、数组清洗正确 | 是 |
| UT-DISCOVERY-REPO-001 | AC-LIST-001/002 | 单元 | Node/Vitest | Prisma spy | public select、过滤、排序和 take 正确 | 是 |
| UT-DISCOVERY-STATE-001 | AC-CITY-002/LIST-003/004 | 单元 | Vue/Pinia mock | 可控 Promise | city fallback；旧响应不覆盖新响应 | 是 |
| CT-DISCOVERY-001 | API AC | 契约 | Nest runtime | OpenAPI delta | path/operation/error 与 runtime 一致 | 是 |
| IT-DISCOVERY-001 | AC-LIST-001/DETAIL-001 | MySQL 8.4 | 隔离 fixture | 重复 rank/下线/停用城市 | 稳定排序且不可见资源被过滤 | 是 |
| E2E-DISCOVERY-HTTP-001 | AC-LIST-002/DETAIL-001 | HTTP | 编译 Nest + MySQL | seed/不存在 ID | cities 200、非法参数 422、缺失 404 | 是 |
| E2E-DISCOVERY-H5-001 | CITY/LIST/DETAIL/A11Y | H5 浏览器 | API + MySQL | dev seed | 抽屉、空态、双场景、指标与详情正确 | 人工 smoke |
| BUILD-DISCOVERY-001 | AC-TARGET-001 | 构建 | 本机 | 当前工作树 | H5/mp-weixin 成功且 Secret scan 通过 | 是 |
| UAT-DISCOVERY-WX-001 | AC-ACTION/A11Y/TARGET | 真机 | 微信 | 候选制品 | 分享、地图、焦点、滚动、弱网 | 人工；pending |

## 单元与组件

API 34、Mobile 11、Admin 4 全部通过；Discovery 专项覆盖仓储、Presenter、乱序响应、同参数请求合并、城市 fallback、水深和键盘 Enter。

## MySQL/Redis/RabbitMQ 集成

MySQL 8.4 真实集成通过；Redis/RabbitMQ 不在范围且未伪造证据。

## API/事件契约

3 份 OpenAPI delta 共 17 operations 与 Nest runtime 对齐；本 Change 无事件。

## uni-app E2E 与目标端

H5 浏览器 smoke 已通过；H5 与 mp-weixin build 通过；微信真机 pending。

## UI/UX 与可访问性

H5 可读名称、选中语义、文本状态和卡片 Enter 自动化通过；完整焦点/读屏/微信触控 pending。

## 性能、容量和耐久

## 安全与软件供应链

Secret scan 和 lint/SAST 通过；SCA 2 high 未关闭，Security Gate 不通过。

## 产品 UAT

## 迁移、备份恢复和故障演练

## 影响面和核心回归

## 不稳定测试治理

## 退出标准

- 当前 SHA/制品：`HEAD a2a56a79851bda3ca129f27e63b3cf17b02a8b8b` + 未提交工作树；制品未冻结。
- 必需 Evidence 类型：静态、单元、契约、MySQL、HTTP/H5、双端构建、安全与 UAT。
- 允许 not-required 的批准人：架构/安全/Operations/Product Owner；Codex 不代签。

