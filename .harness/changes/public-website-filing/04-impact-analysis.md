# 影响分析

| 区域 | 是否影响 | 当前事实 | 拟议变化 | 风险 | 验证 |
|---|---|---|---|---|---|
| `website/dist` | 是 | 不存在独立官网入口 | 新增个人生活感悟记录纯静态一页式官网 | 低 | HTTP 200 与浏览器检查 |
| `apps/mobile` | 是 | 生产环境仍为示例 API 地址，体验版工作流读取可变变量 | 生产环境与体验版统一使用 `https://www.chumenliuliu.cloud/v1`，开发环境保持不变 | HTTPS/微信 request 合法域名未配置时真机请求失败 | 环境与工作流扫描、构建 |
| `apps/admin` | 是 | 管理端默认部署在站点根路径 | 改为构建到 `/admin/`，避免占用官网首页 | 深链刷新依赖 Nginx fallback | type-check、test、build、Nginx 配置检查 |
| `apps/api`/数据库 | 否 | 已有 NestJS/Prisma | 不修改业务 API、数据库或迁移 | 无 | Git diff |
| 域名/DNS/备案平台 | 是 | DNSPod 已保存 `www A 124.223.220.242`；公安备案未完成 | Nginx 使用目标域名；TLS 已由远程容器接入，微信 request 合法域名和公安备案仍由外部平台完成 | 外部依赖 | DNSPod 证据；远程域名冒烟 |
| 权限/隐私 | 是 | 官网不含 Secret、表单或用户数据 | 保持静态入口无写操作；生产 API 地址为公开域名 | 低 | Secret scan |
| 监控/部署 | 是 | Web 容器 Nginx 监听容器 80，远程发布依赖 SSH | 将官网、后台、API 和 HTTPS 路由写入镜像/挂载配置；Certbot 负责证书续期 | 续期或容器重建失败会影响 HTTPS | Docker/CI 文本检查、Certbot dry-run 与部署后冒烟 |
| CI、依赖、SBOM、供应链 | 是 | Web 镜像构建上下文未包含官网目录，组件检测未识别官网变更 | 纳入 `website` 构建上下文和 admin/web CI 触发条件，不新增运行时依赖 | 构建上下文遗漏会导致镜像缺首页 | Docker build/路径检测/Secret scan |
| UI/UX、文案、可访问性 | 是 | 官网已有响应式与备案页脚 | 保持官网内容和单一 ICP 展示；后台路径变化不影响官网 UI | 低 | 浏览器与静态检查 |
| 产品 UAT、目标端可获得性 | 是 | 本地预览与远程 HTTPS 可用，小程序平台配置未完成 | 继续验收首页、后台、API；小程序真机请求待平台配置后验证 | 目标端外部配置缺失 | 本地与远程证据；真机待执行 |
| SLO、容量、告警、Runbook | 否 | 本 Change 不引入运行时服务 | 沿用现有部署运维基线 | 无 | not-required |
| 备份恢复、灾备、Incident | 否 | 本 Change 不改数据库和持久数据 | 沿用现有部署回滚方案 | 无 | not-required |
