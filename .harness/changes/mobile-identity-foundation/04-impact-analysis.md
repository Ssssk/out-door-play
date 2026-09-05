# 影响分析

| 区域 | 是否影响 | 当前事实 | 拟议变化 | 风险 | 验证 |
|---|---|---|---|---|---|
| uni-app 页面/分包 | 是 | mine/edit/favorites/detail 已存在，无登录页 | 新增登录页；受保护入口进入登录；不改变分包 | 导航回跳、平台登录能力差异 | pages.json、H5 E2E、微信构建/真机 |
| Vue 组件/Pinia | 是 | app store 持久化伪资料/收藏 | 新增 auth store 与会话状态；资料/收藏以服务端为准 | 冷启动与并发 401、跨账号残留 | store/request 单元、账号切换回归 |
| HTTP API | 是 | `/user/me` 与 favorites 无认证，收藏无写端点 | 新增 auth login/refresh/logout、收藏写；资料改为 Bearer 保护 | 旧客户端由 200 变 401；token 泄露 | OpenAPI/错误码/契约/E2E |
| NestJS 模块 | 是 | UserService 固定 `local-dev-user` | 新增 identity 模块/Guard；user 用例接收可信 principal | 水平越权、异常映射、外部超时 | Guard、provider、用例、E2E |
| MySQL/迁移 | 是 | users/favorites 已有，无身份/移动会话表 | 新增 user_identities、mobile_sessions 与索引 | token 轮换并发、DDL metadata lock | Prisma validate/generate/migrate、MySQL 并发集成 |
| Redis | 否 | 未采用 | 继续不采用；MySQL 为会话真相 | 每请求查库容量待生产基线 | 架构 Gate 明确 not-required 候选 |
| RabbitMQ | 否 | 未采用 | 无异步事件 | 无 | 架构 Gate 明确 not-required 候选 |
| 权限/隐私 | 是 | 客户端本地态且服务端无主体 | Bearer Guard、资源范围、token 哈希、微信身份 HMAC | token/OpenID/session_key 泄露、禁用绕过 | 双账号越权、安全扫描、日志检查 |
| 监控/部署 | 是（设计） | requestId，未有生产观测 | 登录/刷新/401/429/provider 延迟低基数指标；配置启动校验 | 无正式 Dashboard/Ingress | 本地日志/指标设计，Operations 保持 pending |
| 旧客户端/消费者 | 是 | 旧移动端匿名调用 user API | 公开发现仍兼容；受保护 user API 返回 401；POST `/user/me` 暂留兼容别名 | 旧版本资料/收藏不可用 | 兼容契约、旧请求回归 |
| UI/UX、文案、可访问性 | 是 | 请求失败静默回退并显示成功 | 登录/加载/错误/弱网/过期/提交态；失败不假成功 | 小屏键盘、触控、错误关联 | UI 状态矩阵、可访问性检查 |
| 产品 UAT、目标端可获得性 | 是 | H5/微信仅构建基线 | H5 dev E2E；微信正式 code2Session 真机 | 正式凭证缺失 | H5 evidence；微信保持 pending |
| CI、依赖、SBOM、供应链 | 是 | 质量基线 active；现有 SCA 仍有 2 high | 复用 active Gate，新增身份测试/契约/迁移 | 高危依赖阻塞 Security Gate | quality、Secret/SAST/SCA/SBOM |
| SLO、容量、告警、Runbook | 设计输入 | 无生产 SLO/容量 | 记录会话查询与 provider 指标；不自批 Operations | 生产规模未知 | 性能/operations 文档保持 pending |
| 备份恢复、灾备、Incident | 设计输入 | 仅本地 MySQL | 新表随 MySQL 备份；会话可全量撤销；发布前需恢复能力 | 无生产备份演练 | release/rollback 计划，Operations pending |

