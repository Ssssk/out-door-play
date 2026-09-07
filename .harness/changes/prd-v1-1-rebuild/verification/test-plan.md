# 测试计划

| 测试 ID | 关联需求/验收 | 层级 | 环境 | 前置数据 | 预期 | 自动化 |
|---|---|---|---|---|---|---|
| BASE-001 | AC-QUALITY-001 | typecheck | 本地 Node/pnpm | 当前工作树 | mobile/admin/api 全部通过 | 是，已复验 |
| BASE-002 | AC-QUALITY-001 | unit | 本地 Vitest | 当前工作树 | mobile 2 + admin 2 + api 2，共 6 个通过 | 是，已复验 |
| BASE-003 | NFR-COMPAT-001 | build H5 | 本地 uni-app | 当前工作树 | 构建通过，保留 Sass 警告 | 是，已执行 |
| BASE-004 | NFR-COMPAT-001 | build 微信 | 本地 uni-app | 当前工作树 | 构建通过，尚不代表真机 UAT | 是，已执行 |
| HARNESS-001 | AC-PROGRAM-001 | contract | Node | Harness 文件 | validate-harness 0 error | 是 |
| SRC-001 | AC-SOURCE-001/002 | source | 文件系统 | PRD v1.1.0 | 哈希匹配且冲突保持 pending | 是 + 人工 |
| SEC-001 | AC-SEC-001 | security | Git 工作树 | ignore 规则 | 私钥/env 不被跟踪且不输出值 | 是 |
| SEC-002 | AC-SEC-001 | SCA | 官方 npm Registry | pnpm lock | 当前 11 high，预期非零并阻塞 | 是，failed baseline |
| CI-PLUGIN-001 | AC-CI-PLUGIN-001 | 单元 + 本地集成 | Windows Node.js + 临时 bare Git 远程 | `auto-work-tools` v1.12.0 | 普通 push 不调用微信；小程序模式先上传成功再带标记非强制 push；远程领先/代码变化失败阻断 | 是，25/25 passed；真实项目 UI 待人工验收 |

## 单元与组件

当前共 6 个测试；Admin 已有 2 个响应协议测试，但页面、权限、领域和集成覆盖仍明显不足。

## MySQL/Redis/RabbitMQ 集成

当前 not-run。MySQL 容器测试、Redis/MQ 仅在架构批准后配置。

## API/事件契约

当前 OpenAPI 由运行时 Swagger 产生，尚无冻结差异证据；事件契约 not-required until approved async use case。

## uni-app E2E 与目标端

构建已执行，真机/E2E not-run。

## UI/UX 与可访问性

原型与代码差距检查 pending；键盘、焦点、对比度和小程序端证据 pending。

## 性能、容量和耐久

pending，等待业务切片量化。

## 安全与软件供应链

Git ignore 初查已执行；完整 Secret/SAST/SCA/SBOM pending。

## 产品 UAT

not-run；PRD 范围未裁决。

## 迁移、备份恢复和故障演练

not-run；ORM/生产拓扑未决定。

## 影响面和核心回归

首批至少覆盖：首页/钓鱼/加油/我的、详情、Admin 读写、API 错误、数据库迁移和权限拒绝。

## 不稳定测试治理

## 退出标准

- 当前 SHA/制品：
- 当前 SHA/制品：HEAD `a2a56a7...` + uncommitted worktree；不能作为发布制品。
- 必需 Evidence 类型：命令、退出码、SHA、环境、报告、目标端信息、UAT 签名。
- 允许 not-required 的批准人：对应产品/架构/安全/运维 Owner，不由实现者自批。

