# 验收标准

## AC-WEB-001 静态入口可部署

- **关联需求**：FR-WEB-001、NFR-WEB-001
- **GIVEN** 静态服务器以 `website/dist` 为根目录
- **WHEN** 访问 `/index.html`
- **THEN** 返回可渲染 HTML，页面不依赖构建产物或外部脚本
- **验证方式**：文件检查 + 本地静态服务器 HTTP 检查

## AC-WEB-002 页脚 ICP 备案号可核对

- **关联需求**：FR-WEB-002
- **GIVEN** 用户已提供 ICP 备案号 `鄂ICP备2023015599号-4`
- **WHEN** 访客打开首页底部
- **THEN** 只看到一个可点击的 `鄂ICP备2023015599号-4`
- **AND** 链接指向工信部备案查询系统
- **AND** 主导航、首屏和内容卡片不出现备案导航
- **验证方式**：人工浏览 + 文本扫描

## AC-WEB-003 响应式与键盘可用

- **关联需求**：NFR-WEB-001
- **GIVEN** 桌面、移动和键盘访问
- **WHEN** 浏览首屏、产品区、备案区并打开移动导航
- **THEN** 无横向滚动，导航可用，焦点可见且文本保持可读
- **验证方式**：浏览器人工检查 + 静态代码检查

## AC-WEB-004 官网 `www` 解析已保存

- **关联需求**：FR-WEB-003
- **GIVEN** DNSPod 中 `chumenliuliu.cloud` 已存在 `@ A 124.223.220.242`
- **WHEN** 保存主机记录 `www`、类型 `A`、记录值 `124.223.220.242`、TTL `600`
- **THEN** DNSPod 显示“添加成功”并列出 `www A 124.223.220.242`
- **AND** 原有 `@ A 124.223.220.242` 仍保持不变
- **验证方式**：DNSPod 控制台结果 + 只读 DNS 查询（考虑递归缓存）

## AC-WEB-005 生产镜像路由统一

- **关联需求**：FR-WEB-004
- **GIVEN** Web 镜像按当前 Dockerfile 构建并运行 Nginx
- **WHEN** 访问 `/`、`/admin/`、`/admin` 和 `/v1/health`
- **THEN** `/` 返回个人生活感悟记录官网，`/admin` 重定向到 `/admin/`，`/admin/` 返回管理后台入口，`/v1/health` 继续转发 API
- **AND** Nginx `server_name` 包含 `www.chumenliuliu.cloud` 与 `chumenliuliu.cloud`
- **验证方式**：配置静态检查、管理端构建、Dockerfile 上下文检查；远程 HTTP/HTTPS 冒烟待部署后执行

## AC-WEB-006 小程序生产请求地址

- **关联需求**：FR-WEB-005
- **GIVEN** 执行生产环境或体验版小程序构建
- **WHEN** 读取 API 基地址
- **THEN** 使用 `https://www.chumenliuliu.cloud/v1`
- **AND** 开发环境地址保持本地/测试用途，不被生产值覆盖
- **验证方式**：环境文件与工作流文本检查、构建产物扫描；微信真机请求待 HTTPS 和 request 合法域名配置后执行
