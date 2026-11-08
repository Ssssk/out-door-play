# Requirements / Design Gate 批准

- Change：`CHG-SCENE-EXPANSION-001`（`scene-expansion-three-tabs`）
- 批准人：用户（项目 Owner；沿用 `CHG-HOME-CATEGORY-001` Q-004 的 Owner 安排，兼产品 Owner、架构 Owner、UX Owner 与发布负责人口径）
- 时间：2026-11-08（会话内日期，未记录精确到秒的时间戳）
- 用户回复：`批准两个 Gate 并开始实现`
- 上下文：用户先就 3 个路线 tab 选择了「正式扩展 Scene 枚举 + 独立 Change + Prisma Migration + 后端/小程序全链路 + 契约与测试 + 重新走需求/设计 Gate」，再逐条裁决 Q-E01 ~ Q-E03 与四条已批准 Change 冲突，最后在 `01-clarification.md` 的裁决结论、需求/设计评审稿与 `validate-harness.mjs` 全绿的基础上批准本 Gate。

## 批准内容

1. **范围**：顶层业务分类扩为 `drive` 粗门溜车 / `play` 粗门玩玩 / `wash` 粗门洗车；`play` 下设 `fishing` 钓鱼 / `camping` 露营 / `checkin` 打卡；原钓鱼数据并入 `play/fishing`；`fish` 保留为兼容期只读值，Contract 阶段另开 Change。
2. **Q-E01 ~ Q-E03**：
   - Q-E01：接受「粗门洗车」与「露营/打卡」一期空态，不预置演示数据。
   - Q-E02：确认 `fishing` / `camping` / `checkin` 与中文「钓鱼 / 露营 / 打卡」。
   - Q-E03：钓鱼不作为后台顶层 tab，归入「粗门玩玩」子类型；后台保持 3 个 tab；API 层保留 `scene=fish` 读兼容。
3. **四条冲突裁决**：
   - 冲突 1（DEC-004 / FR-CFG-006）：认可「新增场景需独立 Change」例外条款已满足；白名单口径修订为「业务写入白名单 ⊆ `enum Scene` 值集合，`fish` 只读不写」；范围固定 3 值，运营不能自造 scene。
   - 冲突 2（DEC-010 / DEC-009 / DEC-012）：采用**两层默认** —— 服务端下发默认 3 项全启用，小程序本地故障/旧服兜底仍仅 `drive`；新包白名单扩 3 值但配置不可用时降级到仅 `drive`；同步修订 `NFR-COMPAT-001` 阈值与 `AC-EXP-014`。
   - 冲突 3（FR-CFG-003 / FR-CFG-005）：确认详情端点永不引入分类显隐判断、只做 `find(id, scenes[])` 集合放行；`scene=fish` 兼容映射后仍走 `enabledScenes()` 短路；钓点专属字段按 `subType === 'fishing'` 判定。
   - 冲突 4（状态 `implementing` / DEC-012）：方案 A —— `CHG-HOME-CATEGORY-001` 并入本 Change，不单独完成/发布；其代码验证与发布证据归入本 Change 的验证计划与发布 Gate 记录；上一 Change 的 Gate 值不自动推进。
4. **技术方案**：Prisma 7 Migration 走 Expand → Migrate → Contract；新增 `apps/api/src/common/scenes.ts` 收敛白名单；`Discovery.subType` 显式枚举列与 `(city_code, scene, sub_type)` 索引；回填可预览、幂等、可审计；不引入 Redis / RabbitMQ / 新表 / 新依赖；小程序不新增详情页。
5. **验证要求**：契约文件登记进 `verify-openapi-contract.ts` 的 `contractPaths`；四组合滚动矩阵、迁移演练、目标端真机与 UAT 按 `verification/` 执行；证据须真实，未执行标 `not-run`。

## 来源基线核对

`source-baseline.json` 由 `pending` 标为 `verified`：SRC-E01（用户结构化裁决）、SRC-E02（后台截图与文字请求）、SRC-E03（已批准 Change 决策）、SRC-E04（当前工作树代码事实）经用户逐条裁决与 Gate 书面核对。限制仍成立：SRC-E01 / SRC-E02 为会话内文字与内嵌截图，未落盘、无 `sha256`，此限制不得写成已消除。

## 未批准 / 仍需人工签署

- Implementation、Verification、Security、UAT、Operations、Release、Completion Gate 均为 `pending`。
- Q-E04：生产数据回填的授权人、备份点、维护窗口与恢复演练安排，发布 Gate 前确认。
- 生产 ENUM 变更与数据回填、生产发布、小程序提审与正式发布均需针对目标、环境、动作的明确授权，本批准不覆盖。
- 独立 Reviewer 与完成 Gate 须在证据齐备后另行签署，AI 不代批。
