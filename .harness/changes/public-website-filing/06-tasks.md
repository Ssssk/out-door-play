# 实施任务

任务格式：`TASK-XXX`，每项必须关联需求/验收，并有完成证据。

- [x] TASK-001 `[FR-WEB-001][AC-WEB-001]` 新增 `website/dist/index.html` 自包含静态入口
- [x] TASK-002 `[FR-WEB-002][AC-WEB-002]` 将备案展示收敛到页脚单个位置并保留后续备案说明
- [x] TASK-003 `[NFR-WEB-001][AC-WEB-003]` 完成响应式、键盘焦点和移动导航
- [x] TASK-004 `[AC-WEB-001][AC-WEB-002]` 执行入口、脚本、HTTP 与文本检查并记录 evidence
- [x] TASK-005 `[FR-WEB-002]` 检索并记录备案展示要求和适用边界
- [x] TASK-006 `[FR-WEB-002]` 使用用户提供的 ICP 备案号替换页脚占位
- [ ] TASK-007 `[FR-WEB-002]` 公安联网备案审核后补充平台生成的编号/图标代码并由发布负责人验收
- [x] TASK-008 `[FR-WEB-001]` 按用户授权将官网静态文件部署到现有 Web 容器并完成公网冒烟
- [x] TASK-009 `[FR-WEB-003][AC-WEB-004]` 在腾讯云 DNSPod 为 `www.chumenliuliu.cloud` 新增 A 记录并核对保存结果
- [x] TASK-010 `[FR-WEB-004][AC-WEB-005]` 将官网、管理后台和 API 统一接入 Nginx 路由，管理后台迁移到 `/admin/`
- [x] TASK-011 `[FR-WEB-004][AC-WEB-005]` 将 `website/dist` 纳入 Web 镜像和生产部署构建上下文，补齐 CI 组件检测
- [x] TASK-012 `[FR-WEB-005][AC-WEB-006]` 将小程序生产环境和体验版构建 API 地址切换为 `https://www.chumenliuliu.cloud/v1`
- [x] TASK-013 `[FR-WEB-004][AC-WEB-005]` 在远程服务器执行 Web 镜像部署并验证域名 HTTPS、首页、后台和 `/v1/health`
- [ ] TASK-014 `[FR-WEB-005][AC-WEB-006]` 在微信公众平台配置 request 合法域名并完成真机请求验证（需小程序管理员权限）

## 暂停/回退条件

公安备案编号、静态接入账号或主体资料缺失时暂停外部备案/发布；静态页面验证失败时回退到未修改的现有应用。

## Owner 与 Gate 交接

| TASK | 执行人 | 验证人 | 对应 Gate | Evidence |
|---|---|---|---|---|

