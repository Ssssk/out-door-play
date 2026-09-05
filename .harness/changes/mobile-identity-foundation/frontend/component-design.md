# 前端组件设计

| 组件/页面 | 职责 | Props/Events | 状态归属 | API 依赖 | 测试 |
|---|---|---|---|---|---|
| login/index | 选择平台登录、展示错误与回跳 | route `returnTo` 白名单 | 局部 pending/error + auth store | identity login | H5 组件/E2E、微信真机 |
| mine/index | 匿名/已登录资料和退出入口 | 无 | auth profile + page loading | me/logout | 状态矩阵/E2E |
| mine-edit/index | 当前资料表单与提交 | 无 | 局部 form/pending/error | PATCH me | 校验/失败不假成功 |
| favorites/index | 场景筛选、加载/空/错 | 无 | page query + auth | GET favorites | scene/401/空/错 |
| DetailActionBar 调用方 | 收藏当前 Discovery | item id | 单项 pending + server state | POST/DELETE favorite | 重复/失败/登录回跳 |
| auth store | 会话状态机、初始化、刷新、登录、退出 | actions | Pinia + 最小持久化 | identity/me | single-flight/原子清理 |
| identity adapter | 微信 `uni.login` 或 H5 dev 输入 | login request | 无持久状态 | auth API | 平台分支/取消/超时 |
| request client | Bearer、错误码、一次读重放、requestId | auth policy | refresh Promise | 所有 API | 并发 401/写不重放 |

## Pinia 与 composable 变化

- 新增 `useAuthStore`：`status`、`accessToken`、`refreshToken`、`accessExpiresAt`、`refreshExpiresAt`、`profile`；action 包含 initialize/login/refresh/logout/clear。
- 持久化只保存恢复会话所需 token/expiry；profile 是可丢弃缓存。退出、refresh 失败和账号切换原子清除用户范围缓存。
- `useRequireAuth` 只处理 UX 导航，不作为授权边界；`returnTo` 通过枚举/白名单编码。
- 现有 app store 只保留 city；移除 profile/favoriteIds 的持久业务真相。

## 请求竞态、取消与重复提交

- `initializePromise` 与 `refreshPromise` 分离；每类同时最多一个。
- 请求增加内部 `authRetryCount`，仅 required/optional GET 且未取消时最多重放一次。
- POST/PATCH/DELETE 即使业务幂等也不因 401 自动重放；页面提示重新操作。
- 页面写操作使用本地 pending key 防重复；收藏使用 Discovery ID 分区。
- 页面卸载后忽略结果/取消可取消请求，不能关闭其他页面的全局 loading。
