# 需求追踪矩阵

| 需求 ID | 验收 ID | 设计位置 | 任务 ID | 测试 ID | 证据 | 状态 |
|---|---|---|---|---|---|---|
| FR-WEB-001 | AC-WEB-001 | `05-design.md` 静态架构 | TASK-001 | T-WEB-001、T-WEB-003 | `website/dist/index.html` | implemented |
| FR-WEB-002 | AC-WEB-002 | `05-design.md` 安全与备案展示 | TASK-002、TASK-006、TASK-007 | T-WEB-002 | `website/dist/index.html`、官方链接 | implemented-ICP-pending-public-security |
| NFR-WEB-001 | AC-WEB-003 | `05-design.md` UI/UX | TASK-003 | T-WEB-003 | 内联 CSS/JS | implemented |
| FR-WEB-003 | AC-WEB-004 | `05-design.md` 发布与域名 | TASK-009 | T-WEB-004 | DNSPod 添加成功记录 | implemented-dns-pending-propagation |
| FR-WEB-004 | AC-WEB-005 | `05-design.md` 目标架构与发布 | TASK-010、TASK-011、TASK-013 | T-WEB-005、T-WEB-007 | 配置/构建证据与 `evidence/006-remote-web-deployment.evidence.json` | implemented-remote-verified |
| FR-WEB-005 | AC-WEB-006 | `05-design.md` 目标架构与移动端 | TASK-012、TASK-014 | T-WEB-006 | 环境/workflow 配置；微信真机待执行 | implemented-config-pending-platform |
