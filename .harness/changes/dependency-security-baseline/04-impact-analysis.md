# 影响分析

| 区域 | 影响 | 风险 | 验证 |
|---|---|---|---|
| uni-app/Vite | 高 | Vite 修复跨当前 5.x；DCloud 插件可能不兼容 | H5/微信构建、启动、路由、样式、目标端冒烟 |
| 图片/压缩链 | 中 | jpeg-js/adm-zip override 可能改变构建行为 | 资源编译、图片展示、产物 diff |
| Prisma/API | 高 | deepmerge-ts/Prisma 和 adapter mariadb 传递依赖 | generate/typecheck/unit/build、MySQL 连接/迁移集成 |
| Admin | 低~中 | lock 去重可能影响 Vite/Vitest | type/test/build |
| CI/SBOM | 高 | 当前无真实 security Gate | 故意制造安全失败确认阻断 |
| 产品数据/API | 无直接变化 | 不应借依赖 Change 改业务 | 契约 diff 必须为空 |

结论：按依赖族分批，每批独立锁文件 diff 和回归，禁止一次性升级所有包。
