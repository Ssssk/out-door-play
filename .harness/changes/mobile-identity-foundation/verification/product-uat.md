# 产品 UAT 验收

## 验收版本与环境

- 版本/commit：pending；必须使用冻结候选。
- H5：本地 dev provider + 隔离 MySQL。
- 微信：正式 AppID/AppSecret、隐私配置、受控测试用户与真机；当前环境未提供。
- 2026-09-05 开发验证：H5 API 不可达错误态，以及 dev 登录、冷启动 refresh、资料更新并恢复、服务端收藏和退出闭环均通过；执行者为实现者，因此不代替产品 Owner UAT。

## 原始需求与 FR/AC 覆盖

| UAT ID | FR/AC | 业务场景 | 执行人 | 结果 | 证据 |
|---|---|---|---|---|---|
| UAT-H5-001 | IDENTITY/PROFILE/FAVORITE/TARGET | dev 登录、改昵称、收藏、退出 | 产品 Owner | not-run | pending |
| UAT-H5-002 | CLIENT-SESSION | 过期/弱网/失败不假成功 | 产品 Owner | not-run | pending |
| UAT-WX-001 | IDENTITY-LOGIN/TARGET | 微信 code 登录/恢复/退出 | 产品 Owner | blocked | 缺正式凭证/真机 |
| UAT-WX-002 | PROFILE/FAVORITE/TARGET | 微信资料与收藏闭环 | 产品 Owner | blocked | 缺正式凭证/真机 |

## 运营配置、文案和数据口径

- 审核登录用途、隐私说明、dev 标识、错误文案、昵称限制、收藏 online 口径。

## 小程序/App审核与用户可获得性

- 本 Change 仅微信小程序，不包含 App；构建/提交审核/审核通过/真实可用必须分开记录。

## 偏差和风险接受

- H5 dev 通过不能接受为微信通过；正式 H5 OAuth 不在范围。

## 产品负责人结论

- 结论：`pending`
- 验收人：pending
- 时间：pending
