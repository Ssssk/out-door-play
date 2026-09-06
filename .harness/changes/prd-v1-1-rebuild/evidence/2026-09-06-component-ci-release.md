# 2026-09-06 组件感知 CI 证据

## 范围

- Change：`CHG-OUTDOOR-V110-001`
- 目标：按提交变更路径选择 API、管理 Web 或微信小程序 CI；多组件变更按 API → 管理 Web → 小程序串行。
- 实现：`.github/workflows/ci-component-release.yml`、`tools/ci/changed-components.mjs`、`tools/ci/changed-components.test.mjs`。

## 本地验证

- `node --test tools/ci/changed-components.test.mjs`：passed，3 tests。
- `node --check tools/ci/changed-components.mjs`：passed。
- 两个 workflow YAML 解析：passed；组件工作流包含 `detect-changes`、`backend-ci`、`admin-ci`、`mobile-ci`，小程序工作流可由 reusable workflow 调用。
- `pnpm security:secret`：passed。
- `node .harness/scripts/validate-harness.mjs`：passed，0 warnings、0 errors。
- `git diff --check`：passed（仅 Windows 换行提示）。

## GitHub Actions 真实验证

- Workflow：`Component CI release`，run `34037029052`，commit `3fa93115a007ddba8d18a108ebb2e5f95c725920`。
- `detect-changes`：passed，8s；本次编排工作流变更按全组件处理。
- `backend-ci`：passed，2m46s；API type-check、unit test、contract、build 和 Docker API 镜像构建均完成。
- `admin-ci`：passed，3m19s；在 backend-ci 完成后才开始，管理端 type-check、unit test、build 和 Docker Web 镜像构建均完成。
- `mobile-ci / build-experience`：passed，46s；在前置组件 CI 完成后开始。
- `mobile-ci / upload-experience`：passed，3m24s；微信体验版上传成功并生成二维码 Artifact `wechat-experience-qrcode-4`，Artifact ID `9990644199`，digest `sha256:121e4c22af7a978c9e9feb11ba9dd72785ed86fdc3c8fe48a31ec494d0c4a095`。
- 小程序上传步骤打印自动生成备注：`ci: initialize buildx before container checks`。
- Run 链接：[GitHub Actions run 34037029052](https://github.com/Ssssk/out-door-play/actions/runs/34037029052)。

## 失败修正记录

- run `34036748538`：启动失败，调用 reusable workflow 时缺少 `actions: read`；补充调用工作流最小权限。
- run `34036785688`：后端 Prisma 生成缺少 `DATABASE_URL`，且 Buildx 默认 driver 不支持 GHA cache；增加非生产 Prisma URL 和 `docker/setup-buildx-action`，之后 run `34037029052` 全部通过。

## 边界

- 生产服务器部署工作流 `deploy-production.yml` 仍为手动触发；本次自动工作流不执行生产写入或生产数据迁移。
- GitHub Actions 的 Node.js 20 deprecation 为平台警告，不影响本次成功；后续应按平台窗口升级 Action 版本。
