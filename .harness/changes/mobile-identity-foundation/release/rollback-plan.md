# 回滚计划（未授权执行）

## 触发条件与决策人

- 跨用户访问、dev provider 在生产可用、token/身份泄露、refresh 大面积失败、资料/收藏数据错误或 provider 持续不可用。
- Release Owner/Incident Commander 决定；P0/P1 先止损保护用户与数据。

## 应用回滚

- 关闭登录入口/灰度；撤销全部移动 session 并要求重新登录；回退 API/mobile 到已知兼容制品。
- 禁止恢复固定 `local-dev-user` 或关闭 Guard 来恢复服务。

## 数据库回滚/前向修复

- additive identity/session 表保留，不生产 drop；应用兼容旧 users/favorites。
- 身份映射或收藏数据异常先只读核对/备份，数据修复需独立授权与审计。

## Redis Key/消息处理

- Redis/RabbitMQ 未采用，not-required 候选。

## 外部副作用补偿

- 微信 code2Session 无持久外部写副作用；已签发本系统 session 通过撤销处理。

## 回滚后验证

- 公开发现可读、所有旧 mobile session 401、Admin 不回归、无跨账号数据变化；记录版本、操作者、时间、查询和观察窗口。
