# Requirements / Design Gate 批准

- Change：`CHG-SEC-DEPS-001`
- 批准人：用户（产品、架构与安全 Owner）
- 时间：2026-08-30
- 用户回复：`OK，开搞`
- 上下文：紧接在“依赖按分批策略修复”的明确批准请求之后，视为批准该推荐方案。

批准：按依赖族分批处理；允许有说明、可移除且完整回归的 pnpm override；DCloud/Vite 与 Prisma 主版本不做未经官方兼容证明的强升；无法安全消除的发现保持 Security Gate 阻塞或由后续独立限时例外裁决。
