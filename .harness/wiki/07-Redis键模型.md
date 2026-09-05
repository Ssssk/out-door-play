# Redis 键模型

| 用途 | Key 模式 | 类型 | TTL | 一致性 |
|---|---|---|---|---|
| 用户会话 | `{env}:{app}:identity:session:{sid}:v1` | Hash/String | ≤令牌寿命 | 撤销优先 |
| 用户摘要缓存 | `{env}:{app}:user:profile:{userId}:v1` | String JSON | 5~30 分钟+抖动 | cache-aside |
| 幂等结果 | `{env}:{app}:idem:{scope}:{key}:v1` | String | 业务窗口 | 原子占位 |
| 限流 | `{env}:{app}:rate:{subject}:{route}:v1` | String/ZSet | 窗口期 | 原子脚本 |
| 短期锁 | `{env}:{app}:lock:{resource}:v1` | String | 短租约 | token 校验 |

TTL 是建议区间，具体值必须根据陈旧容忍、流量、内存和恢复成本在 Change 中确定。Key payload 发生不兼容变化时升级尾部版本，旧版本按 TTL 自然淘汰或显式清理。
