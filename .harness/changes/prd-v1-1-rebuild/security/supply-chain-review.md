# 软件供应链安全评审

## 制品与依赖范围

- pnpm workspace：mobile、admin、api；锁文件 `pnpm-lock.yaml`。
- 审查基线：HEAD `a2a56a7...` + 未提交工作树；尚不是可发布 SHA。

## Secret 扫描

- 本轮仅执行文件名、跟踪状态和源码中凭证形态的只读初查；未读取 Secret 值。
- 本地 `.env*` 和 `private.*.key` 未被 Git 跟踪。
- 真正历史 Secret 扫描、轮换证明和 CI 阻断尚未配置。

## SAST 与危险配置

- 未配置正式 SAST。
- 已识别无认证写接口、宽松本地 CORS、无条件 Swagger 暴露，记录在 `verification/security-review.md`。

## SCA、漏洞和许可证

- 默认 `npmmirror` 不支持 audit API，首次命令因端点不存在失败；未修改持久 registry。
- 使用官方 npm Registry 复核：35 vulnerabilities（3 low / 21 moderate / 11 high），命令退出 1。
- 主要高危锁定版本：`jpeg-js@0.3.7`、`ws@8.18.0`、`adm-zip@0.5.16`、`postcss@8.5.6`、`deepmerge-ts@7.1.5`、`@intlify/*@9.1.9`、`mariadb@3.4.5` 和 mobile `vite@5.2.8`。
- 多数来自 uni-app 工具链；不能以“仅构建依赖”为由自动接受，也不能无回归强制 override。
- 许可证清单尚未生成。

## SBOM 与制品来源

SBOM not-run；构建目录已产生，但未绑定干净提交 SHA 或 digest，不能作为发布制品。

## 容器镜像、IaC 与CI权限

not-run；现有 workflow 仅做 Harness 校验且 project-quality 仍为 template。

## 发现、例外和到期时间

- `SC-P1-001`：11 个 high 依赖漏洞，Owner 待定，禁止风险自接受。
- 尚无例外批准、到期时间或补偿控制。

## 证据与结论

- 证据：`../evidence/004-security-audit.evidence.json`、`pnpm why` 本地依赖路径核对。
- 状态：`failed`；阻塞 Security Gate 和发布。

