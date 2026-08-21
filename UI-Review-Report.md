# 出门溜车首页 · UI Review 报告

> 基于 Ardot 设计稿 `cocraft://localhost/file/715520033581902?node_id=3%3A48` 对小程序首页实现进行 review。

---

## 1. Ardot 设计稿整体印象

设计稿整体完成度较高：

- 品牌感强：青柠绿径向渐变背景 + 深色卡片 + 黄绿色（#CCFF00）强调色，形成鲜明的户外/运动氛围。
- 信息层级清晰：头部品牌 / 城市 / Tab / 卡片列表 / 底部 TabBar 分区明确。
- 卡片视觉重心好：大图 + 底部暗色渐变 + 白色文字，关键信息（标题、里程、落差、难度）一目了然。
- 设计语言统一：胶囊、圆角、半透明毛玻璃感标签贯穿整个页面。

---

## 2. 设计稿层面可优化的问题

当前文件处于**只读模式**，以下问题无法直接修改，建议在 Ardot 源文件中处理：

| 优先级 | 问题 | 影响 | 建议 |
|--------|------|------|------|
| P1 | 标题下划线 `Title Underline` 是游离在 `Content` 中的独立 Frame，未归并到标题组 | 标题位置变动时，下划线不会跟随 | 将下划线移入 `Header Left` 或新建 `Title Group`（vertical），与 `Page Title` 绑定 |
| P1 | 3 张 `Map Thumb` 处于 `visible=false` 且 `outside parent` | 增加文件体积，产生 layout warning | 直接删除这 3 个隐藏节点 |
| P2 | `Stats Row 2` 中 `33.0KM` 的数值容器宽度 64px，数值实际宽度 66px，`clipsContent=true` | 第二长路线里程数字可能被截断 | 将 `Stat 2a` 与 `Stats Row 2` 改为 `hug_contents`，或容器加宽到 72px |
| P2 | `Content` 与 `Tab Bar` 存在区域重叠 | layout warning，层级不够规范 | 把 Tab Bar 作为固定层处理即可，视觉间距合理，无需大改 |
| P3 | Active tab 仅通过背景胶囊区分，图标和文字颜色未变化 | 在强光/小屏下识别度稍弱 | 可考虑 active 态将图标/文字改为 #CCFF00 黄绿色，与设计稿强调色呼应 |
| P3 | 页面字体使用 Space Grotesk / Inter | 中文会 fallback 到系统字体 | 在代码层已做 `PingFang SC` fallback，设计稿可标注中文字体回退 |

---

## 3. 小程序实现 Review & 已修正项

原 `pages/index/index` 已做了第一版还原，但与设计稿存在明显偏差。本次已按设计稿精确修正：

### 3.1 已修正的视觉还原点

| 元素 | 修正前 | 修正后（按设计稿） |
|------|--------|-------------------|
| 品牌标题 | 带斜体、深色下划线 | 移除斜体；下划线改为 #CCFF00 黄绿色 |
| 城市胶囊 | 纯白背景、无描边、emoji 图标 | 半透明白 `rgba(255,255,255,0.72)` + `#E5DDCB` 描边 + SVG location 图标 |
| Tab active | 深色背景 + 白字 | 半透明渐变胶囊 + 深色字 |
| Tab inactive | 灰色字 | 与 design 一致的 `#6E6862` |
| 卡片高度 | 420rpx（偏高） | 504rpx（252px 精确 2x 换算） |
| 卡片圆角 | 28rpx | 32rpx（16px 精确 2x） |
| 卡片暗角渐变 | 简单两段渐变 | 设计稿四段渐变：35%→15%→65%→85% |
| Top 标签 | 背景过深 `rgba(0,0,0,0.78)` | `rgba(0,0,0,0.48)` |
| 距离标签 | 无背景，仅靠 text-shadow | 添加 `rgba(0,0,0,0.32)` 半透明背景胶囊 |
| 底部 Stats | flex 不等宽 | 三列等宽 128rpx，与设计稿 64px 对应 |
| 底部 TabBar | 纯白实底、active 仅文字加粗 | 半透明 `rgba(255,255,255,0.82)` + active 渐变胶囊 |
| 资源路径 | 指向不存在的旧目录 | 更新为 `images/liuche/` 下新导出的 PNG/SVG |

### 3.2 资源导出清单

已将设计稿中的图片与图标导出并复制到小程序目录：

```
miniprogram/images/liuche/
├── card1.png       # 八分山
├── card2.png       # 三山连穿
├── card3.png       # 青龙山
├── location.svg    # 城市定位
├── lightning.svg   # Top 标签闪电
├── pin.svg         # 距离标签
├── tab-car.svg     # 出车
├── tab-gas.svg     # 加油
└── tab-me.svg      # 我的
```

### 3.3 修改文件

- `miniprogram/pages/index/index.wxml`
- `miniprogram/pages/index/index.wxss`
- `miniprogram/pages/index/index.js`

---

## 4. 当前实现 vs 设计稿的差异（可接受/建议继续优化）

| 差异 | 原因 | 建议 |
|------|------|------|
| 页面背景色 `#E1F7A8` 略深于设计稿 `#E2F8A8` | 全局 `app.wxss` 已定义该背景 | 视觉上几乎无差别，可保持 |
| 字体未使用 Space Grotesk | 小程序无法直接加载外部字体 | 使用系统 `PingFang SC` fallback，符合中文场景 |
| 状态栏为系统原生 | 小程序自定义导航栏需留出系统状态栏高度 | 已通过 `initNavbar` 动态计算 |
| TabBar 在页面内固定 | 设计稿为页面级 TabBar；如作为全局 Tab 页面，建议迁移到 `custom-tab-bar` | 当前页面级实现还原度高，可先保留 |

---

## 5. 预览

已生成静态 HTML 预览（按 iPhone 375px 宽度）：

http://localhost:8765/index.html

> 该预览仅供视觉还原度参考，实际交互需在微信开发者工具中查看。

---

## 6. 结论

本次 review 后，小程序首页在**颜色、间距、卡片渐变、Tab 样式、图标资源**等关键维度上已与 Ardot 设计稿高度对齐。建议下一步：

1. 在 Ardot 源文件中处理 P1/P2 的结构问题（下划线归组、删除隐藏 Map Thumb、修正 Stats 宽度）。
2. 在微信开发者工具中真机预览，确认状态栏高度、安全区、滚动体验。
3. 如需要全局 TabBar，将当前页面内 TabBar 迁移为 `custom-tab-bar` 组件。
