# 正式环境部署授权记录（2026-11-08）

- Change ID：`CHG-SCENE-EXPANSION-001`
- 授权人：用户（项目 Owner；`status.yaml` 中的产品 / 架构 / UX Owner 与发布负责人口径）
- 指令原文：「好的，按照你的节奏继续，你只需要保证最后帮我更新到正式环境的域名就行。https://www.chumenliuliu.cloud/admin/routes」
- 目标端：`https://www.chumenliuliu.cloud/admin/routes`（生产 `web` 容器 `/admin/`，同域 API `/v1/`）
- 环境：`production`（GitHub Actions `environment: production`，`compose.prod.yaml`）
- 发布通道：`.github/workflows/deploy-production.yml`，`main` 分支 `workflow_dispatch` 手动触发；普通 push 不部署

## 授权动作范围

| 动作 | 说明 |
|---|---|
| 提交并推送 `main` | 本 Change 与并入的 `CHG-HOME-CATEGORY-001` 代码一次发布 |
| 触发生产部署流水线 | 构建 API / 后台镜像、上传 compose 与 nginx 配置、启动容器 |
| 发布前数据库备份 | 流水线新增 `Backup production database before schema expansion`，在宿主机 `backups/pre-scene-expansion-<SHA>.sql.gz` 生成物理备份并校验非空 |
| Expand Migration | `prisma migrate deploy` 应用 `20261108000000_scene_expansion_expand`：只扩 enum、加可空列与索引，不改存量数据 |
| 幂等数据回填 | 新增 `Backfill fish -> play/fishing` 步骤：dry-run → `--apply` → 再次 dry-run 断言剩余 0 行；覆盖 discoveries / rankings / `City.scenes` / `SystemConfig.scene_tabs` |
| 发布后冒烟 | 沿用流水线既有 health、登录错误码与加油站数据冒烟 |

**为何把生产回填纳入本次部署**：Expand 之后若不把存量 `scene=fish` 记录迁到 `play + subType=fishing`，新后台与小程序「粗门玩玩」分类在生产将查不到任何钓鱼内容，属于功能缺失；回填脚本幂等且默认 dry-run，实执行前已有备份点与审计输出。

## 不在本次授权范围

- 移除 `fish` enum 值（Contract 阶段另开 Change）。
- 微信小程序体验版上传、真机 UAT、提审与正式发布（需微信开发者工具与审核通道）。
- 其它任何生产写入、外部消息、配置或 Secret 读取。

## 真实性与 Gate 边界

- 本记录只界定目标 / 环境 / 动作授权，**不把任何 Gate 标记为 `passed`**；`gate-decisions.json` 中 implementation 及之后 Gate 仍为 `pending`。
- `not-run`：恢复演练、四组合目标端矩阵、微信真机 UAT、后台浏览器 E2E、性能与可访问性人工检查、独立 Reviewer、Operations / Release / Completion Gate。
- 流水线实执行结果、备份文件名、回填审计 JSON 与线上冒烟输出须在部署后补写 `evidence/`，不得用本记录代替执行证据。
- 若 `production` Environment 配置了 Required reviewers，仍需授权人在 GitHub 上批准本次运行。
