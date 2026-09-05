# 可访问性验证

## 适用平台与标准

H5 键盘/语义/文本状态；微信触控与平台可访问能力。

## 字号、对比度和触控区域

沿用现有 token 与按钮尺寸；H5 视觉 smoke 无截断阻断。自动对比度审计未运行。

## 键盘、焦点与语义

DiscoveryCard Enter 自动化通过；场景 selected 与按钮可读名称在浏览器 AX 树可见。抽屉关闭焦点恢复未自动验证。

## 动效、屏幕阅读与错误提示

loading/empty/fallback/error 均有文字；404 页面不只依赖 Toast 或颜色。屏幕阅读器人工测试未运行。

## 测试矩阵与证据

`DiscoveryCard.component.spec.ts` 与 2026-09-05 H5 browser smoke passed；微信真机和读屏 not-run。

## 偏差、Owner 与期限

微信真机、读屏、抽屉焦点恢复由 UI/UX/Product Owner 在 UAT 前完成。

## 结论

- 状态：`partial`

