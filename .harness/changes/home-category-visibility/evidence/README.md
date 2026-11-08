# 证据目录

每项证据必须记录：Change/需求/验收 ID、来源、提交 SHA、命令/操作、环境、时间、退出码、Runner、结果摘要和制品路径。

建议文件：

- `001-static.evidence.json`
- `002-unit.evidence.json`
- `003-integration.evidence.json`
- `004-contract.evidence.json`
- `005-e2e.evidence.json`
- `review-report.md`
- `deployment-result.md`
- `screenshots/`

机器可读证据格式：

```json
{
  "changeId": "CHG-DOMAIN-001",
  "requirementIds": ["FR-DOMAIN-001"],
  "acceptanceIds": ["AC-DOMAIN-001"],
  "type": "integration",
  "status": "passed",
  "commit": "0123456789abcdef",
  "environment": "ci-integration",
  "startedAt": "2026-08-30T10:00:00Z",
  "finishedAt": "2026-08-30T10:05:00Z",
  "command": "npm run test:integration",
  "exitCode": 0,
  "summary": "MySQL、Redis、RabbitMQ集成测试通过",
  "runner": "github-actions",
  "artifacts": ["reports/integration.xml"],
  "artifactsSha256": {}
}
```

禁止放入 Token、密码、个人敏感数据和超大原始日志。未运行项目必须标记 `not-run`，不得创建伪造的 passed 证据。
