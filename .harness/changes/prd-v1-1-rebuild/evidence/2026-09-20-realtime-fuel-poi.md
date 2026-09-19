# 实时附近加油站修正

- Change: CHG-OUTDOOR-V110-001 / TASK-FUEL-POI-001
- 基线提交：2b568a659256149df7416114a6961955568da8e1。
- 用户明确要求：获取用户经纬度后实时调用腾讯 POI 加油站检索；服务端不维护这批站点数据。该明确指令修正此前同步落库设计。
- FR/AC：定位成功才查询；坐标透传腾讯附近检索；不访问站点表；拒绝定位、空结果和上游失败分别反馈；30 条客户端分页适配腾讯 20 条分页；过滤充电桩；不补造站点油价。
- 设计：保留 /v1/fuel/stations，lat/lng 为必填 GCJ-02 坐标。服务端签名代理腾讯请求，固定域名和 8 秒上游超时；最多两次上游请求/客户端页；最多 200 条候选。total 是腾讯候选数，过滤后的 UI 只显示已找到条数。错误码 FUEL_LOCATION_REQUIRED / FUEL_POI_UNAVAILABLE。Secret 不下发前端，不记录原始 URL/异常。
- 停止注册 StationSyncService，旧数据模型与后台台账不做删除迁移。STATION_SYNC_ENABLED 不再控制附近查询。
- 配置：GitHub 环境页面实际名称 production，确认 TENCENT_MAP_KEY/TENCENT_MAP_SECRET/STATION_SYNC_ENABLED 三个 Secret 名称存在，未读取值。工作流将前两个 Secret 显式写入部署环境，停用旧同步。
- CI 故障复现：Harness Contract #45 在 prisma generate 报缺少 SHADOW_DATABASE_URL，非 POI 业务测试失败；补齐隔离 CI 地址。
- 验证：新前端 6 个行为测试通过；后端初轮 88 个测试通过。后续构建、实时接口和目标端结果继续补记；未执行项不能视为通过。
- 回滚：回滚本次代码提交并重新构建部署；不涉及数据库迁移或业务数据删除。
- 生产与微信真机 UAT 尚未验证，Gate 仍 pending。

## 本地验证 2026-09-20 00:18–00:24 +08:00
Windows / Node 22 / pnpm；执行者 Codex。api test：16文件90测试通过；mobile test：11文件33测试通过；api/mobile type-check 与 api build、mobile build:mp-weixin 通过；test:contract：4契约18操作通过；lint：0错误16既有告警；format:check、security:secret、Harness 校验、7个发布工具测试通过。日志位于本机 TEMP/fuel-api-tests.log、fuel-lint.log、fuel-build.log。此记录绑定本次待提交工作树，远端 SHA 与运行结果后补。

## 补充定位回归
加油页显式刷新设备坐标，避免同一会话永久复用旧位置；其他调用方默认缓存行为保持。mobile test 34 个通过，type-check 和小程序构建通过。实测本地 HTTP：health 200，无坐标422，未配置腾讯 Key 时503/FUEL_POI_UNAVAILABLE；未伪装成空列表。

## 远端验证 2026-09-20
- 提交 `2f2263b` 已推送到 `main`，组件 CI release #23（提交 `c102c4b`）通过。
- Harness Contract #48（运行 ID `35455402309`）的安装、格式、Lint、类型检查、单元、契约、构建、集成、E2E 和 Secret 扫描步骤均已执行；最终仅因依赖安全审计阻断：两项已批准例外于 2026-09-15 过期，另有四项未批准 high advisory（`GHSA-wc9g-mqfw-jrwm`、`GHSA-qfvm-cv95-jqjf`、`GHSA-535w-7cp7-47q4`、`GHSA-7q85-xj36-vmfc`）。未绕过该门禁。
- `Deploy production` 是 `workflow_dispatch` 手动工作流；截至记录时没有提交 `2f2263b` 的生产部署运行。线上只读检查 `https://www.chumenliuliu.cloud/v1/health` 返回 200，但 `/v1/fuel/stations` 仍返回 `station-*` 种子数据，不能作为实时腾讯 POI 的正向证据。部署后冒烟脚本已写入 `.github/workflows/deploy-production.yml`，待获授权并成功部署后执行。
