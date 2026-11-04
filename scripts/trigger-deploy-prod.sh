#!/usr/bin/env bash
# 一键触发生产部署工作流：.github/workflows/deploy-production.yml
#
# 前置（仅首次）：
#   1) 安装 gh：        brew install gh
#   2) 登录并授权：     gh auth login
#      登录时勾选 workflow 权限；若已登录但缺权限，补：gh auth refresh -s workflow
#
# 使用前提：本次改动已 git commit 并 git push 到 main（工作流 if: github.ref == 'refs/heads/main'）。
# 触发后若 production 环境设了审批保护，需到 GitHub 上 Approve 一次。
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> 当前分支: $(git branch --show-current)"
echo "==> 触发 deploy-production.yml (ref=main) ..."
gh workflow run deploy-production.yml --ref main

echo
echo "已提交触发。观察进度："
echo "  gh run watch"
echo "  （或）gh run list --workflow=deploy-production.yml"
echo "  （或）gh run view --web      # 打开网页，production 环境如需审批在此 Approve"
echo
echo "部署会自动：构建镜像 → 上传 → prisma migrate deploy（应用 20261025000000_add_station_kind 迁移）→ 重启容器 → 站点同步 → 冒烟测试。"
