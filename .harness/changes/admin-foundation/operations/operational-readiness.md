# 生产运营就绪评审

## 服务与业务 Owner

- 产品/架构/安全 Owner：用户；运行与值班 Owner 待指定。

## SLI/SLO、错误预算和基线

## 容量、限流、降级和功能开关

- 登录端点：IP+username 单进程窗口 10 次/15 分钟；账号 5 次失败锁 15 分钟。
- 会话：空闲 2 小时、绝对 12 小时；每 5 分钟最多滑动写一次。
- 不允许通过关闭 Guard 降级。认证故障时进入维护窗口。

## Dashboard、日志、Trace和告警

- 需要指标：login success/fail/throttle、401/403、CSRF reject、session create/revoke、audit write failure。
- 所有审计携带 `x-request-id`；日志禁止密码、Cookie、CSRF 和认证头。

## MySQL、Redis、RabbitMQ Runbook

1. 启动 MySQL：`pnpm db:up`，等待 healthcheck healthy。
2. 部署 schema：`pnpm db:deploy`；失败立即停止，不启动 Admin。
3. 首次 bootstrap：在 `apps/api/.env` 临时写三项 `ADMIN_BOOTSTRAP_*`，执行 `pnpm --filter @chumen/api admin:bootstrap`，成功后删除三项。
4. 验证匿名 `/v1/admin/routes` 为 401；登录后 Cookie 为 HttpOnly/SameSite=Lax，写请求缺 CSRF 为 403。
5. 撤销账号：设置 AdminUser disabled 并撤销其全部 AdminSession；禁止直接改 Cookie。
6. Redis/RabbitMQ 不属于本 Change，不得为了认证临时引入。

## 备份恢复和灾难恢复演练

## 值班、升级路径和供应商联系

## 发布观察窗口和退出标准

- 观察至少 30 分钟；401/403、登录失败率、审计失败率异常即停止发布。
- 退出标准：migration reconcile、bootstrap、角色矩阵、Cookie/CSRF E2E、审计查询全部通过。

## 运维负责人结论

- 结论：`pending`
- 本地演练：Docker/MySQL healthy、首次与重复 migration、bootstrap、登录/退出/审计通过；测试管理员与测试业务数据已清理。
- 阻塞：CI 空库演练、监控指标实现和运维 Owner 审批未完成。

