# 2026-09-22 API 运行时依赖生产事故与恢复证据

- Change：`CHG-OUTDOOR-V110-001`
- 类型：production incident / hotfix / deployment verification
- 授权人：用户（项目负责人），请求“处理下，保证运行正常”并在暂停后要求“继续部署”
- 故障提交：`b063fc27752137fd2acf231ac72e6a14e543467f`
- 修复提交：`3eda51a53a8777de49a683c8564c22a6c8ea5ad8`
- 环境：Windows 本地验证；Ubuntu 24.04 授权服务器；Docker Compose；MySQL 8.4

## 故障证据

- 公网 `https://www.chumenliuliu.cloud/v1/cities` 无法完成 TLS 握手。
- 服务器 80/443 无监听；`chumen-web-prod` 为 `Created`。
- `chumen-api-prod` 持续重启，日志为 `Cannot find module 'express'`，调用链进入 `dist/setup-application.js`。
- 数据库容器始终为 healthy，未执行数据修复。

## 修复与本地门禁

- 删除业务启动代码对 `express` 的直接运行时引用，改用 Nest HTTP adapter `useStaticAssets` 暴露本地头像目录。
- 新增单元回归测试验证目录、前缀、缓存与禁用索引配置。
- API 单元：17 文件、91 测试通过。
- API type-check、build、4 份 OpenAPI 契约共 18 个 operation 通过。
- format、Lint（0 error，19 个既有 warning）、Secret scan、Harness、组件 CI 工具测试通过。
- 本机 Docker Desktop 未运行；在服务器从修复 SHA 的只读归档构建镜像，并在切换前以隔离容器加载 `dist/setup-application.js`，退出码 0。

## 生产恢复

- 源码归档 SHA-256：`4428C355B9B2B3A9BC04DD5467CA6A021AF015D367AB53297D37EA8136E8E10D`。
- API 镜像：`chumen-api:3eda51a53a8777de49a683c8564c22a6c8ea5ad8`。
- 镜像 ID：`sha256:9e76c5d1dd352220f2b21f1cfacc65bb79e225fd6d047c73cc177cc5063e3f8e`。
- 切换前备份 `/opt/chumen/.env.production`；只更新 API 镜像引用，保留原 Web 镜像与 MySQL 数据。
- Compose 等待结果：MySQL healthy、API healthy、Web started；API restart count 0。

## 冒烟验证

- `/v1/health`：HTTP 200，业务码 0，数据库 connected。
- `/v1/cities`：HTTP 200，业务码 0，返回 9 个城市。
- `/v1/weather/current?cityCode=420100`：业务码 0。
- `/v1/routes?city=420100&scene=drive&limit=10`：业务码 0，返回 3 条。
- `/v1/fuel/stations?lat=30.5928&lng=114.3055&page=1&pageSize=10`：业务码 0，返回 7 条，首条 ID 为 `tx-` 前缀。
- `/v1/uploads/avatars/does-not-exist.png`：HTTP 404，证明请求已到达静态资源处理链而非 TLS/502 故障。

## 未执行与残余风险

- 未执行数据库 migration、数据写入或头像上传业务写冒烟。
- GitHub Actions 页面因私有仓库和当前浏览器自动化限制未能读取；本次按现有工作流等价步骤进行授权事故恢复。
- 正式监控、自动回滚、持久化上传卷、微信 request 合法域名和真机验证仍 pending。
