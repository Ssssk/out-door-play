---
id: KB-INBOX-004
title: uni-app 页面/组件生命周期隔离与资源清理
type: pattern
status: draft
scope: [frontend, lifecycle, reliability]
stack: [uni-app, vue3, typescript]
tags: [onUnload, onUnmounted, websocket, media, timer, cleanup]
owner: unassigned
last_verified: null
related_changes: []
---

# 要解决的问题

uni-app 页面生命周期和 Vue 组件生命周期不是同一层。把页面宏散落到普通组件，或只在一个生命周期里清理资源，可能导致返回页面后仍存在 Socket、媒体实例、定时器、事件订阅、网络回调和屏幕方向状态，最终出现重复消息、内存增长、音视频后台继续播放或旧页面被回写。

# 来源与证据等级

- 来源：`uniapp-vue3-wot-design-uni-onepiece-3.0.zip` 的页面瘦身、媒体、WebSocket、eventBus 与生命周期经验。
- SHA-256：`862487b717fdb2dc59ad569b68fb7f45897fe4c82f31e01d15bd1c1c1f95977c`。
- 当前项目验证：`not-run`；保留为 draft 模式候选。

# 使用条件

- 页面或组件注册全局事件、网络状态、Socket、定时器、媒体、Canvas、定位、传感器或长任务。
- 页面可反复进入退出、被 keep-alive、进入后台或因平台机制被销毁。
- 异步结果可能晚于页面卸载返回。

# 实施方式

1. 页面根组件负责 `onLoad/onShow/onHide/onUnload/onBackPress` 等页面语义；普通子组件使用 Vue `onMounted/onUnmounted`。
2. 每个资源创建动作紧邻登记对应 disposer；统一清理器必须幂等，可被页面与组件钩子重复调用。
3. Composable 返回显式 `start/stop/dispose`，不依赖调用者猜测内部注册了哪些监听器。
4. 请求支持取消或使用 generation token；完成时先检查调用实例仍是当前实例。
5. Socket 区分应用级共享连接与页面级订阅：页面退出仅取消自己的订阅，不误杀其他页面连接。
6. 媒体退出依次停止播放、解绑事件、销毁上下文、恢复方向/亮度等宿主状态，并清空业务引用。
7. keep-alive 页面明确 `onShow/onHide` 的暂停/恢复策略，不能只依赖 `onUnmounted`。

# NestJS/uni-app 技术约束

- 不在普通组件中无条件调用只适用于页面的宏；如果 composable 需要兼容两者，要求调用方传入生命周期或返回 disposer。
- 全局 event bus 订阅必须具有稳定 handler 引用，确保能精确取消。
- 组件卸载后不得继续触发 toast、导航、store 覆盖或 DOM/Canvas 写入。
- 资源清理失败要可观测，但清理过程不应抛出导致后续清理全部中断。

# 风险和反例

- 反例：只执行 `clearInterval`，遗漏 Socket listener、网络 listener 和媒体上下文。
- 反例：在每个页面各建一个永久 Socket，退出时不关闭。
- 反例：`try/catch {}` 静默吞掉注册/清理错误，导致测试无法发现泄漏。
- 风险：不同宿主对后台、销毁和 keep-alive 的调用顺序不同，必须按目标端实测。

# 验证清单

- 同一路由进入/退出 50 次，订阅数、定时器数、连接数和媒体实例不随次数增长。
- 页面卸载后注入延迟响应，不发生 UI/Store 旧状态回写。
- 前后台切换、系统中断、权限弹窗和用户取消后资源可恢复或正确关闭。
- 目标端调试/性能工具没有持续增长的监听器和明显内存斜率。

# 失效条件

- uni-app/Vue 生命周期语义、keep-alive 策略或宿主插件变化。
- 资源从页面级改为应用级，或连接所有权发生变化。

# 关联实现与证据

- `skills/frontend-implementation/SKILL.md`
- `skills/integration-e2e-test/SKILL.md`
- `KB-INBOX-002`

