---
id: KB-INBOX-003
title: uni-app 冷启动认证与并发 401 竞态治理
type: solution
status: draft
scope: [frontend, authentication, startup]
stack: [uni-app, vue3, pinia, nestjs]
tags: [冷启动, onLaunch, onLoad, 401, token-refresh, single-flight]
owner: unassigned
last_verified: null
related_changes: []
---

# 现象与影响

- 冷启动时首屏请求先于登录态恢复/换取 Token，瞬间出现一批 401。
- 多个请求同时收到 401，各自刷新 Token，造成刷新风暴、Token rotation 相互失效或重复跳登录。
- 页面已经卸载后，刷新队列仍回写旧页面状态或重放已取消请求。

# 环境与触发条件

- uni-app `onLaunch` 执行异步会话恢复，页面 `onLoad`/`onShow` 同时发起受保护请求。
- Token 有刷新机制，多个 API 请求可能并发。
- H5、小程序和 App 的启动/恢复时序不完全一致。

# 来源与当前证据

- 来源：`uniapp-vue3-wot-design-uni-onepiece-3.0.zip` 中 `launchLock.ts`、`request.ts` 与 domain overlay。
- SHA-256：`862487b717fdb2dc59ad569b68fb7f45897fe4c82f31e01d15bd1c1c1f95977c`。
- 源实现提供思路但未在当前项目运行；其固定行为和错误协议不能直接复制。

# 排查过程与证据

1. 在入口、会话恢复、首屏请求、401、刷新开始/结束、队列释放和登出位置记录同一 requestId/启动批次 ID。
2. 对比 `onLaunch` 完成时间与首个受保护请求时间，确认是否为启动阶段竞态。
3. 统计一次 Token 失效期间的 refresh 请求数；大于 1 表明缺少 single-flight 或锁失效。
4. 检查刷新失败后队列是否全部拒绝、会话是否清理、是否发生无限重放。
5. 检查页面卸载或 Abort 后是否仍被队列恢复。

# 根本原因

“应用尚未决定会话状态”和“运行中凭证刚失效”是两个不同状态机，却常被一个 401 拦截器混在一起。缺少启动就绪屏障、单航班刷新、有限重放和取消传播时，并发请求会放大竞态。

# 解决方法

## 临时止损

- 首屏受保护区域在会话状态为 `initializing` 时展示加载态，不发起写请求。
- 刷新失败时统一拒绝等待队列并清理会话，禁止无限递归重试。
- 对非幂等请求不自动重放，提示用户确认结果或重新操作。

## 永久修复

1. 建立显式会话状态：`initializing | authenticated | anonymous | refreshing | expired`。
2. 冷启动屏障只负责等待首次会话判定，必须具有超时和失败路径，不能永久悬挂。
3. 运行期刷新使用 single-flight Promise；并发 401 共享同一刷新结果。
4. 每个请求最多因认证刷新重放一次，并标记已重放，防止循环。
5. 仅当请求仍有效且允许重放时恢复；传播 Abort/页面卸载状态。
6. Token rotation 成功后原子更新会话；失败则一次性清理并跳转登录，避免多次导航。
7. NestJS 明确区分未认证、Token 过期、无权限和会话撤销错误码，前端不靠 message 文本猜测。

# 无效方法及原因

- 任意 `setTimeout` 等待 300ms：设备和网络不同，无法形成正确性保证。
- 每个请求独立刷新：产生刷新风暴和 rotation 竞态。
- 对所有 401 无限重试：认证服务异常时形成请求风暴。
- 只设置全局 `isRefreshing` 布尔值但不处理拒绝/取消：队列可能永久悬挂或错误成功。

# 验证方法与结果

当前项目结果：`not-run`。晋级前至少验证：

- 冷启动 20 个并发受保护请求只产生一次会话初始化/刷新。
- 刷新成功后允许重放的请求各完成一次；非幂等请求不被隐式重放。
- 刷新失败、超时、撤销和网络断开时所有等待者有确定错误，无悬挂 Promise。
- 页面卸载和请求取消后不回写状态。
- H5、目标小程序和 App 分别保留启动时序证据。

# 适用边界与失效条件

- 适用于存在异步会话恢复或刷新 Token 的客户端。
- 若改为纯服务端 Session、无刷新机制或公开页面，不应机械引入启动锁。
- 认证协议、Token rotation、宿主生命周期或请求库变更后需重验。

# 关联文件、Change 与知识

- `rules/04-前端工程规范.md`
- `skills/frontend-implementation/SKILL.md`
- `wiki/09-认证与权限模型.md`
- `KB-INBOX-002`

