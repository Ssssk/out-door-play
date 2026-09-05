# 软件供应链安全评审

## 制品与依赖范围

- pnpm workspace：API、Admin、uni-app mobile；扫描生产依赖并生成整个仓库 JS SBOM。
- lock SHA-256：`46E1A8EA630D16DDBE7E73E432D8156A4518C3A2A02741299218295758304C05`。

## Secret 扫描

## SAST 与危险配置

## SCA、漏洞和许可证

- 官方 npm Registry：2026-09-05 advisory 数据库一度新增 `mysql2 <3.22.0` high；以单点 override 锁定 3.22.0 后复扫为 25（2 high），高危仅剩 Vite 5.2.8 的两条开发服务器公告。
- 覆盖修复：`@intlify/*`、`adm-zip`、`deepmerge-ts`、`jpeg-js`、`mariadb`、`postcss`、`ws`。
- 原始 `pnpm audit --prod --audit-level high` 因两个已知 Vite high 非零退出；`scripts/audit-with-exceptions.mjs` 仅接受已批准且未到期的两个指定 GHSA，新增 high、critical、包/等级不匹配或到期均非零退出。
- CycloneDX SBOM 包含组件许可证字段；发布前仍需独立许可证策略审查。

## SBOM 与制品来源

- `evidence/sbom.cdx.json`：CycloneDX 1.6，已在 mysql2 lock 与 mobile 测试依赖更新后重新生成，SHA-256 `5C87338A1C9E11A6804272E6C6E2F834D1AD8B1165FF3043F3F3C18E1FC13635`。
- 生成器：`@cyclonedx/cdxgen@12.8.4`；执行时报告宿主 `NODE_PATH` 污染风险，后续 CI 应在干净环境生成。

## 容器镜像、IaC 与CI权限

## 发现、例外和到期时间

- `DEP-EX-001`：Vite 5.2.8 暂缓升级，原因是当前 DCloud 插件 peer 精确要求 5.2.8。
- 临时控制：mobile Vite 默认绑定 `127.0.0.1`；生产只发布静态构建制品；不得在不可信网络公开开发服务器。
- 例外到期：2026-09-15；Owner：安全 Owner；触发条件：DCloud 兼容版本发布或到期，以先到者为准。
- 批准状态：用户（安全 Owner）于 2026-09-05 明确批准两个指定 GHSA 的限时例外；证据为 `approvals/2026-09-05-vite-risk-exception.md`。新增 high 不在例外范围内。

## 证据与结论

- 状态：`exception-accepted`（残余 2 high 已获限时例外，原始发现仍保留；例外策略测试与当前实际审计通过）
- 结论：修复批次和四端回归完成；两个指定 Vite 风险允许在补偿控制与到期约束下继续开发。完整 Security Gate 仍等待其他安全项与独立复核。

