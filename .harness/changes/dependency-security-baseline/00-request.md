# CHG-SEC-DEPS-001 依赖安全基线

## 来源

- 提出人：由 `CHG-OUTDOOR-V110-001` 安全评审触发
- 日期：2026-08-30
- 来源 ID：SRC-PARENT-001、SRC-SCA-001、SRC-LOCK-001

## 目标

修复或以独立 Owner、期限和补偿控制处置当前 11 个 high 依赖漏洞，使 H5、微信小程序、Admin、API 的锁文件、构建与运行依赖达到可进入 Security Gate 的状态。

## 当前证据

- 默认 npmmirror 不提供 audit API；使用命令级官方 npm Registry 扫描后退出 1。
- 共 35 个发现：3 low、21 moderate、11 high。
- 高危涉及 mobile 构建链 `jpeg-js/ws/adm-zip/postcss/@intlify/vite`、Prisma 配置链 `deepmerge-ts`、Prisma MariaDB adapter 的 `mariadb@3.4.5`。

## 范围

- 包含：锁文件、最小依赖升级/override、uni-app/Prisma 兼容核对、SCA 复扫、许可证、SBOM、CI security 命令。
- 不包含：业务功能、ORM 替换、uni-app 全栈无关升级、生产发布、未批准的漏洞风险接受。

## 成功信号

- 官方 Registry `pnpm audit --prod --audit-level high` 无未处置 high。
- H5、微信、Admin、API 的 type/test/build 全部通过。
- 生成可追溯 SBOM；所有残余例外具备独立批准人、期限、补偿控制。

## 分类

- 类型：dependency / security
- 风险：high
- 必需 Gate：Requirements、Design、Implementation、Verification、Security、Supply Chain；无 UI 行为时 UAT 可申请 not-required。
