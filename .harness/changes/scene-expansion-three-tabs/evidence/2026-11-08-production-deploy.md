# 正式环境部署与线上验证证据（2026-11-08）

- Change ID：`CHG-SCENE-EXPANSION-001`（并入 `CHG-HOME-CATEGORY-001`）
- 目标端：`https://www.chumenliuliu.cloud/admin/routes`
- 部署提交 SHA：`e389b1123cee7da39c03b9cd2ff69c37ad948977`（派发时 `main` HEAD）
- 后续清理提交：`e2bf7cb09958d1fef51b16b1784500082dbe1385`（仅删除一次性派发工作流，不含代码变化）
- 工作流运行：[Deploy production #80 / run 42483370291](https://github.com/Ssssk/out-door-play/actions/runs/42483370291)，`workflow_dispatch`，`completed / success`，开始 `2026-11-08T13:06:39Z`，结束 `2026-11-08T13:17:39Z`
- 触发链路：本机无 GitHub CLI / Token，落盘一次性工作流 `production-dispatch-once.yml`，其 run `42483363862`（`completed / success`）调用 `gh workflow run deploy-production.yml --ref main`；部署成功后已在 `e2bf7cb` 删除，发布门禁恢复为仅 `workflow_dispatch`
- 授权记录：`approvals/2026-11-08-production-deploy.md`
- 证据采集时间：`2026-11-08T13:20:31Z`

## 流水线真实结果

| Job | 结论 | 关键步骤 |
|---|---|---|
| `build-images` | `success` | Verify API image build、Verify admin image build 全部 `success` |
| `deploy` | `success` | 1–7 上传与环境准备 `success`；8 Build images on test server `success`；9 **Backup production database before schema expansion** `success`；10 Migrate, restart and backfill fuel prices `success`；11 **Backfill fish -> play/fishing (dry-run, apply, verify)** `success`；12–16 数据源自检、磁盘诊断、站点同步、加油站冒烟全部 `success` |

备份点命名规则：`backups/pre-scene-expansion-e389b1123cee7da39c03b9cd2ff69c37ad948977.sql.gz`（步骤 9 `test -s` 校验非空通过）。**实际文件名与文件内容未在宿主机读取**（本机无生产 SSH 授权）；恢复演练 `not-run`。

第 11 步的幂等断言 `mode=dry-run preview=0 discoveries / 0 rankings / 0 cities / 0 config` 通过，说明回填实执行后已无残留 `fish` 行；回填审计 JSON 由工作流日志输出，未在本机归档（工作流日志需管理员权限下载）。

## 部署前 / 后线上只读探测

| 探测 | 部署前 | 部署后 |
|---|---|---|
| `/v1/health` | 200 | 200（database connected） |
| `/v1/config/scene-tabs` | 404（旧构建无端点） | 200，`items` = `drive / play / wash`，标签「粗门溜车 / 粗门玩玩 / 粗门洗车」，`revision=0` |
| `/v1/routes?city=420100&scene=play&limit=3` | 422 `isIn` | 200，2 条，`scene=play` + `subType=fishing` |
| `/v1/routes?city=420100&scene=play&subType=fishing&limit=3` | 422 | 200，2 条 |
| `/v1/routes?city=420100&scene=drive&limit=3` | 200 | 200，3 条 |
| `/v1/routes?city=420100&scene=wash&limit=3` | 422 | 200，0 条（一期空态） |
| `/v1/routes?city=420100&scene=fish&limit=3` | 200 | 200，2 条（旧包读兼容） |
| `/v1/routes?city=420100&scene=drive&subType=fishing` | 422 | 422 `SCENE_SUBTYPE_INVALID` |
| `/v1/routes/liangzihu`（详情） | 200 | 200，`scene=play` + `subType=fishing`，详情按集合放行 |
| `/admin/routes` | 200（旧构建） | 200（新构建） |

## 后台产物核对

从线上 `https://www.chumenliuliu.cloud/admin/routes` 的入口 JS 提取懒加载分块并逐个下载校验（HTTP 200）：

- `assets/RoutesView-DLCdcGMf.js`（21,156 B）：「粗门溜车」2、 「粗门玩玩」5、「粗门洗车」2、「钓鱼」6、「露营」3、「打卡」3、「钓点」5、「水深」1。
- `assets/SceneTabsConfigView-7IGN7ilT.js`（5,682 B）：三个分类各 2 处、「恢复默认」4 处、「分类目录」1 处。

说明：入口 `assets/index-B3ElPSbz.js` 不含中文视图文案（Vite 代码分割），因此必须校验对应视图分块；仅看入口文件会误判为未部署。

## CI 与门禁真实状态

- `Component CI release` run `42481538943`：`completed / success`（组件 CI、契约、镜像构建）。
- `Harness Contract` run `42481538999` 与 `42483363685`：`completed / failure`，失败步骤均为 `Run application quality gates`；基线提交 `48308d8` 的 run `42452596458` 同样失败。本地复现定位为既有依赖供应链门禁：`pnpm security:audit` 因过期例外 / 未批准公告被阻断，`pnpm security:sbom` 的 `cdxgen` 下载超时；与本次场景扩展无关，也未做删除或弱化。
- 该失败意味着 **Security Gate 未通过**；发布流水线为独立手动工作流，不受其阻塞。此事实不隐藏、不改写为 `passed`。

## 未覆盖范围（`not-run`）

- 备份可恢复性演练、四组合滚动兼容矩阵、后台浏览器 E2E、微信真机 / 体验版 UAT、性能压测、可访问性人工检查、独立 Reviewer、Operations / Release / Completion Gate。
- 微信小程序体验版上传与正式发布：提交带 `[skip-miniprogram-experience]`，本次只发布 Web 后台与 API。
- `status.yaml` 保持 `implementing`，implementation 及之后 Gate 全部 `pending`；本文件是部署执行证据，不代表 Gate 批准。
