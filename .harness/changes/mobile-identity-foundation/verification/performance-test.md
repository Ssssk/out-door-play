# 性能与容量验证

## NFR 与基线

- 已批准 NFR 只有微信交换 5 秒超时和并发 refresh 正确性；无生产吞吐/延迟目标。

## 数据规模、流量模型与环境

- 当前只有本地 MySQL 8.4 开发规模；生产用户、会话和收藏规模未知。实现后至少构造 20 并发 refresh 和双账号收藏集。

## API P50/P95/P99、吞吐和错误率

- 设计采集 login/provider/session/refresh/favorite 延迟与错误率；阈值需 Operations Owner 基于目标环境批准。

## MySQL 资源与瓶颈

- 检查 token hash 唯一索引命中、session 查询计划、连接池、锁等待与 refresh 条件更新冲突；未采用 Redis/RabbitMQ。

## uni-app 首屏、包体积与交互性能

- auth initialize 有界完成，不因等待形成永久白屏；记录 H5/微信构建体积变化和登录交互 pending 时长。

## 压测、耐久、峰值与降级结果

- 当前 `not-run`。不以单元测试或本地小数据宣称容量通过。

## 阈值、证据与结论

- 状态：`not-run`
- 生产性能/容量是 Operations/Release 输入，当前 pending。
