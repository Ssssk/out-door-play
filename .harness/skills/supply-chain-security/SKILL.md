---
name: supply-chain-security
description: 对依赖、锁文件、Secret、源码、许可证、SBOM、CI、容器和 IaC 执行软件供应链安全门禁；依赖或制品变化及发布前使用。
---

# 软件供应链安全

## 触发条件

- 新增/升级 npm 依赖、GitHub Action、镜像、构建工具或原生插件。
- 修改 CI 权限、安装脚本、制品发布、Docker 或 IaC。
- 发布 Gate 前执行安全供应链证据检查。

## 不适用场景

- 未经授权扫描生产或外部系统。
- 仅凭漏洞数量阻塞，不评估可达性、影响和修复版本。
- 用升级所有依赖的方式扩大当前安全修复范围。

## 前置 Gate

- 依赖锁文件和候选 SHA 固定。
- 扫描工具、数据库更新时间、严重度策略和例外批准人明确。
- CI 扫描不输出 Secret，不执行不可信包的危险安装脚本。

## 必读上下文

1. 安全、CI、依赖和发布 Rules。
2. package manifests/lock、Action、Dockerfile、镜像、IaC 和发布制品。
3. 当前 Change 影响分析、依赖升级说明和历史安全记录。
4. `security/supply-chain-review.md`。

## 输入

- 候选 SHA、锁文件、SBOM、镜像 digest 和 CI workflow。
- Secret、SAST、SCA、许可证、镜像和 IaC 扫描结果。
- 漏洞利用条件、运行时可达性、修复版本和风险接受政策。

## 执行步骤

1. 核对依赖清单与锁文件一致，识别新增、删除、来源和安装脚本。
2. 扫描仓库历史和候选 diff 中的 Secret；发现真实凭证先撤销轮换。
3. 执行 SAST，聚焦注入、越权、SSRF、路径、反序列化和危险 API。
4. 执行 SCA，记录 CVE、包、版本、依赖路径、可达性和修复方案。
5. 检查许可证、来源、维护状态、下载脚本和 typosquatting 风险。
6. 生成 SBOM 并绑定候选 SHA/制品 digest。
7. 扫描容器基础镜像、运行用户、能力、包、标签和签名/来源。
8. 检查 IaC、CI Action 固定版本、最小权限、OIDC/Secret 和 fork 边界。
9. 按 P0-P3 处理发现；例外必须有 Owner、理由、期限和补偿控制。
10. 修复后重扫相同范围，保存原始和修复后证据。
11. 更新 supply-chain review 和 security Gate 决策。

## 技术约束

- 锁文件不可缺失或与 manifest 漂移；禁止从不可信 URL 安装未校验制品。
- 真实 Secret 泄漏不能只从 Git 删除，必须撤销、轮换和调查访问日志。
- 漏洞严重度结合可达性与资产影响，但 P0/P1 风险接受需独立授权。
- SBOM 和镜像 digest 必须对应最终发布制品。
- CI Token 使用最小权限，第三方 Action 固定完整 commit 或受控版本。
- 扫描数据库和工具版本进入证据，防止不可复现结论。

## 产物

- `security/supply-chain-review.md`。
- 扫描报告、SBOM、镜像 digest、例外和到期记录。
- 修复/缓解任务、后续 Change 与 Security Gate 决策。

## 验证与证据

- 对候选 SHA 重跑扫描结果可复现。
- SBOM 能映射锁文件和最终制品，不包含未知来源组件。
- 例外到期前有提醒/门禁，过期后不再自动接受。
- Secret 扫描测试使用假值，不在证据中复制真实凭证。

## 停止与升级条件

- 发现有效 Secret、恶意依赖、制品篡改或 P0/P1 可利用漏洞。
- 无法确认依赖、Action 或镜像来源。
- 扫描需要超出授权访问私有/生产系统。
- 发布制品与被扫描制品 digest 不一致。

## 禁止事项

- 不隐藏扫描发现或用 allowlist 永久忽略。
- 不自动升级大批无关依赖来修复单一问题。
- 不把“扫描无发现”表述为绝对安全。
- 不允许实现者自行批准高风险例外。

## 完成定义

候选源码、依赖、CI 和制品经过可复核扫描；SBOM 与 digest 对应；P0/P1 已修复或阻塞；例外有期限和补偿；供应链结论进入 Security Gate。
