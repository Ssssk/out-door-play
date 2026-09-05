# 发布计划（未授权执行）

## 制品与版本

- CI 一次构建 API/H5/微信候选并绑定 commit/digest、测试报告和 SBOM；当前未提交工作树不是制品。

## 环境与配置变更

- 服务端 Secret：WECHAT_APP_ID/APP_SECRET、IDENTITY_SUBJECT_HMAC_KEY；生产强制 DEV_IDENTITY_ENABLED=false。
- 前端不得包含上述 Secret；API base URL/HTTPS/Ingress 尚未批准。

## 数据迁移顺序

1. 备份/恢复能力确认；执行 additive Prisma migration。
2. 校验 identity/session 表、索引和外键。
3. 部署兼容 API，入口关闭；验证公开 GET 与 admin 不回归。
4. Gate 通过后启用微信登录入口；不在生产启用 dev provider。

## API/客户端发布顺序

- 先兼容后端，再发布 mobile；旧客户端 user API 收紧为 401 是安全行为。保留 POST `/user/me` 兼容别名。

## 灰度或功能开关

- 微信登录入口/功能开关按批准小流量测试账号灰度；停止阈值包括跨账号访问、token 泄露、refresh 异常、provider 错误率和资料/收藏错误。

## 发布前检查

- UAT Gate：pending（微信 blocked）
- Operations Gate：pending
- Security/Supply-chain Gate：pending
- 制品 SHA/digest 与 SBOM：pending

## 发布后验证与观察窗口

- 验证 login/refresh/logout、匿名 401、双账号隔离、收藏/资料、provider 延迟和错误；观察窗口/阈值由 Release Owner 批准。

## 小程序审核与用户可获得性

- 分别记录提交、审核通过、灰度和真实可用；H5 dev 结果不算微信发布。

## Incident Commander 与通信渠道

- pending，由 Operations/Release Owner 指定。

## 审批与执行权限

- 当前无生产发布/Secret/数据库权限；本文件仅计划，不授权执行。
