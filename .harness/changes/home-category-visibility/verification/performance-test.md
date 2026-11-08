# 性能与容量验证

## NFR 与基线

- `NFR-PERF-001`：`GET /v1/config/scene-tabs` 服务端处理耗时，容器化 MySQL / InnoDB，20 RPS 持续 5 分钟，P95 ≤ 200ms、P99 ≤ 500ms、错误率 < 0.1%。
- `NFR-RELI-001`：四类故障注入下首屏可渲染率 100%。
- 当前基线：`config.controller.ts:18-29` 的 `qrcodes` 为单行主键 `findUnique` + 字段级兜底，无缓存；本 Change 与其同构，理论上不增加查询复杂度，但**必须用实测证据确认，不能用推断代替**。

## 数据规模、流量模型与环境

- 配置数据：恒为 1 行（`system_configs` 中 `key = scene_tabs`），`items` 最多 2 项。
- 流量模型：公开配置读 20 RPS 持续 5 分钟；混合场景叠加首页列表请求，观察配置读是否成为串行阻塞点。
- 环境：与集成测试相同的容器化 MySQL 8 / InnoDB、Nest 测试应用；记录 Node、Prisma、MySQL 版本与机器规格。
- 小程序端：冷启动与 `onShow` 返回两个场景，记录配置请求耗时与首屏可交互时间的变化。

## API P50/P95/P99、吞吐和错误率

- 采集 `GET /v1/config/scene-tabs` 的 P50/P95/P99、吞吐与错误率；同时采集 `GET /v1/routes` 在隐藏场景短路前后的耗时对比。
- 断言：P95 ≤ 200ms、P99 ≤ 500ms、错误率 < 0.1%；隐藏场景短路时 `Discovery` 查询次数为 0。
- 结果绑定当前 SHA、命令、环境、开始/结束时间、退出码与报告路径。

## MySQL、Redis、RabbitMQ 资源与瓶颈

- MySQL：单行主键读，无 join / 无分页 / 无全表扫描；关注连接池占用与慢查询日志。
- Redis / RabbitMQ：`not-required`（DEC-008、ADR-006），不引入，因此无 Key、TTL、队列积压与消费者瓶颈验证。
- 服务端不做进程内缓存：避免多实例在保存后长时间返回旧配置；该决策以一致性优先，代价由 `NFR-PERF-001` 的实测阈值兜底。

## uni-app 首屏、包体积与交互性能

- 配置请求与列表请求并行发起，配置失败不串行阻塞首屏；`cached` 命中时零额外网络请求。
- 新增一个 composable 与一个后台页面，小程序包体积增量应可忽略；构建产物对比上线前后体积并记录。
- 分类切换保留 300ms 点击节流，不引入额外重渲染。

## 压测、耐久、峰值与降级结果

- 压测：`TEST-PERF-001`，20 RPS × 5min。
- 耐久：持续 30 分钟低频配置读，观察连接池与日志增长。
- 峰值：短时 50 RPS，确认无 5xx 激增。
- 降级：配置接口返回 5xx / 超时时小程序按 `AC-CFG-011` 回退，不产生重试风暴；服务端记录 `scene_tabs_config_invalid` 等事件。

## 阈值、证据与结论

- 证据类型：`performance`、`integration`；报告路径 `evidence/`（含命令与退出码）。
- 生产观测能力缺口：当前仓库无独立 APM，生产 SLI 无法直接取证，由 Operations Gate 显式裁决 `not-required` 或补充观测方案，不写成已通过。
- 状态：`not-run`
