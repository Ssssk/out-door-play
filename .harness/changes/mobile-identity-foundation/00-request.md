# CHG-MOBILE-IDENTITY-001：普通用户身份与资源授权

## 来源

- 提出人：用户（项目负责人）
- 日期：2026-08-30
- 来源：`SRC-001`、`SRC-PRD-MINE`、`SRC-PARENT-APPROVAL`
- 原始要求：先实现剩余工作的第一项——普通用户登录及写接口授权。

## 业务目标

让微信小程序用户获得可信服务端身份，使资料修改、收藏读取和收藏写入只能作用于当前登录用户；匿名用户仍可浏览公开发现内容。

## 当前现状与证据

- `UserService` 使用常量 `local-dev-user`，所有调用方共享同一主体。
- `GET/POST /v1/user/me` 与 `GET /v1/user/favorites` 无用户 Guard。
- 移动端将资料和收藏长期保存在本地，并在服务端失败时仍显示保存成功。
- 父 Change 已批准微信登录与服务端会话/短期凭证方向。

## 初始范围

- 包含：微信 code 登录、开发环境身份适配器、access/refresh 会话、刷新轮换、退出撤销、用户 Guard、资料所有权、收藏查询/新增/删除、uni-app 会话状态与登录交互。
- 不包含：手机号登录、短信、公众号/H5 正式 OAuth、Redis、社交账号合并、头像上传、生产 Secret 配置和生产发布。

## 约束与风险

- 目标平台：微信小程序为正式认证目标；H5 只验证本地开发适配器和 UI 流程。
- `session_key`、AppSecret 不下发客户端、不写日志、不进入仓库。
- 缺少正式微信凭证与真机环境，生产 code2Session 只能实现不能宣称已联调。

## 成功信号

- 匿名调用受保护接口稳定返回 401；不同账号无法读取/修改对方资料与收藏。
- refresh token 仅能成功轮换一次，退出后 access/refresh 均失效。
- H5 本地 E2E 可完成登录、改昵称、收藏、退出；微信构建通过并保留真机 pending。

## Change 分类与强度

- 类型：feature + security
- 风险：high
- Gate：需要安全、集成/E2E、UAT；生产发布/Operations 不在本次授权范围。

