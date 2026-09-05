# 规范依据与维护边界

本契约依据官方文档提炼工程决策，不复制框架手册。使用时应由团队定期核对官方变更，并通过独立 Change 升级技术基线。

## 官方来源

- uni-app Vue 3 基础与跨端差异：https://uniapp.dcloud.net.cn/vue3-basics
- uni-app CLI/Vite 项目：https://uniapp.dcloud.io/quickstart-cli
- uni-app `pages.json` 与分包：https://uniapp.dcloud.io/collocation/pages
- uni-app API 拦截器：https://uniapp.dcloud.io/api/interceptor.html
- Wot Design Uni：https://wot-design-uni.cn/guide/introduction.html
- NestJS 数据库/TypeORM：https://docs.nestjs.com/techniques/database
- NestJS Validation：https://docs.nestjs.com/techniques/validation
- NestJS Caching：https://docs.nestjs.com/techniques/caching
- NestJS RabbitMQ：https://docs.nestjs.com/microservices/rabbitmq
- NestJS OpenAPI：https://docs.nestjs.com/openapi/introduction
- MySQL InnoDB/ACID：https://dev.mysql.com/doc/refman/8.0/en/mysql-acid.html
- MySQL 事务隔离：https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-isolation-levels.html
- Redis 数据类型：https://redis.io/docs/latest/develop/data-types/
- Redis Node.js 客户端：https://redis.io/docs/latest/develop/clients/nodejs/connect/
- RabbitMQ 可靠性：https://www.rabbitmq.com/docs/reliability

## 维护规则

- 不把官方示例中的开发配置直接当成生产配置，例如 TypeORM `synchronize: true` 明确禁止用于生产。
- 不在文档中宣称“恰好一次”消息投递；基线是至少一次投递、消费者幂等和可重试。
- 跨端能力以目标平台兼容矩阵与真机验证为准，不假设 H5 行为等同于小程序或 App。
- 新增依赖前记录动机、替代方案、安全和体积影响，并由锁文件固定解析结果。

## 个人经验源

2026-08-30 对 `E:\code_house\skill2\core-skills\role-developer\3.0` 的 17 个 Skill 包执行了经验吸收。完整分类、哈希和冲突处理见 `knowledge/inbox/KB-INBOX-001-role-developer经验吸收清单.md`。

这些压缩包是个人经验候选源，不是官方规范。吸收时只保留与当前 uni-app Vue 3/Wot Design Uni、NestJS/TypeORM/MySQL/Redis/RabbitMQ 基线匹配的知识原子；Vue 2/uView、PC 管理端、LLM、微服务和多租户内容未自动激活。源包自带验证只用于确认包结构与内部契约，不作为当前项目技术结论的验证证据。
