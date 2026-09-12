# 发布计划

本 Change 交付官网静态入口、包含官网与 `/admin/` 的 Web 镜像配置，以及小程序生产 API 地址调整；已按用户授权将 Web 容器部署到远程服务器并完成 HTTPS 冒烟。ICP备案号已展示，公安备案状态和微信 request 合法域名仍需平台侧完成。

本次已按用户授权在腾讯云 DNSPod 完成 `www A 124.223.220.242` 配置；远程 `chumen-web-prod` 已切换到包含官网、`/admin/`、`/v1/` 路由的 `chumen-web:domain-final`，80 自动跳转 443，证书由 Certbot 自动续期。腾讯云 SSL 控制台中的免费证书 `aj6vgrTi` 已签发，但 CVM 页面提示不支持一键部署；当前 HTTPS 使用服务器上同域的 Let's Encrypt 免费证书，续期和 reload 已验证。

## 发布前检查

1. 确认首页页脚展示 `鄂ICP备2023015599号-4`，并核对链接指向工信部备案查询系统。
2. 公安联网备案审核通过后补充平台生成的公安编号与图标代码。
3. 用目标域名 `https://www.chumenliuliu.cloud/` 检查首页、备案链接和 HTTPS；远程冒烟已通过，后续只需按运维周期观察续期。

## 证据

本地静态入口与内容检查记录在 `evidence/001-static-website.evidence.json`，DNSPod 变更记录在 `evidence/002-tencent-dns.evidence.json`。
