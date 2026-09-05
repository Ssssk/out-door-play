# 后端领域设计

## 受影响模块和聚合

只读 City/Discovery 查询，不改变聚合或 schema；`CitiesController` 复用 RoutesModule 导出的查询服务。

## 用例输入/输出

输入为 6 位 city、`drive|fish`、limit 1..20 或合法 slug ID；输出经 RoutesService Presenter 最小化为 city/card/detail DTO。

## 业务不变量和状态转换

只返回 enabled city 与 online discovery；route/spot scene 必须匹配；公开缺失统一 `DISCOVERY_NOT_FOUND`；Top N 按 rank、distanceKm、id 升序。

## Repository/服务端口

`DiscoveryRepository` 定义 `listCities/list/find`；`PrismaDiscoveryRepository` 使用显式 public select、bounded take 和稳定 orderBy，Domain/Application 不直接泄露 Prisma record。

## 事务、并发和幂等

全为只读查询，无事务和补偿；相同 DB 快照与参数返回确定 ID 顺序。

## 领域事件

无写入、无领域事件；RabbitMQ not-required。

