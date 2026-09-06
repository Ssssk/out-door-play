# 2026-09-06 微信发布备注中文化证据

## 范围

- Change：`CHG-OUTDOOR-V110-001`
- 目标：微信小程序体验版上传时，发布备注统一使用中文；英文提交信息不得原样进入微信备注。
- 实现：`tools/miniprogram-ci/describe-change.mjs`、`tools/miniprogram-ci/describe-change.test.mjs`。

## 行为

- Conventional Commit 类型映射为中文，例如 `feat` → `新增功能`、`fix` → `修复问题`、`ci` → `发布流程调整`。
- 已知英文提交摘要使用中文词条；无法翻译的英文摘要仅保留中文类型，不把英文原文写入备注。
- 变更范围使用中文标签：`小程序`、`运营后台`、`后端`、`发布流程`；长度上限仍为微信允许的 128 个字符。

## 本地验证

- `node --test tools/miniprogram-ci/describe-change.test.mjs`：passed，4 tests。
- `node --check tools/miniprogram-ci/describe-change.mjs`：passed。
- `pnpm security:secret`：passed。
- `node .harness/scripts/validate-harness.mjs`：passed，0 warnings、0 errors。
- 当前提交 `6351092` 的本地输出：`发布流程调整：发布备注统一使用中文（发布流程）`。

## GitHub Actions 真实验证

- Workflow：`Component CI release`，run `34038401292`，commit `6351092dcbf6dfa9f00b758ee6284c7ebf977e75`。
- `detect-changes`：passed；`backend-ci`、`admin-ci`：skipped，证明仅修改小程序发布工具时不会运行后端和管理端 CI。
- `mobile-ci / build-experience`：passed，44s。
- `mobile-ci / upload-experience`：passed，3m50s；微信体验版上传成功并生成二维码 Artifact `wechat-experience-qrcode-5`，Artifact ID `9990966740`，digest `sha256:7809637bc13ca0588f21cc81f82b76102daa4bf1c92b1bbbac4d2a779350451f`。
- 上传日志打印的备注为：`发布流程调整：发布备注统一使用中文（发布流程）`，全为中文描述。
- Run 链接：[GitHub Actions run 34038401292](https://github.com/Ssssk/out-door-play/actions/runs/34038401292)。

## 边界

- 该备注仅用于微信体验版上传，不改变生产部署；生产工作流仍需手动触发。
- GitHub Actions 的 Node.js 20 deprecation 为平台警告，不影响本次组件流水线成功。
