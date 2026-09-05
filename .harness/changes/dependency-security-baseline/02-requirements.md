# 需求规格

### FR-SCA-001 固定并复现漏洞基线

- 使用官方 npm Registry和固定锁文件扫描，记录包、版本、路径、严重度、修复版本和可达性。
- 扫描失败必须阻塞，禁止切回不支持 audit 的镜像后宣称通过。

### FR-REMEDIATE-001 最小范围修复

- 优先直接依赖兼容升级，其次上游发行版升级，最后才考虑受控 override。
- 每个 override 必须有理由、兼容测试和移除条件。
- 禁止为了清零数量无界升级全部依赖。

### FR-SBOM-001 供应链制品

- 生成 CycloneDX 或 SPDX SBOM，绑定候选 SHA/lock hash；不得包含 Secret。

### NFR-SUPPLY-001 Fail-closed

- high 未修复或未获独立限时例外时，security 命令退出非零并阻塞合并/发布。

### NFR-COMPAT-001 兼容回归

- 必须通过 typecheck、6 个以上单测、API/Admin 构建、H5 和微信构建；DCloud/Vite/Prisma 变化增加目标端与数据库验证。

## 非目标

- 不替换 Prisma，不接入 Redis/MQ，不修改产品交互。

## 来源追踪

| FR/NFR | 来源 | Owner确认 |
|---|---|---|
| FR-SCA-001、FR-REMEDIATE-001、NFR-SUPPLY-001 | SRC-SCA-001/SRC-PARENT-001 | pending |
| FR-SBOM-001、NFR-COMPAT-001 | Harness Supply Chain Rules | pending |
