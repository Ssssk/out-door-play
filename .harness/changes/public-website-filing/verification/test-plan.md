# 测试计划

| 测试 ID | 关联需求/验收 | 层级 | 环境 | 前置数据 | 预期 | 自动化 |
|---|---|---|---|---|---|---|
| T-WEB-001 | FR-WEB-001 / AC-WEB-001 | 静态文件 | Windows 工作区 | `website/dist/index.html` | 入口存在、无外部脚本依赖 | 是 |
| T-WEB-002 | FR-WEB-002 / AC-WEB-002 | 内容检查 | Windows 工作区 | 用户提供 ICP 号 | 页脚显示 `鄂ICP备2023015599号-4`，只有一个备案位置且链接指向工信部 | 是 |
| T-WEB-003 | NFR-WEB-001 / AC-WEB-003 | 浏览器/语法 | 本地静态服务器 | 桌面与窄屏视口 | 页面 200、脚本无语法错误、无横向滚动 | 部分 |
| T-WEB-004 | FR-WEB-003 / AC-WEB-004 | 外部 DNS 配置 | 腾讯云 DNSPod 控制台 | `chumenliuliu.cloud` 已有 `@ A 124.223.220.242` | `www A 124.223.220.242` 保存成功，原 `@` 记录不变 | 部分 |
| T-WEB-005 | FR-WEB-004 / AC-WEB-005 | 配置/构建 | Windows 工作区 | Nginx、Dockerfile、admin Vite 配置 | 官网根路径、`/admin/`、`/v1/` 路由配置一致，网站资源进入 Web 镜像上下文 | 是 |
| T-WEB-006 | FR-WEB-005 / AC-WEB-006 | 环境/构建 | Windows 工作区与 GitHub workflow | 生产 API 域名 | `.env.production` 与体验版 workflow 使用同一 HTTPS `/v1` 地址，开发环境不变 | 是 |
| T-WEB-007 | FR-WEB-004 / AC-WEB-005 | 远程 HTTPS 冒烟 | 授权服务器 124.223.220.242 | Web 容器、证书、API 健康端点 | HTTP 301、HTTPS 首页/后台/API 200，证书 SAN 和续期 dry-run 通过 | 部分 |

## UI/UX 与可访问性

人工检查跳过链接、导航按钮、焦点样式、对比度和 320px 以上窄屏布局。远程 HTTPS 冒烟已通过；备案平台联调和微信真机请求仍为 not-run，原因是未在微信公众平台完成 request 合法域名配置。

## 安全与软件供应链

执行现有 Secret scan；静态入口不新增包依赖。全仓安全命令不因本 Change 重跑并冒充网站专属证据。

## 退出标准

- 当前 SHA/制品：工作区未提交 SHA，网站制品为 `website/dist/index.html`
- 必需 Evidence 类型：入口、脚本、HTTP、文本与人工可访问性检查
- 允许 not-required 的批准人：用户（项目负责人）确认真实备案与生产发布另行进行
