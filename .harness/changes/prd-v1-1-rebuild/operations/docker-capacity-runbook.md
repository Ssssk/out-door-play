# 生产磁盘与发布清理策略

Change：`CHG-OUTDOOR-V110-001`

状态：`implementing`。本文件描述已批准进入实现的策略；在下一次生产发布前，不能把“自动执行已生效”写成已验证事实。

## 目标与非目标

目标是避免单机 Docker 宿主机因为发布制品、BuildKit 缓存、日志和旧 release 目录持续累积而写满磁盘。

本次只实施以下三项：

1. 发布前清理 Docker 构建缓存和未使用镜像；保留当前镜像及最近两个可回滚镜像。
2. 为 MySQL、API、Web 容器配置 Docker JSON 日志轮转：单文件 10MB，最多 3 个文件。
3. 发布前清理旧 release 目录，只保留最近 3 个 release。

本次不实施图片迁移、COS/OSS、数据库清理、数据卷清理、容器清理、数据库扩容或生产重启以外的操作。

## 发布执行约定

- 发布工作流 `.github/workflows/deploy-production.yml` 在构建前上传并调用 `scripts/production-docker-maintenance.sh`。
- 维护脚本只允许操作 `docker builder prune`、`docker image prune` 和 `DEPLOY_DIR/releases` 下的旧子目录。
- 根分区使用率低于 70% 时按 7 天清理缓存；达到 70% 及以上时进入保护模式，完整清理未保护的构建缓存和镜像，优先保证发布不会因空间不足失败。
- 禁止使用 `docker system prune --volumes`、`docker volume prune`、`docker container prune` 或删除运行中容器。
- 镜像保护别名为每个仓库的 `rollback-1`、`rollback-2`、`rollback-3`，对应当前及最近两个回滚候选。
- release 保留数不得低于 3；删除前按目录修改时间排序，并且只删除 `DEPLOY_DIR/releases` 的直接子目录。
- `compose.prod.yaml` 的日志轮转配置在下一次 `docker compose up -d` 时对新建/重建容器生效。

## 阈值与观察

- 磁盘可用空间低于 20GB 或根分区使用率达到 70%：进入容量关注状态，检查 `df -h /`、`docker system df` 和两个数据卷大小。
- 根分区达到 80%：暂停非必要发布，先执行维护脚本并确认回收量。
- 根分区达到 90%：按生产事故处理，禁止继续构建，先释放空间或扩容。
- 每次发布后记录 `df -h /`、`docker system df`、清理前后可用空间和 release 数量。

## 图片增长触发条件（本次仅记录，不自动迁移）

若连续 7 天观测到上传图片/头像数据净增长超过 **400MB/天**，下一步应单独创建 Change，评估将上传文件迁移到 COS/OSS + CDN。迁移前必须定义对象 key、旧 URL 兼容窗口、回源/失败降级、删除策略、备份、回滚和费用上限；本文件不授权自动创建 COS、上传对象或删除本地文件。

## 回滚与异常

- 清理脚本失败时，发布必须停止，不能跳过磁盘检查继续构建。
- 镜像回滚优先使用 `rollback-1` 或 `rollback-2`；若镜像不存在，必须从可追溯制品重新拉取，不得删除数据卷来“修复”空间。
- 日志轮转只影响新容器的 Docker 日志配置，不删除 MySQL 数据、上传文件或业务表。

## 验证证据

下一次生产发布需补充：提交 SHA、工作流 Run URL、清理前后 `df -h /`、`docker system df`、保留的镜像/ release 列表、日志轮转配置检查、健康检查和回滚候选。当前策略的生产生效状态为 `not-run`，不能提前标记 Operations Gate passed。
