# 技术设计（待 Gate）

## 分批策略

1. 批次 A：同主版本/补丁候选——`jpeg-js 0.4.4`、`ws 8.21+`、`postcss 8.5.18+`、`@intlify/* 9.1.11+`、adapter 路径 `mariadb >=3.4.6`；逐项验证上游约束。
2. 批次 B：`adm-zip 0.6+`，因 0.x 版本可能包含破坏性变化，单独验证 uni 构建链。
3. 批次 C：mobile Vite 与 DCloud 发行版联动，只有官方兼容信息支持时升级；不孤立强升 Vite。
4. 批次 D：Prisma/deepmerge-ts，禁止使用 RC 作为默认修复；评估稳定 Prisma 更新或受控 override。

## pnpm 策略

- 直接依赖优先更新 manifest；传递依赖仅在上游无法及时修复时使用 `pnpm.overrides`。
- override 每项记录依赖路径、测试、Owner、加入日期和移除条件。
- 每批执行 frozen install、`pnpm why`、SCA、typecheck、unit、build；失败立即回退该批 lock diff。

## 安全与制品

- audit 使用命令级官方 Registry，不改开发者持久配置。
- 生成 SBOM 并绑定 lock hash/候选 SHA；security job 输出非零即阻塞。

## 备选方案

| 方案 | 优点 | 风险 | 结论 |
|---|---|---|---|
| 全部强制 override | 速度快 | 上游不兼容、构建静默损坏 | 不采用 |
| 按依赖族分批 | 可定位、可回退 | 周期较长 | 推荐，待批准 |
| 接受全部 build-only 风险 | 无改动 | CI/本机构建仍可被利用 | 不采用 |
