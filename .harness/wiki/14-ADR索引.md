# ADR 索引

| ADR | 状态 | 决策 | 影响范围 |
|---|---|---|---|
| ADR-001 | accepted | 后端采用模块化单体作为默认形态 | 后端全部模块 |
| ADR-002 | superseded | 母体模板曾默认 TypeORM；项目未采用 | 数据层 |
| ADR-003 | superseded | 母体模板曾默认 Outbox + RabbitMQ；项目改为用例驱动 | 异步流程 |
| ADR-004 | superseded | 母体模板曾默认 Redis；项目当前未接入 | 缓存与一致性 |
| ADR-005 | accepted | 前端采用 uni-app Vue3 + TS + Pinia + Wot Design Uni | 客户端 |
| ADR-006 | accepted | 保留 Prisma 7；Redis/RabbitMQ 仅由批准用例引入 | 数据与基础设施 |

新增重大技术决策应创建独立 ADR，包含背景、决策、备选方案、后果、迁移和复审条件，并在此索引。
