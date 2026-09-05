# 实施任务

任务格式：`TASK-XXX`，每项必须关联需求/验收，并有完成证据。

- [x] DISCOVERY-TASK-001 `[FR-DISCOVERY-*][AC-DISCOVERY-LIST-002]` 冻结 OpenAPI、错误码、DTO 与 Presenter
- [x] DISCOVERY-TASK-002 `[FR-DISCOVERY-CITY-001][FR-DISCOVERY-LIST-001][FR-DISCOVERY-DETAIL-001]` 实现查询服务、Repository port/Prisma adapter 与稳定排序
- [x] DISCOVERY-TASK-003 `[FR-DISCOVERY-STATE-001][NFR-DISCOVERY-REL-001]` 实现 cities API 主路径、latest-wins、empty/error/fallback/retry
- [x] DISCOVERY-TASK-004 `[FR-DISCOVERY-LIST-001][FR-DISCOVERY-ACTION-001][NFR-DISCOVERY-A11Y-001]` 修复指标/距离文案、详情状态和键盘交互
- [x] DISCOVERY-TASK-005 `[ALL]` 编写单元、组件、契约、MySQL 集成和 H5 E2E 并保存证据
- [x] DISCOVERY-TASK-006 `[ALL]` 执行知识检索并记录采用/不采用结论
- [ ] TASK-006 更新 Wiki、知识沉淀、发布与回滚文档
- [ ] TASK-007 完成 UI/UX、可访问性和目标端证据（如适用）
- [ ] TASK-008 完成 Secret/SAST/SCA/SBOM 供应链评审（如适用）
- [ ] TASK-009 完成性能、容量、SLO、告警和运营就绪（如适用）
- [ ] TASK-010 完成产品 UAT 和 Gate 决策一致性检查（如适用）

## 依赖顺序

001 契约先行；002 后端与 003/004 前端可按同一冻结契约推进；005 在实现同步编写并最终回归。

## 2026-09-05 实施断点

- TASK-001~004：公开查询已切到 Repository port/Prisma adapter；城市、列表、详情 Presenter 与稳定错误码落地；客户端状态、latest-wins、水深、参考距离和系统地图落地。
- TASK-005：全仓 API 34、Admin 4、Mobile 11 单元/组件测试通过；MySQL 3 files/4 tests、HTTP E2E 5 tests、17 operation 契约均通过；H5 人工 smoke 覆盖城市、空态、双场景、详情和 404。
- TASK-007：H5 可访问名称、卡片 Enter 自动化和视觉 smoke 已执行；微信真机、焦点关闭恢复和产品 UI/UX 签署仍 pending。
- TASK-008：Secret 与 lint/SAST 通过；npm audit 仍有 uni-app 依赖链 Vite 的 2 个 high，Security Gate 不通过。

## 并行边界

本轮单执行者串行修改共享契约；不修改 identity/fuel/admin 行为。

## 暂停/回退条件

需要 schema、真实定位、品牌地图 SDK、新依赖或改变已批准收藏契约时返回 Design Gate。

## Owner 与 Gate 交接

| TASK | 执行人 | 验证人 | 对应 Gate | Evidence |
|---|---|---|---|---|

