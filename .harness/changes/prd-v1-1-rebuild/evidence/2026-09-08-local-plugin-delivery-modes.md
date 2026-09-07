# 2026-09-08 本地插件双交付流程证据

- Change：`CHG-OUTDOOR-V110-001`
- 需求/验收/任务：`FR-CI-002` / `AC-CI-PLUGIN-001` / `TASK-014`
- 插件目录：`E:/code_house/skill2/auto-work-tools`
- 插件版本：`1.12.0`
- 项目配置：`E:/code_house/skill2/out-door-play/.mini-publisher.json`

## 实现摘要

- 页面提供“仅推送代码”和“推送并发布体验版”两个主入口。
- Git remote、`[skip-miniprogram-experience]` 和小程序路径规则可在页面配置，也可由仓库 `.mini-publisher.json` 共享。
- 执行顺序为：fetch/快进检查 → 计算完整待推送范围 → 提交 → push dry-run 预检 → 条件式小程序构建与上传 → 校验 HEAD/工作区未变化 → 非强制 push。
- 普通模式不调用微信工具；组合模式未命中小程序路径时不添加标记并退化为普通 push。

## 自动验证

- 命令：`npm test`
- 环境：Windows，本地 Node.js；测试使用临时目录和临时 bare Git 远程，不连接或修改真实业务远程仓库。
- 结果：25/25 passed，退出码 0。
- 关键用例：
  - 普通交付实际执行 `git add --all`、commit、fetch 快进检查和非强制 push，远程提交说明正确。
  - 小程序交付使用测试微信 CLI 返回明确上传成功标志，随后才 push；远程 HEAD 提交说明仅包含一次 `[skip-miniprogram-experience]`。
  - 小程序路径匹配、路径规则校验、去重标记幂等和已有发布功能回归通过。

## 静态验证

- `node --check agent/server.js`：passed。
- `node --check extension/popup.js`：passed。
- 插件 HTML 可加载，两个交付入口、提交说明、项目配置和安全提示可被浏览器可访问性树识别。

## 未执行边界

- 未对 `out-door-play` 执行真实 commit 或 push。
- 未上传真实微信开发版，未触发 GitHub Actions，未提交微信审核或发布正式线上版本。
- 插件实际交互和视觉效果待用户在 Chrome/Edge 重新加载扩展后验收。
