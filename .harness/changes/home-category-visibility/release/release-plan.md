# 发布计划

> 发布 Gate 为 `pending`。本文是评审稿，未执行任何生产发布、生产写入或不可逆操作。

## 制品与版本

- API：NestJS 应用制品（实现后填写 SHA/digest）；包含 3 个新接口与列表/收藏过滤。
- 管理后台：Vue 3 静态制品（实现后填写 SHA/digest）；包含新菜单、路由与配置页。
- 小程序：`pnpm build:mp-weixin` 产物，上传开发版后生成体验版二维码；正式发布需微信审核通过（实现后填写版本号与审核单号）。
- 契约：`contracts/openapi.yaml` 与 `contracts/error-codes.yaml` 随代码一同发布，并登记进 `contractPaths`。

## 环境与配置变更

- 数据库：无 DDL、无 Migration；`system_configs` 可选新增 `key = scene_tabs` 一行（由运营首次保存创建）。
- 配置变量：不新增环境变量、不新增 Secret、不改 Cookie/CSRF 策略。
- 默认配置随代码内置（读取端兜底），发布时不要求预置数据库记录，避免生产写入前置依赖。

## 数据迁移顺序

1. 无迁移；部署前只需确认 `system_configs` 表存在且既有 `qrcodes` 配置未受影响。
2. 部署后由运营在后台执行一次「查看」，确认公开接口返回 DEFAULT（`revision = 0`、`updatedAt = null`、仅 `drive` 启用）。
3. 观察期内不修改配置，避免把发布验证与配置变更混在一起。

## API/Worker/消费者发布顺序

1. **API 先行**：新增接口与服务端过滤。此时无配置记录，C 端可见行为与上线前一致；旧小程序包不请求新接口。
2. **管理后台**：部署新菜单与配置页，运营只读核对。
3. **小程序**：构建 → 上传开发版/体验版 → UAT → 提交审核 → 正式发布。
4. 无 Worker、无消费者、无 MQ 拓扑变化；无 Outbox 回填任务。

## 灰度或功能开关

- 不引入代码级功能开关；「是否开启新分类」本身就是运营配置，等价于业务灰度。
- 灰度步骤：正式发布后保持 DEFAULT 观察一个业务日 → 由运营开启钓鱼分类 → 在体验版/真机确认 C 端生效 → 再决定是否保留。
- 停止阈值：首页分类为空、列表 5xx 上升、配置接口错误率 > 0.1%、分享详情打不开，任一出现即停止后续配置变更并执行 `release/rollback-plan.md`。

## 发布前检查

- UAT Gate：`pending`（`verification/product-uat.md` 未执行）
- Operations Gate：`pending`（`operations/operational-readiness.md` 未签署）
- Security/Supply-chain Gate：`pending`（`security/supply-chain-review.md` 状态 `not-run`）
- 制品 SHA/digest 与 SBOM：`not-run`
- 额外检查：`pnpm test:contract` 覆盖本 Change 3 个 operation；H5 与 MP 双端构建通过；`components.d.ts` 新增组件声明未被构建误删；默认配置断言通过。

## 发布后验证与观察窗口

- 观察窗口：一个业务日（建议 24h），跟踪配置接口错误率、首页列表错误率、分类渲染异常、分享详情可达性。
- 验证项：后台 `revision/updatedAt` 与公开接口一致；隐藏场景列表返回空数组；详情 200；`scene_tabs_*` 日志无异常激增。
- 生产观测能力若不足以覆盖 `operations/slo.yaml` 的 SLI，由 Operations Gate 显式裁决，不写成已通过。

## 小程序/App审核与用户可获得性

- 小程序：服务器 `Deploy production` 只更新 API/数据，**不会改变用户手机端已安装代码包**；C 端配置生效必须等待小程序新包正式发布并被用户更新。
- 体验版二维码用于 UAT；正式发布需微信公众平台提交审核，审核周期不可控，发布计划需预留时间。
- App：不在本期支持矩阵，`not-required` 由产品 Gate 裁决。

## Incident Commander 与通信渠道

- Incident Commander：由 Q-004 指定（发布负责人兼任或单独指派），未指定前发布 Gate 保持 `pending`。
- 通信渠道：项目现有协作渠道；升级路径见 `operations/incident-plan.md`。

## 审批与执行权限

- 需求 Gate / 设计 Gate：已于 2026-11-08T07:11:04Z 由用户（产品、架构 Owner）批准；其余 Gate 仍须各自证据齐备后由对应角色签署。
- 发布 Gate：发布负责人；生产配置变更由运营在后台执行，属已授权业务操作。
- 任何生产数据库写入、删除、回滚或外部消息发送都需要针对目标、环境与动作的明确授权；本 Change 设计上不要求这些操作。
