# 验收标准

### AC-SCA-001 扫描可复现

- GIVEN 固定 lock hash 和官方 Registry，WHEN 执行 SCA，THEN 报告包含全部 high 的包、版本和依赖路径并绑定当前 SHA。

### AC-REMEDIATE-001 高危闭环

- GIVEN 当前 11 high，WHEN 应用批准的最小修复，THEN 复扫无未处置 high；例外必须有 Owner、到期时间和补偿控制。

### AC-COMPAT-001 全栈回归

- GIVEN 新锁文件，WHEN 执行安装、typecheck、unit、build，THEN API/Admin/H5/微信全部通过且无新增失败。

### AC-SBOM-001 SBOM 可追溯

- GIVEN 候选制品，WHEN 生成 SBOM，THEN 组件映射 lock、SHA 和制品，且不包含凭证。
