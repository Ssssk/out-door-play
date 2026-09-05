# 安全评审

## 信任边界与数据流

- Vite 仅属于开发/构建链；mobile 开发服务器默认回环地址，生产不运行 Vite server。

## 身份、授权和资源级访问

## 输入、输出和外部访问

## 敏感数据、Secret 和日志

## 依赖、上传、MQ 与部署权限

| 风险 ID | 等级 | 条件与影响 | 证据 | 修复 | 状态 |
|---|---|---|---|---|---|
| DEP-P1-001 | P1 | Vite 5.2.8 命中 2 条 high；若开发服务器暴露给不可信网络可能被利用 | 官方 npm audit、DCloud peer | 默认回环绑定；等待兼容升级 | open/exception-pending |
| DEP-M2-001 | P2 | cdxgen 检测到宿主 NODE_PATH，可能影响本机 SBOM 解析 | cdxgen secure-mode 输出 | CI 清洁环境重生并比对 hash | open |

## 残余风险与批准

- 不建议当前批准 Security Gate。若业务必须继续开发，只允许以“开发阶段受控例外”推进，不得进入发布候选。

