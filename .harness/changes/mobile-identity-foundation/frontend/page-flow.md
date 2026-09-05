# 前端页面流

## 目标平台

- 微信小程序：正式身份目标，使用 `uni.login`；需要正式 AppID/AppSecret 与真机证据。
- H5：仅本地/CI 开发身份适配器与 UI/E2E；不承诺生产 H5 登录。

## 页面/路由/分包变化

- 新增主包 `/pages/login/index`，参数只允许受控 `returnTo` 页面标识，不接受任意 URL。
- mine 保持公开可进入：anonymous 显示“微信登录/登录后同步收藏”，authenticated 显示服务端资料和退出。
- mine-edit、favorites 与详情页收藏操作调用 `requireAuth`；登录成功后只回到白名单内部页面。
- 不新增分包，不改变现有 Tab；更新 `pages.json` 后分别构建 H5/微信。

## 用户流程

```text
冷启动 -> auth.initialize
  ├─ 无 refresh -> anonymous -> 浏览公开内容
  ├─ refresh 成功 -> authenticated -> 拉取 me/favorites
  └─ refresh 失败 -> anonymous + 可理解提示

受保护操作 -> anonymous -> login(returnTo)
  ├─ 微信：uni.login -> /auth/wechat/login
  ├─ H5 dev：输入 dev handle -> /auth/dev/login
  └─ 成功：保存 token pair -> 拉取 me -> 安全回跳

authenticated -> edit/favorite
  ├─ 成功：更新服务端模型/界面
  └─ 失败：保留表单/原收藏状态 + 错误提示

logout -> /auth/logout -> 无论网络结果均清本地 token；服务端成功证据决定是否标记远端已撤销
```

## 加载、空、错、权限和弱网状态

| 场景 | UI | 行为 |
|---|---|---|
| initializing | 骨架/加载，不闪匿名页 | 受保护请求等待有界初始化 |
| login pending | 按钮 loading/disabled | 不重复获取 code 或提交 |
| provider/network error | 错误说明 + 重试 | 微信重试重新调用 `uni.login` |
| expired | “登录已过期” | 清 token，进入登录，不循环刷新 |
| profile save failed | 字段/全局错误，保留输入 | 不更新 app store 成功态 |
| favorites empty | 现有空状态 | 提供返回公开发现入口 |
| favorite pending | 单项按钮禁用 | 不乐观提交；失败保持原状态 |
| permission denied | 重新登录或无权限提示 | 不展示服务端内部 message |

## Wot Design Uni 组件与主题使用

- 使用 `wd-button`、`wd-input`、`wd-loading`、`wd-toast`/现有统一反馈能力，不复制按钮/输入基础组件。
- 使用现有品牌 token；错误除颜色外同时有文本/图标；按钮和输入保持足够触控高度。

## 跨端差异和真机验证

- `uni.login` 封装在 platform identity adapter，H5 不调用微信 API。
- H5 dev 控件仅在编译环境与服务端能力均允许时出现，生产构建默认不显示。
- 微信需验证用户取消、code 失效、弱网、后台恢复、退出后重进；H5 结果不能替代。
