# 个人生活感悟记录官网

`dist/` 是不依赖构建工具的静态官网，可直接交给 Nginx、对象存储、CDN 或静态托管服务。

官网地址：`https://www.chumenliuliu.cloud/`

本地/HTTP 镜像由 `docker/nginx/default.conf` 提供路由；生产容器挂载 `docker/nginx/production.conf`，由容器内 Nginx 终止 HTTPS。官网首页使用 `website/dist`，运营后台使用 `https://www.chumenliuliu.cloud/admin/`，API 使用同域名下的 `/v1/`。

腾讯云 DNSPod 已将 `www.chumenliuliu.cloud` 配置为 A 记录，指向现有服务器 `124.223.220.242`（TTL 600）；主域名 `@` 记录保持不变。

当前页面底部已使用你提供的真实 ICP 备案号 `鄂ICP备2023015599号-4`。公安联网备案仍未提供，后续只需在同一页脚位置补充平台审核通过后生成的公安备案信息。

1. 保留 `鄂ICP备2023015599号-4` 与 `https://beian.miit.gov.cn/` 链接，备案信息变化时再按实际结果更新。
2. 公安联网备案审核通过后，如果平台要求展示公安编号，再将平台生成的官方备案图标/链接代码放在页脚同一备案位置。

上线前确认域名已完成 ICP 备案、DNS 解析到实际接入服务，并使用 HTTPS。网站服务开通后按属地公安机关要求，在[全国互联网安全管理服务平台](https://beian.mps.gov.cn/)完成公安联网备案；截图中的“30 日内”以你的接入服务商和属地平台当前提示为准。

## 本地预览

在仓库根目录运行任意静态文件服务器，把站点根目录指向 `website/dist`，然后打开 `index.html`。页面只使用同目录的入口文件，没有外部运行时依赖。
