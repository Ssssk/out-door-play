# 前端页面流

## 目标平台

- Vue 3 Web Admin；不影响 uni-app H5/微信小程序路由。

## 页面/路由/分包变化

- 新增 `/login`，与 `AdminLayout` 分离。
- 业务路由增加 `permission` meta；菜单按权限过滤，但服务端仍是唯一授权边界。

## 用户流程

```text
冷启动 -> GET /admin/auth/session -> 有效：进入目标页
                            -> 401：跳 /login
登录 -> Cookie + actor/permissions/csrf -> 原目标页
退出 -> CSRF 写请求 -> 撤销 Cookie -> /login
```

## 加载、空、错、权限和弱网状态

- 恢复会话期间显示单一启动态，避免业务请求抢跑。
- 401 只清理一次并跳登录，不重放写操作；403 保留会话并显示无权限。
- 登录按钮有 pending 状态；错误消息不暴露账号存在性。

## Wot Design Uni 组件与主题使用

- 本 Change 属于 Element Plus Admin，不使用 Wot Design Uni；移动端零改动。

## 跨端差异和真机验证

- 验证 Chrome/Edge 同站 Cookie；生产必须 HTTPS 才设置 Secure。
- 跨站部署不在本基线内，若未来出现需另立 Change 评审 SameSite/CORS/CSRF。

