# 澄清与决策

| ID | 问题 | 建议 | Owner | 状态 |
|---|---|---|---|---|
| DEP-Q-001 | 是否允许对传递依赖使用 pnpm override？ | 仅在上游无可用兼容版本、版本最小且完整回归时使用 | 用户 | closed：批准 |
| DEP-Q-002 | mobile Vite 是否升级到 6.4.3+？ | 当前 DCloud 发行版固定 Vite 5.2.8；不孤立跨主版本 | 用户 | closed：不强升 |
| DEP-Q-003 | Prisma 是否为修复 deepmerge-ts 升级 8 RC？ | 不采用 RC；验证受控 override | 用户 | closed：批准 override 验证 |
| DEP-Q-004 | build-only 高危是否允许临时例外？ | 仅不可达分析、隔离 CI、期限和独立批准齐全时可 | 用户 | closed：规则批准，尚无具体例外 |

2026-08-30 Requirements/Design Gate 已通过；具体 Security Gate 仍需修复后证据。
