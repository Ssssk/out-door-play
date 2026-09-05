# 架构说明

## 当前边界

本阶段目标是让产品在本地完整跑通，不提前绑定云厂商。NestJS 服务已通过 Prisma 连接 Docker MySQL 8.4，业务数据由数据库持久化；控制器和前端 API 契约保持稳定，未来选择云服务器后可直接迁移 MySQL 数据与已有迁移记录。

```text
apps/mobile (UniApp)
  └─ /v1 HTTP API
       └─ apps/api (NestJS)
            ├─ routes / spots
            ├─ cities
            ├─ fuel
            ├─ user / favorites
            └─ Prisma
                 └─ MySQL 8.4（Docker，宿主机 3307）

apps/admin (Vue 3 + Element Plus)
  └─ /v1/admin HTTP API
       └─ apps/api → 同一套 MySQL 业务表
```

数据库结构由 `apps/api/prisma/migrations` 版本化管理。开发环境使用独立的 `chumen_shadow` 影子库生成迁移，运行数据保存在 Docker Volume `chumen_mysql_data`；`apps/api/src/data/seed.ts` 仅作为可重复播种的数据源，不再承担运行时仓储。

## 前端约束

- 页面只负责展示和页面级交互，加载逻辑下沉到 composable/API 层。
- 一级页面使用原生 TabBar；详情和个人中心二级页无 TabBar。
- 路线图片走静态资源，接口失败自动降级到本地数据。
- 地理坐标统一按 GCJ-02 传递，导航通过 `uni.openLocation` 跨端降级。
- 微信、H5 为首批验收目标，同时保留支付宝、抖音、百度、快手、QQ 与 App 构建入口。

## 后端演进

生产化建议按以下顺序推进：

1. 引入登录与微信 code 换取会话，增加 Access/Refresh Token，并替换当前固定的本地开发用户。
2. 对写接口增加幂等键、审计日志和限流；读取热点再引入 Redis。
3. 接入对象存储/CDN、内容安全审核、日志与 OpenTelemetry。
4. 云服务器确定后补充反向代理、HTTPS、MySQL 自动备份与发布流水线。
5. 生产数据库只执行 `prisma migrate deploy`，结构变更采用 Expand-Migrate-Contract，禁止使用破坏性 reset。
