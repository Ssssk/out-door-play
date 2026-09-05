# 软件供应链安全评审

## 制品与依赖范围

## Secret 扫描

## SAST 与危险配置

## SCA、漏洞和许可证

## SBOM 与制品来源

## 容器镜像、IaC 与CI权限

## 发现、例外和到期时间

## 证据与结论

- 状态：`not-run`

# 软件供应链评审

- 本 Change 未新增 production dependency；新增的测试工具已在上一身份切片冻结并通过 frozen install。
- H5/mp-weixin 构建与 Secret scan 通过。
- 2026-09-05 `pnpm security:audit` 退出码 1：4 low / 19 moderate / 2 high。
- 2 high 均位于 uni-app 精确兼容链的 Vite；未擅自升级 uni-app/Vite，未降低 audit 阈值。
- Security Owner 与独立 Reviewer 尚未签署，结论 `pending/blocked`。
