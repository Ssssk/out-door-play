// 部署自检：在 api 容器内验证高德 Key 注入、接口可达性与服务器出网。
// 只输出密钥长度/指纹与数据源返回状态，绝不输出密钥明文。
// 用法（宿主机）：docker compose --env-file .env.production -f compose.prod.yaml exec -T api node < apps/api/scripts/baidu-selftest.mjs
import { createHash } from 'node:crypto'
import dns from 'node:dns/promises'

const fp = (v) => (v ? createHash('md5').update(v, 'utf8').digest('hex').slice(0, 8) : '(空)')
const amapKey = process.env.AMAP_MAP_KEY?.trim() ?? ''
const baiduAk = process.env.BAIDU_MAP_AK?.trim() ?? ''
console.log(`[selftest] AMAP_MAP_KEY 长度=${amapKey.length} md5前8=${fp(amapKey)}`)
console.log(`[selftest] BAIDU_MAP_AK 长度=${baiduAk.length} md5前8=${fp(baiduAk)}`)

if (!amapKey) {
  console.log('[selftest] 结论: AMAP_MAP_KEY 未注入 → 高德站点同步与天气都会降级/跳过，检查 GitHub Secrets')
}

// 多目标探测：判断出口网关放行策略（服务器网络曾单独劫持 api.map.baidu.com → [E1002]）
const addrs = await dns.lookup('api.map.baidu.com', { all: true }).catch(() => [])
console.log(`[selftest] 容器内解析 api.map.baidu.com → ${addrs.map((a) => a.address).join(', ') || '失败'}`)

const probes = [
  ['www.baidu.com', 'https://www.baidu.com/'],
  ['api.weixin.qq.com(小程序登录依赖)', 'https://api.weixin.qq.com/sns/jscode2session'],
  ['restapi.amap.com 加油站检索(主用)', `https://restapi.amap.com/v3/place/text?key=${amapKey || 'MISSING'}&keywords=%E5%8A%A0%E6%B2%B9%E7%AB%99&city=450200&citylimit=true&offset=3&page=1`],
  ['restapi.amap.com 天气(主用)', `https://restapi.amap.com/v3/weather/weatherInfo?key=${amapKey || 'MISSING'}&city=420100&extensions=base`],
  ['api.map.baidu.com(旧源对照)', 'https://api.map.baidu.com/place/v2/search?query=test'],
]
for (const [label, url] of probes) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const text = (await res.text()).slice(0, 120).replace(/\s+/g, ' ')
    console.log(`[probe] ${label} → HTTP ${res.status} | ${text}`)
  } catch (err) {
    console.log(`[probe] ${label} → 异常: ${err?.message ?? err}`)
  }
}
