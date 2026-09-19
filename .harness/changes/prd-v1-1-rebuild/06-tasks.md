# 实施任务

任务格式：`TASK-XXX`，每项必须关联需求/验收，并有完成证据。

- [x] TASK-001 `[FR-PROGRAM-001][AC-PROGRAM-001]` 复制并接入 Harness，不复制示例 Change
- [x] TASK-002 `[FR-SOURCE-001][AC-SOURCE-001]` 固定 PRD v1.1.0 与旧代码关键哈希
- [x] TASK-003 `[FR-ASIS-001][AC-QUALITY-001]` 执行旧项目结构和修改前质量审计
- [x] TASK-004 `[NFR-TRACE-001]` 检索第二大脑并记录适用性
- [x] TASK-005 `[FR-SOURCE-001][AC-SOURCE-002]` 产品 Owner 裁决 PRD 页面、版本、镜像和 AC 冲突
- [x] TASK-006 `[FR-ARCH-001][AC-ARCH-001]` 架构 Owner 裁决 Prisma/TypeORM、Redis/MQ 和认证边界
- [x] TASK-007 `[NFR-QUALITY-001]` 修复现有 Admin typecheck 并建立 admin 最小测试
- [x] TASK-008 `[FR-PLAN-001][AC-PLAN-001]` 创建并排序首批阻塞 Changes：dependency-security-baseline、admin-foundation
- [x] TASK-009 `[FR-PROGRAM-001]` 配置十类真实质量命令并将 project-quality 切为 active
- [ ] TASK-010 `[NFR-SEC-001][AC-SEC-001]` 完成 Secret/SAST/SCA/SBOM 基线（命令与 SBOM 已接入；剩余 2 个 uni-app/Vite high，Security Gate 仍失败）
- [x] TASK-011 完成 Requirements/Design Gate 人工批准
- [x] TASK-012 在已批准的首个垂直 Change 中开始业务实现（Admin foundation 与 Mobile identity 均已进入实现）
- [x] TASK-013 `[FR-CI-001][AC-CI-COMPONENT-001][AC-CI-ORDER-001]` 建立按提交路径选择组件、按 API → 管理 Web → 小程序串行执行的 CI，并完成真实 GitHub Actions 验证
- [x] TASK-014 `[FR-CI-002][AC-CI-PLUGIN-001]` 将本地插件改为“仅推送代码 / 推送并发布体验版”双流程，增加项目级路径与去重标记配置，并用临时 Git 远程验证普通推送和体验版去重顺序

## 依赖顺序

TASK-005/006/Owner 确认 → Requirements Gate → Design Gate → TASK-007/008/009/010 → 首个业务 Change。

## 并行边界

- PRD 冲突清理、Owner 指定和 Admin 质量基线可并行。
- ORM 迁移与业务实现不可在架构 Gate 前并行启动。

## 暂停/回退条件

- 用户不接受推荐范围/ORM策略；更新澄清与设计，不继续编码。
- 现有未提交资产无法建立恢复点；停止覆盖式重构。
- 发现 Secret 已被跟踪或管理写接口暴露于非本地环境；升级安全处理。

## Owner 与 Gate 交接

| TASK | 执行人 | 验证人 | 对应 Gate | Evidence |
|---|---|---|---|---|
| TASK-001~004 | Codex | 用户/Reviewer 待定 | requirements | 当前 Change 文件、命令日志 |
| TASK-005 | 产品 Owner | 测试 Owner | requirements | 决策与来源映射 |
| TASK-006 | 架构 Owner | 安全/运维 Owner | design | ADR/设计 |
| TASK-007~010 | 工程角色 | 独立 Reviewer | implementation/security | 自动化 Evidence |
| TASK-013 | 工程角色 | 独立 Reviewer | implementation/verification | evidence/2026-09-06-component-ci-release.md |


## TASK-FUEL-POI-001（用户 2026-09-20 明确修正）
按用户定位实时代理腾讯 POI 查询，停用同步表依赖，修复 GitHub Secret 注入，验证分页/权限/错误/竞态。FR/AC 与设计见 evidence/2026-09-20-realtime-fuel-poi.md。实现中；生产与真机验证 pending。
