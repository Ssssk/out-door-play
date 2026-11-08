# Requirements / Design Gate 批准

- Change：`CHG-HOME-CATEGORY-001`（`home-category-visibility`）
- 批准人：用户（项目 Owner；本 Change 兼产品、架构与 UX 审批角色）
- 时间：2026-11-08T07:11:04Z
- 用户回复：`确认`
- 上下文：紧接在助手提交需求/设计评审稿并列出「Q-001 截图范围、Q-002 默认文案与 Q-003 收藏页取舍、Q-004 Owner 人选」三项确认，以及「确认后推进 `requirements_ready` / `design_ready` 并按任务顺序开工」的请求之后。用户回复「确认」视为对评审稿与三项口径的批准，并授权进入实现阶段。

## 批准内容

1. 范围：只做首页内部分类目录（场景胶囊）的显隐、名称与排序；不改底部 `tabBar`；隐藏语义为「拒列表、留详情」。
2. 后台模块位置：在「系统配置」分组下新增独立菜单项「首页分类目录」、路由 `/system-config/scene-tabs`、页面 `SceneTabsConfigView.vue`（DEC-006 方案 B）。
3. 技术方案：复用 `SystemConfig` 键 `scene_tabs`，零 Migration；公开 `GET /v1/config/scene-tabs`、管理端 `GET/PUT /v1/admin/config/scene-tabs`，权限沿用 `config:read` / `config:write`；服务端过滤隐藏场景、详情不受影响；`expectedUpdatedAt` 条件更新处理并发；不引入 Redis / RabbitMQ / 新表。
4. 口径确认：
   - Q-001：两张会话截图即本需求范围，来源与映射经用户核对，`source-baseline.json` 可标记 `verified`；截图本身为会话内嵌图片、未落盘、无哈希，此限制仍然成立。
   - Q-002：`fish` 默认显示名称采用「粗门钓鱼」。
   - Q-003：接受一期收藏页隐藏分类后，已收藏的隐藏场景内容在收藏列表不可见，但详情仍可打开；若后续要求保留，另立二期 Change。
   - Q-004：由用户本人担任本 Change 的产品、设计、UAT 与发布 Owner；安全、Operations、独立 Reviewer 与完成 Gate 仍须在各自证据齐备后由对应角色签署，AI 不代批。
5. 上线默认配置与旧版一致（仅「粗门溜车」显示）；`City.scenes` 只修正误导文案，城市级覆盖留二期。
6. 实现阶段必须把本 Change 契约登记进 `apps/api/src/scripts/verify-openapi-contract.ts` 的 `contractPaths`（DEC-011）。

## 未批准 / 仍需人工签署

- Implementation、Verification、Security、UAT、Operations、Release、Completion Gate 均为 `pending`。
- 任何生产发布、生产写入、外部消息与不可逆操作仍需针对目标、环境与动作的明确授权。
- 小程序正式发布仍需微信审核与发布负责人批准。
