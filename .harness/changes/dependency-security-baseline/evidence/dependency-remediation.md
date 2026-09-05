# 依赖治理执行证据（2026-08-30）

## 扫描变化

- 初始：35 vulnerabilities，11 high。
- 覆盖修复后：21 vulnerabilities，2 high。
- 剩余 high：Vite `launch-editor` Windows command injection、`server.fs.deny` Windows alternate path bypass。
- 扫描命令：`pnpm audit --registry=https://registry.npmjs.org --prod --audit-level high`，退出码 1（按预期阻断）。

## 2026-09-05 advisory 增量处置

- 新发现：`prisma@7.10.0 -> mysql2@3.15.3` 命中明文凭据泄露 high；修复版本 `>=3.22.0`。
- 处置：`pnpm-workspace.yaml` 增加精确 override `mysql2@3.15.3: 3.22.0`，未升级 Prisma、未扩大到其他依赖族。
- 验证：frozen install、`pnpm -r why mysql2`（唯一 3.22.0）、Prisma generate、API type-check、30 unit tests、Nest build 均通过。
- 修复后审计：25 vulnerabilities，4 low / 19 moderate / 2 high；退出码仍为 1，剩余项与原 Vite 阻塞相同。
- 2026-09-05 active 总门禁复核：install、format、lint、typecheck、unit、build、contract、MySQL integration、HTTP E2E 均通过；security 在 npm audit 处因同一 2 high 返回 1，总门禁保持失败。

## 回归

- workspace type-check：通过。
- API tests：8/8；Admin tests：2/2；Mobile tests：2/2（治理前后均通过）。
- API build：通过；Admin build：通过；uni-app H5 build：通过；微信小程序 build：通过。
- 已知非阻断告警：Wot/Sass deprecated API；Admin Analytics chunk 503.80 kB。

## 哈希

- `pnpm-lock.yaml`: `46E1A8EA630D16DDBE7E73E432D8156A4518C3A2A02741299218295758304C05`
- `package.json`: `04E02FE509BCCA1C610E8CC2C5DA4E882ED2F4CC3174CFDCA8FBD1ADA59CD81B`
- `pnpm-workspace.yaml`: `48792DB728FC023FB61769B1F4A69832B3D288651084D25BD5F887B36201C45F`
- `apps/admin/package.json`: `588F3BA56E50144F4147DCA217424FABA33F72C2F1AE84BF422149523EACDB02`
- `apps/api/package.json`: `71E733A5BDBC96514AEE122B4E028D76B35006B16844F01B747CCC7E6D38B917`
- `apps/mobile/package.json`: `931042DC7EF0B471CA5DA7145F17DF6B1FFC6985B0AA0102AD3CAB480AAA165F`
- `sbom.cdx.json`: `849400930644A2A6DC1ABF29EA7C86CC2FAC19FAE1EFDD960A231563C04B4750`

2026-09-05 当前哈希（mobile 组件测试依赖补齐后）：

- `pnpm-lock.yaml`: `5AF1DF5158AE529E65D14870EB7F71AA486C9244F47A56C92797F1CAD9706553`
- `pnpm-workspace.yaml`: `3742737138828D3C47C684E756A1334C0ADF2E3EB0C4CD2BC1F622CF0812CF1A`
- `package.json`: `C776598CA4CEDBE292656EA0D416B0CDF2448E4976162306F0A36A250523740C`
- `sbom.cdx.json`: `EF2A8A791182DC668EFC615B00058F9D07ED7E233AAF13A8E4D23F4435797DE7`

## 2026-09-05 限时例外自动化

- 用户（安全 Owner）批准 `GHSA-c27g-q93r-2cwf` 与 `GHSA-fx2h-pf6j-xcff` 至 2026-09-15 的限时例外。
- 新增 `scripts/audit-with-exceptions.mjs`：仅允许上述两个 Vite high；新增 high、critical、包/等级不匹配或过期均阻塞。
- `node --test scripts/audit-with-exceptions.test.mjs`：4/4 通过，覆盖批准项、未知 high、过期和 critical。
- `pnpm security:audit`：通过，并逐项输出两个已接受例外及到期时间；原始 advisory 未隐藏。
