# 发布计划

## 制品与版本

## 环境与配置变更

## 数据迁移顺序

## API/Worker/消费者发布顺序

## 灰度或功能开关

## 发布前检查

- UAT Gate：
- Operations Gate：
- Security/Supply-chain Gate：
- 制品 SHA/digest 与 SBOM：
- 磁盘治理：发布前执行 `scripts/production-docker-maintenance.sh`；确认只保留当前及最近两个回滚镜像、最近 3 个 release，且不触碰 volume/运行中容器。
- 日志治理：确认 `compose.prod.yaml` 的 db/api/web 日志轮转配置随本次发布生效。
- 图片容量：仅记录每日增长；连续 7 天超过 400MB/天时创建独立 COS/OSS 迁移 Change，本次发布不自动迁移。

## 发布后验证与观察窗口

## 小程序/App审核与用户可获得性

## Incident Commander 与通信渠道

## 审批与执行权限

