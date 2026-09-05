# 需求规格

## 用户与场景

- 匿名访客浏览路线、钓点和油价；进入“我的”时可以选择登录。
- 微信小程序用户通过平台临时 code 建立本系统身份。
- 已登录用户维护自己的资料和收藏；禁用用户不得继续使用旧会话。

## 功能需求

### FR-IDENTITY-001 建立与维护普通用户会话

- 描述：用一次性微信 code 换取平台身份，并签发本系统不透明 access/refresh token。
- 来源：SRC-PARENT-APPROVAL 批准范围 5-6、SRC-001。
- 业务规则：access 15 分钟；refresh 30 天并单次轮换；退出/禁用立即撤销；微信 `session_key` 不下发。
- 权限：登录/刷新公开但限流；退出需要有效 access token。
- 失败行为：无效 code/凭证统一返回稳定认证错误，不泄露 OpenID、token 或平台内部响应。

### FR-PROFILE-001 当前用户资料读写

- 描述：已登录用户读取和更新自己的昵称/头像引用。
- 来源：SRC-PRD-MINE 的 mobile-mine 与 mobile-mine-edit。
- 业务规则：昵称 trim 后 1-16 字；当前不实现二进制头像上传。
- 权限：服务端从认证上下文确定 userId，客户端不能指定目标用户。
- 失败行为：匿名 401、禁用/过期 401、校验失败 400、未知资源不暴露他人信息。

### FR-FAVORITE-001 当前用户收藏读写

- 描述：按 drive/fish 查询收藏，并幂等新增或删除一个在线 Discovery 收藏。
- 来源：SRC-PRD-MINE 的 mobile-mine-favorite 与 mobile-route-detail。
- 业务规则：`(user_id, discovery_id)` 唯一；重复收藏/取消仍返回确定结果；不存在或不可见资源返回 404。
- 权限：所有读写使用当前认证主体，不接受 userId。
- 失败行为：匿名 401，跨用户数据不可见，写失败时客户端不得显示成功。

## 非功能需求

### NFR-IDENTITY-SEC-001 会话与敏感数据

- 数据库只存 token 哈希；AppSecret 只从服务端环境读取；日志和响应不含 token、OpenID、session_key。
- 开发身份适配器在 production 必须 fail closed。

### NFR-IDENTITY-REL-001 并发与恢复

- 同一 refresh token 并发刷新至多一个成功；客户端并发 401 共享 single-flight；写请求不自动重放。
- 微信交换超时 5 秒；平台失败映射稳定错误并可由用户重试。

## 非目标

手机号/短信、H5 正式 OAuth、账号合并、上传、Redis、MQ、生产部署与真实微信凭证管理。

## 来源追踪

| FR/NFR | 来源 ID | 来源锚点 | 版本 | Owner确认 |
|---|---|---|---|---|
| FR-IDENTITY-001 | SRC-PARENT-APPROVAL/SRC-001 | 批准范围 5-6/当前实现指令 | 2026-08-30 | 用户 |
| FR-PROFILE-001 | SRC-PRD-MINE | mobile-mine-edit §2/§6 | v1.1.0 | 父 Requirements Gate |
| FR-FAVORITE-001 | SRC-PRD-MINE | favorite §2/§6 + route-detail §3/§4 | v1.1.0 | 父 Requirements Gate |
| NFR-IDENTITY-SEC-001 | SRC-001 | 写接口授权 | 2026-08-30 | 用户 |
| NFR-IDENTITY-REL-001 | SRC-PARENT-APPROVAL | 服务端会话/短期凭证 | 2026-08-30 | 用户 |

## 依赖与假设

- 依赖 MySQL 8.4、Prisma 7、Node fetch 与微信 `code2Session`。
- 本地数据库为隔离开发数据；微信 AppSecret 尚未提供。

## 未决问题

- H5 生产身份提供方、微信正式凭证、隐私政策与真机 UAT 在发布前由 Owner 决定。

