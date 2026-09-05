---
id: KB-INBOX-002
title: uni-app 多端宿主能力适配与证据矩阵
type: pattern
status: draft
scope: [frontend, cross-platform, compatibility]
stack: [uni-app, vue3, typescript, wot-design-uni]
tags: [宿主适配, 能力检测, H5, 小程序, App, 真机]
owner: unassigned
last_verified: null
related_changes: []
---

# 要解决的问题

同一份 uni-app 页面在 H5、微信小程序和 App 中会遇到 API 可用性、权限流程、文件模型、渲染层级、生命周期和错误语义差异。若页面直接散落条件编译与平台判断，代码很快变成不可测试的分支集合，也容易把“能编译”误报为“端上可用”。

# 来源与证据等级

- 主要来源：`uniapp-vue3-wot-design-uni-onepiece-3.0.zip`，SHA-256 `862487b717fdb2dc59ad569b68fb7f45897fe4c82f31e01d15bd1c1c1f95977c`。
- 辅助来源：`uniapp-vue2-uview-onepiece-3.0.zip`，仅用于识别跨版本共性，不采用 Vue 2/uView 实现。
- 已有证据：源包结构与内部契约检查；未提供当前项目目标端真机证据。
- 当前结论：模式候选，状态 `draft`。

# 使用条件

- 功能涉及登录、支付、扫码、定位、上传、相册/相机、分享、推送、web-view、Canvas、音视频或平台权限。
- 同一业务能力需要覆盖两个及以上宿主。
- 需求已明确目标端和最低版本；未声明的平台不是默认承诺。

# 实施方式

1. 在 Change 中建立能力矩阵：业务能力、宿主、最低版本、权限、降级、Owner、测试方式和证据。
2. 定义业务侧稳定端口，例如 `PaymentPort`、`FilePickerPort`、`LocationPort`、`SharePort`，避免页面依赖具体宿主 API。
3. 每个适配器先做能力检测，再做授权状态检查；不要只依据品牌、操作系统名称或编译宏推断能力。
4. 统一返回可区分的结果：success、user-cancelled、permission-denied、unsupported、temporarily-unavailable、failed。
5. 页面只组合用例和展示状态；宿主差异、超时、取消、清理和错误映射封装在 adapter/composable。
6. 为不支持的平台设计真实降级：隐藏入口、只读模式、引导到受支持端或明确说明不可用，不伪造成功。
7. 对宿主专属能力保留设备、系统、基础库/运行时、构建 SHA、账号环境、时间和结果证据。

# NestJS/uni-app 技术约束

- 平台能力不可用不应诱导前端绕过服务端权限或业务校验。
- 条件编译用于隔离无法打包的宿主代码；业务视图中避免大量 `#ifdef`。
- 适配器输入输出使用 TypeScript 判别联合，不以 `any` 或模糊布尔值吞掉取消/拒绝/失败差异。
- 权限被永久拒绝时提供设置页引导，但打开系统设置属于用户可见动作，不应自动循环执行。
- H5 Mock 和模拟器只验证接口形状，不能替代小程序/App 的真机能力证明。

# 风险和反例

- 反例：只在 H5 运行一次，就将兼容矩阵全部标绿。
- 反例：使用 `systemInfo.brand === ...` 决定能力，而不调用能力检测。
- 反例：页面中几十处平台分支分别实现支付或上传，导致错误处理不一致。
- 风险：供应商 SDK、平台隐私规则和基础库变化会使旧结论失效。

# 验证清单

- 每个需求目标端都有 normal、拒绝权限、用户取消、弱网、超时、返回前后台和资源清理用例。
- 端口契约测试覆盖各判别结果；平台适配器有目标端或等价沙箱验证。
- 页面卸载后没有残留监听器、请求、媒体、Socket 或定时器。
- 证据绑定当前构建 SHA、平台版本和设备信息。

# 失效条件

- uni-app、平台基础库、原生插件或目标系统大版本发生变化。
- 能力接口、权限声明、隐私流程或应用商店政策变化。
- 项目支持矩阵变更但本记录未重新验证。

# 关联实现与证据

- `rules/04-前端工程规范.md`
- `rules/16-UIUX与可访问性规范.md`
- `skills/frontend-implementation/SKILL.md`
- `skills/integration-e2e-test/SKILL.md`
- 晋级要求：至少在需求指定的 H5/小程序/App 目标端完成一条真实 Change 的能力矩阵和证据复核。

