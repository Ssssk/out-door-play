# 测试计划

| ID | 关联 | 验证 | 状态 |
|---|---|---|---|
| DEP-TEST-001 | AC-SCA-001 | 官方 Registry audit + pnpm why | baseline failed |
| DEP-TEST-002 | AC-REMEDIATE-001 | 修复后相同 SCA 命令无 high | pending |
| DEP-TEST-003 | AC-COMPAT-001 | pnpm type-check + test + build | baseline passed，升级后待复验 |
| DEP-TEST-004 | AC-COMPAT-001 | H5/微信启动与核心路由冒烟 | pending |
| DEP-TEST-005 | AC-SBOM-001 | SBOM schema、lock/SHA 映射和 Secret 检查 | pending |

失败退出码不得吞掉；不使用生产 Secret、数据库或真实用户数据。
