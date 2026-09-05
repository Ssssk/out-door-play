# CHG-OUTDOOR-V110-001：出门溜溜 v1.1.0 重建计划与 Harness 接入

## 来源

- 提出人：用户
- 日期：2026-08-30
- 关联来源：桌面附件 `chumen-liuliu-prd(1)` 与旧项目 `E:\code_house\skill2\out-door-play`
- `source-baseline.json` 来源 ID：`SRC-USER-001`、`SRC-PRD-001`、`SRC-CODE-001`
- 原始版本/哈希：PRD `v1.1.0`，项目规范 SHA-256 `067c1fa0...f1feb6bb`；旧项目 HEAD `a2a56a7...` 且工作树存在大量未提交实现。

## 业务目标

以最新 PRD 为产品来源、旧项目为可复用资产、`harness(uniapp+nest)` 为工程契约，重新组织“出门溜溜”的移动端、运营后台和 NestJS API 开发流程。先形成可追踪的需求与架构基线，再按垂直业务切片交付，避免一次性推倒重来或继续在无 Gate 的状态下堆功能。

受影响用户包括移动端户外自驾/垂钓用户、运营人员和后续维护人员。预期结果是每个功能都能从 PRD 来源追踪到代码、测试、UAT 和发布证据。

## 当前现状与证据

- Monorepo 已包含 `apps/mobile`、`apps/api`、`apps/admin`，但主要目录当前未提交。
- 移动端使用 uni-app/Vue 3/Pinia/Wot Design Uni，已有首页、加油、我的、路线/钓点详情、资料编辑、收藏和关于页面。
- API 使用 NestJS 11 + Prisma 7 + MySQL，已有城市、路线/钓点、油价/站点、用户/收藏和管理端接口。
- 管理后台使用 Vue 3 + Element Plus，已有路线、榜单、城市、油价、用户、UGC、分析和报表视图。
- 修改前验证：`pnpm test` 通过 4 个测试；H5 与微信小程序构建通过；`pnpm type-check` 因管理后台表格行类型等错误失败。
- 未发现 Redis、RabbitMQ、服务端认证/授权、限流或完整 OpenTelemetry 接入。
- 私钥文件和 `apps/api/.env` 当前被 Git 忽略；`apps/api/.env.development` 尚未被忽略，存在误提交风险，未读取其值。

## 初始范围

- 包含：
  - 接入 Harness、固定 PRD 和旧代码基线。
  - 识别 PRD 冲突、现有覆盖率、技术债和安全缺口。
  - 决定 Prisma/TypeORM、Redis/MQ、目标端、认证和版本范围。
  - 将完整产品拆成可独立验收的垂直 Change。
  - 后续 Change 按优先级实现移动端、API 和运营后台。
- 不包含：
  - 在本程序级 Change 内一次性实现并发布全部页面。
  - 未经 Gate 执行生产部署、数据库写入、应用商店上传或外部通知。
  - 删除旧项目、重写 Git 历史或读取/输出 Secret。

## 约束与风险

- 目标平台候选：首批 H5 + 微信小程序；App 与其他小程序需产品确认，不因存在构建脚本自动承诺。
- 管理端候选：Chrome / Edge 当前受支持版本，准确范围待确认。
- PRD `v1.1.0` 内仍有 v1.0.0/Template 文案、重复 AC 和未注册页面，来源状态保持 pending。
- ORM、Redis、RabbitMQ、登录体系和真实外部数据源均需要架构/产品决策。
- 现有未提交资产必须先建立可恢复基线，再进行高风险重构。

## 成功信号

- 每个已批准业务切片均有唯一 FR/AC、代码、测试和 UAT 证据。
- Harness 与项目质量门禁能够真实阻断失败。
- 管理写接口具备服务端认证、资源授权和审计。
- 首批目标端主链路通过产品验收，未测试平台明确标记。
- 发布后的错误率、关键请求延迟和业务失败可通过 requestId/traceId 定位。

## Change 分类与强度

- 类型：migration（程序级重建与 Harness 接入）
- 风险：high
- 需要：需求、设计、实现、验证、安全、UAT、Operations、发布和完成 Gate。
- 当前状态：clarifying；本文件不授权业务实现。

