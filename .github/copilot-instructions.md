# GitHub Copilot 工程入口

本仓库使用根目录 `AGENTS.md` 与 `.harness/` 作为统一工程契约。

在建议或修改代码前：

1. 读取 `AGENTS.md` 和 `.harness/manifest.yaml`。
2. 读取当前任务相关 Rules、Wiki、Knowledge、Change 和 Skill。
3. 仅在当前 Change 状态和已批准 TASK 范围内实现。
4. 保持 uni-app/Vue 3/Wot Design Uni 与 NestJS/TypeORM/MySQL/Redis/RabbitMQ 的分层、契约、可靠性和安全约束。
5. 不建议绕过测试、Gate、权限、Migration、幂等、兼容或证据要求的快捷方式。

完成建议必须包含适用验证；未执行验证不得表述为已通过。若信息不足或规则冲突，应指出阻塞点而不是编造仓库事实。
