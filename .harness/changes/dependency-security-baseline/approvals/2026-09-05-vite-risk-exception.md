# Vite 5.2.8 残余高危限时例外批准

- Change：`CHG-SEC-DEPS-001`
- 批准人：用户（安全 Owner）
- 批准时间：`2026-09-05T13:52:09Z`
- 到期时间：`2026-09-15T23:59:59+08:00`
- 决策：批准以下两个、且仅限以下两个 Vite 5.2.8 风险的限时例外：
  - `GHSA-c27g-q93r-2cwf`：Windows `launch-editor` 命令注入。
  - `GHSA-fx2h-pf6j-xcff`：Windows alternate paths 绕过 `server.fs.deny`。

## 适用范围

- 仅适用于当前 DCloud/uni-app 精确 peer 绑定的 Vite 5.2.8 开发与构建链。
- 不覆盖新增 advisory、运行时 API/数据库漏洞、Secret 泄漏或其他 P0/P1。
- 生产容器不运行 Vite dev server；移动端开发服务器继续只绑定 `127.0.0.1`，禁止暴露到不可信网络。

## 到期与撤销

- DCloud 发布兼容修复版本或例外到期时，以先发生者为准，恢复阻塞并重新执行完整兼容回归。
- 补偿控制失效、漏洞可达性变化或出现真实利用证据时立即撤销例外。
- 本批准不等同于 Implementation、Verification、完整 Security、UAT、Operations 或 Release Gate 通过，也不授权自动生产部署。

