# Requirements Gate 来源记录

- Change：`CHG-MOBILE-IDENTITY-001`
- 产品 Owner：用户
- 日期：2026-08-30
- 父 Change 证据：`.harness/changes/prd-v1-1-rebuild/approvals/2026-08-30-requirements-design.md`
- 父批准原文：`按推荐基线推进，我批准 Requirements Gate 和候选架构方向。`
- 本切片实现指令：`先实现剩余主要工作第一项：普通用户登录及写接口授权。`

## 本次 Requirements Gate 覆盖

- 移动端正式认证方向为微信登录与服务端短期访问凭证。
- 保留 Prisma 7、Prisma Migration 与 MySQL，不为空引入 Redis/RabbitMQ。
- 资料和收藏写接口必须以可信服务端主体执行资源级授权。
- 首批产品端为 H5 与微信小程序；H5 本轮只提供明确受限的本地开发身份适配器。

## 未批准事项

- 本记录不代表本子 Change 的具体技术设计已批准。
- 不批准生产凭证、生产发布、生产数据写入或跳过微信真机 UAT。
