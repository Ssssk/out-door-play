# 安全评审

## 信任边界与数据流

## 身份、授权和资源级访问

## 输入、输出和外部访问

## 敏感数据、Secret 和日志

## 依赖、上传、MQ 与部署权限

| 风险 ID | 等级 | 条件与影响 | 证据 | 修复 | 状态 |
|---|---|---|---|---|---|

## 残余风险与批准

# 安全验证

- Secret scan：passed；本地 `.env` 排除且未读取。
- SAST：ESLint 0 error / 16 warning；无本 Change 新增 high finding。
- 输入与公开面：city/scene/limit/id 运行时校验；Presenter 显式 public select，不返回 status、rankWeight、impressions、clicks、审计或用户数据。
- SCA：failed；25 vulnerabilities，其中 2 high 来自 uni-app 依赖链 Vite（`GHSA-c27g-q93r-2cwf`、`GHSA-fx2h-pf6j-xcff`）。
- 结论：`failed/pending-owner`；不得发布，等待兼容升级或风险处置与独立安全评审。
