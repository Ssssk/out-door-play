# 生产运营就绪评审

## 服务与业务 Owner

## SLI/SLO、错误预算和基线

## 容量、限流、降级和功能开关

## Dashboard、日志、Trace和告警

## MySQL、Redis、RabbitMQ Runbook

## 备份恢复和灾难恢复演练

## 值班、升级路径和供应商联系

## 发布观察窗口和退出标准

## 运维负责人结论

- 结论：`pending`

## 本次容量治理补充

- 策略与执行文件：`operations/docker-capacity-runbook.md`、`scripts/production-docker-maintenance.sh`。
- 生产发布前清理 Docker 构建缓存、未使用镜像和旧 release；不清理 volume、运行中容器或业务数据。
- `compose.prod.yaml` 为 db/api/web 配置 JSON 日志轮转（10MB × 3）。
- 图片每天净增长超过 400MB 且连续 7 天时，另开 Change 评估 COS/OSS；本次不迁移。
- 下一次生产发布前：`not-run`；未取得真实生产证据前，Operations Gate 保持 `pending`。

