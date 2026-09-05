# 实施任务

- [x] DEP-TASK-001 `[FR-SCA-001][AC-SCA-001]` 冻结 lock/package hash并生成机器扫描报告
- [x] DEP-TASK-002 `[FR-REMEDIATE-001][AC-REMEDIATE-001]` 批次 A 最小修复与回归
- [x] DEP-TASK-003 `[FR-REMEDIATE-001][AC-COMPAT-001]` 批次 B uni 构建兼容验证
- [x] DEP-TASK-004 `[FR-REMEDIATE-001]` 裁决 DCloud/Vite 和 Prisma/deepmerge 路径
- [x] DEP-TASK-005 `[FR-SBOM-001][AC-SBOM-001]` 生成 SBOM、许可证清单和制品关联
- [x] DEP-TASK-006 `[NFR-SUPPLY-001]` 配置 fail-closed security CI 命令和失败注入（两个指定 Vite GHSA 已按用户限时批准自动校验；新增 high、critical 或到期均失败）
- [ ] DEP-TASK-007 完成独立安全复核与 Gate
- [x] DEP-TASK-008 `[FR-REMEDIATE-001]` 处置 2026-09-05 新增 mysql2 advisory：锁定 3.22.0 并完成 Prisma/API 回归

依赖：Requirements/Design/Security Owner 批准 → 分批修改 → 每批回归 → SCA/SBOM → 独立复核。
