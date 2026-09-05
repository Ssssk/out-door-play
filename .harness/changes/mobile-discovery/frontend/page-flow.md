# 前端页面流

## 目标平台

H5 与微信小程序；H5 已构建并完成浏览器 smoke，微信仅构建通过，真机 pending。

## 页面/路由/分包变化

不新增路由或分包；修改首页、路线详情、钓点详情及共享 BrandHeader/DiscoveryCard/DetailHero。

## 用户流程

首页初始化读取 enabled cities -> 校验持久化城市 -> 拉取当前 scene -> 城市抽屉或场景 Tab 触发新查询 -> 卡片进入 scene 对应详情 -> 系统地图/收藏/分享。

## 加载、空、错、权限和弱网状态

首页区分 loading/content/empty/fallback/error；城市服务与列表服务分别降级并带明确文字及重试。详情只对同 ID 使用本地 fallback；不存在 ID 不替换成其他资源。收藏权限沿用 identity Change。

## Wot Design Uni 组件与主题使用

沿用 AppShell、Wot popup/loading/icon 和 `--chumen-*` token；不新增基础 UI 依赖。

## 跨端差异和真机验证

H5 卡片提供 `tabindex` 与 Enter/Space；地图调用 `uni.openLocation`，不绑定品牌 SDK。微信分享、系统地图、返回/滚动和抽屉焦点需真机 UAT。

