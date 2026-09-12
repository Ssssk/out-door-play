# 腾讯云免费证书申请

- 日期：2026-09-12（北京时间）
- 用户授权：用户明确表示尚未申请 SSL 证书，并要求代为申请。
- 申请域名：chumenliuliu.cloud；申请页说明根域名证书附带 www.chumenliuliu.cloud，签发后仍需核对 SAN。
- 证书 ID：aj6vgrTi。
- 控制台：https://console.cloud.tencent.com/ssl/dsc/apply?id=aj6vgrTi&status=audit
- 类型：免费证书，有效期 90 天；无付费订单。
- 验证方式：自动 DNS 验证；控制台确认已自动添加 _dnsauth TXT 记录。
- 实际状态：腾讯云控制台已显示“已签发”，支持域名为 `chumenliuliu.cloud`、`www.chumenliuliu.cloud`，有效期至 2026-12-11；授权服务角色后，CVM 部署页明确提示“不支持一键部署至 CVM”。
- 远程处理：已备份 `/opt/chumen/compose.prod.yaml` 和 `.env.production`，使用 Certbot 为同一两个域名签发免费证书并挂载到 `chumen-web-prod`；证书 SAN、有效期和 HTTPS 握手已核对。Certbot renewal 已改为 webroot，`certbot renew --dry-run` 通过，deploy hook 会复制证书并 reload 容器。
- 证书详情：签发者 Let's Encrypt YE1；证书路径 `/etc/letsencrypt/live/chumenliuliu.cloud/fullchain.pem`，容器挂载副本位于服务器 `/opt/chumen/certs`。腾讯云证书 `aj6vgrTi` 仍保留在账号内，未用于最终 CVM 容器挂载。
