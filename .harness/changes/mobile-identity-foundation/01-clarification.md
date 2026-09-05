# 需求澄清

| ID | 问题/假设 | 影响 | Owner | 状态 | 结论与日期 |
|---|---|---|---|---|---|
| Q-001 | 移动端正式认证方式 | 身份可信边界 | 用户 | closed | 父 Gate 批准微信登录 + 服务端短期凭证，2026-08-30 |
| Q-002 | H5 正式身份提供方 | H5 生产登录 | 产品 Owner | open/non-blocking-dev | PRD 未定义；本轮只提供明确标识的本地开发适配器 |
| Q-003 | 是否引入 Redis 会话 | 基础设施与一致性 | 用户/架构 Owner | closed | 当前规模使用 MySQL 会话，不引入空 Redis |
| Q-004 | 微信 AppID/AppSecret/真机 | 生产联调与目标端证据 | 用户 | open/release-blocking | 不读取或伪造凭证；实现配置边界，真机 Gate pending |

## 决策日志

| 决策 ID | 决策 | 理由 | 决策人 | 日期 |
|---|---|---|---|---|
| D-001 | access 15 分钟、refresh 30 天且每次刷新轮换 | 限制泄露窗口并支持撤销 | 用户批准方向 + 当前 Change 细化 | 2026-08-30 |
| D-002 | 会话 token 只以 SHA-256 摘要存 MySQL | 数据库泄露不直接暴露 bearer token | 架构基线 | 2026-08-30 |
| D-003 | 服务端从 Guard 注入 userId，DTO 不接受 userId | 防止水平越权 | 安全红线 | 2026-08-30 |
| D-004 | dev login 仅非生产 + 显式环境开关 | 支持 H5 本地验收且默认失败 | 架构 Owner | 2026-08-30 |

## 来源冲突与版本差异

| 来源 ID | 冲突/变化 | 影响 FR/AC | 裁决人 | 状态 |
|---|---|---|---|---|
| SRC-PRD-MINE | mine 页面允许游客，但 edit 面向注册用户 | FR-IDENTITY-001/FR-PROFILE-001 | 用户 | closed：公开页可降级游客，写操作必须登录 |
| SRC-PRD-MINE | 旧 PRD 将收藏切换描述为本地 UI | FR-FAVORITE-001 | 用户 | closed：本 Change 将其升级为服务端持久化且幂等 |

关键问题未关闭时，Change 保持 `clarifying`。

