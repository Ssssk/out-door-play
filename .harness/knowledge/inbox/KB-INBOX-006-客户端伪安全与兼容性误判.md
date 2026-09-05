---
id: KB-INBOX-006
title: 客户端伪安全与“全端兼容”误判反模式
type: anti-pattern
status: draft
scope: [frontend, security, compatibility]
stack: [uni-app, vue3, wot-design-uni, nestjs]
tags: [XOR, Base64, localStorage, 客户端授权, 水印, 真机证据]
owner: unassigned
last_verified: null
related_changes: []
---

# 应避免的做法

1. 使用 XOR、Base64、固定客户端密钥或代码混淆后，把 Token/PII 存储描述为“已安全加密”。
2. 依赖客户端路由、按钮指令、菜单隐藏或水印阻止未授权访问和数据泄漏。
3. 通过条件编译成功、模拟器截图或单一 H5 测试，宣称支付、上传、定位、媒体等“全端兼容”。
4. 使用品牌/OS 名称硬编码能力，不做实际能力和权限检测。
5. 将源 Skill 中“最新、全版本、零瑕疵”等无法证实的绝对主张写入工程规范。

# 来源

- `uniapp-vue3-wot-design-uni-onepiece-3.0.zip`，SHA-256 `862487b717fdb2dc59ad569b68fb7f45897fe4c82f31e01d15bd1c1c1f95977c`。
- `security-hardening-onepiece-3.0.zip`，SHA-256 `be7aa151acabc581ced6b9ed7fff00caa0670164062878eef59a350aa4e9fa28`。
- 源包的 3.0 overlay 已部分修正这些风险；当前项目尚未执行专项验证。

# 为什么危险

- 客户端代码和密钥可被提取；可逆混淆不能建立保密边界。
- UI 隐藏只改变可见性，攻击者仍可直接调用 API；授权必须由 NestJS 在资源边界执行。
- 水印只能威慑普通截图，不能阻止调试、录屏、二次拍摄或网络抓取。
- 宿主版本、权限、隐私弹窗、原生组件层级和 SDK 行为会变化，编译成功不证明运行时正确。
- 绝对兼容声明会掩盖未测试平台，让发布 Gate 接受错误证据。

# 正确替代

- 优先使用服务端安全会话、短期凭证、刷新撤销和平台支持的安全存储；客户端只保存完成任务所需的最少信息。
- NestJS 对每个请求执行身份、角色/策略、租户/资源范围和字段级数据最小化。
- 客户端权限控制只用于体验；服务端拒绝必须通过稳定错误码反馈。
- 建立目标端能力矩阵，以设备、系统、宿主版本、构建 SHA 和结果形成证据。
- 对无法验证的平台明确 `not-tested` 或 `not-supported`，而不是从其他端外推。

# 识别信号

- 代码或文档出现 `xorEncrypt`、`Base64 encrypt`、硬编码 secret、永久 Token。
- API 只有登录校验，没有资源所有权/租户范围检查。
- 验收报告只有截图，没有接口、权限拒绝和真机环境信息。
- 兼容表所有端均为“支持”，却没有对应测试用例和设备记录。

# 验证与晋级条件

- 静态搜索客户端 Secret、可逆混淆、敏感日志和过度持久化。
- 使用越权账户直接调用 API，验证服务端拒绝而不是依赖 UI。
- 对声明支持的宿主执行权限拒绝、用户取消、弱网和系统中断测试。
- 由安全 Reviewer 复核数据分类、存储、会话和证据矩阵后，方可将本反模式晋级为 verified。

# 适用边界与失效条件

- 适用于所有不可信客户端，包括 H5、小程序和 App。
- 平台安全存储能力本身仍需核对威胁模型；“使用安全存储”不等于可以长期保存任意 Secret。
- 安全标准或平台策略变化后重新验证。

# 关联知识与规则

- `rules/11-安全与隐私规范.md`
- `rules/16-UIUX与可访问性规范.md`
- `skills/security-review/SKILL.md`
- `KB-INBOX-002`

