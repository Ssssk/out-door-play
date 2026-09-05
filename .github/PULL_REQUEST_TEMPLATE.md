## Change

- `.harness/changes/<name>`：
- Change ID：
- 当前 Gate：
- 原始需求基线：
- 候选 SHA/制品：

## 范围与非目标

## 前端 / 后端 / API / 数据 / Redis / MQ 变化

## 风险与兼容性

## 测试证据

- [ ] Harness 校验
- [ ] Lint / Type Check / Build
- [ ] 单元测试
- [ ] MySQL/Redis/RabbitMQ 集成测试（如适用）
- [ ] API/消息契约测试（如适用）
- [ ] uni-app E2E/目标端验证（如适用）
- [ ] 安全评审（如适用）
- [ ] Secret/SAST/SCA/SBOM/供应链评审（如适用）
- [ ] UI/UX 与可访问性（如适用）
- [ ] 性能与容量（如适用）
- [ ] 产品 UAT（如适用）
- [ ] 运营就绪、备份恢复与 Incident 计划（如适用）

## 发布、迁移、监控和回滚

## 独立评审

- Reviewer：
- P0/P1：
- 结论：

## Gate 决策一致性

- [ ] `status.yaml` 与 `gate-decisions.json` 一致
- [ ] 所有 passed Gate 有审批人、时间和证据
- [ ] `.evidence.json` 绑定当前 Change、FR/AC、SHA 和环境
