# Claude Code 工程入口

本仓库的唯一工程治理来源是根目录 `AGENTS.md` 与 `.harness/`。Claude Code 在执行任何分析、设计、编码、测试、评审、排障、迁移或发布工作前，必须：

1. 完整读取 `AGENTS.md`。
2. 按其启动协议读取 `.harness/manifest.yaml`、Rules、当前 Change、Wiki、Knowledge 和匹配 Skill。
3. 遵守 Change 状态、人工 Gate、证据、生产权限和停止条件。

本文件只做 Claude Code 适配，不复制或覆盖技术规则。若本文件与 `AGENTS.md`/`.harness/rules/` 冲突，以平台指令和 `AGENTS.md` 声明的权威顺序处理，并报告冲突。

完成前必须运行：

```text
node .harness/scripts/validate-harness.mjs
```

禁止把未运行的测试、评审、部署或审批写成已通过。
