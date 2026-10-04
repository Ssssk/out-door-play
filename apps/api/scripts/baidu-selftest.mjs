// 部署自检：在 api 容器内验证百度密钥注入、SN 签名与服务器出网。
// 只输出密钥长度/指纹与百度返回状态，绝不输出密钥明文。
// 用法（宿主机）：docker compose --env-file .env.production -f compose.prod.yaml exec -T api node < apps/api/scripts/baidu-selftest.mjs
import { createHash } from 'node:crypto'

const percentEncode = (v) =>
  encodeURIComponent(v).replace(/!/g, '%21').replace(/\*/g, '%2A')
    .replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')

const ak = process.env.BAIDU_MAP_AK ?? ''
const sk = process.env.BAIDU_MAP_SK ?? ''
const fp = (v) => (v ? createHash('md5').update(v, 'utf8').digest('hex').slice(0, 8) : '(空)')
console.log(`[selftest] BAIDU_MAP_AK 长度=${ak.length} md5前8=${fp(ak)}`)
console.log(`[selftest] BAIDU_MAP_SK 长度=${sk.length} md5前8=${fp(sk)}`)

if (!ak || !sk) {
  console.log('[selftest] 结论: 密钥未注入(环境变量为空) → 检查 GitHub Secrets 与部署 env 注入')
  process.exit(0)
}

// 天气查询接口参数全为 ASCII，可同时验证「SN 校验 + 服务器出网」两条链路：
// status=0 → 密钥/签名/出网全部正常；211=SK 不匹配；210=AK 非法；其他=服务未开通等（但签名已通过）
const path = '/weather/v1/weather'
const params = { ak, data_type: 'all', district_id: '420100' }
const keys = Object.keys(params).sort()
const query = keys.map((k) => `${k}=${percentEncode(params[k])}`).join('&')
const sn = createHash('md5').update(encodeURIComponent(`${path}?${query}${sk}`), 'utf8').digest('hex')
try {
  const res = await fetch(`https://api.map.baidu.com${path}?${query}&sn=${sn}`, { signal: AbortSignal.timeout(15000) })
  const text = await res.text()
  console.log(`[selftest] HTTP 状态=${res.status} content-type=${res.headers.get('content-type') ?? '-'}`)
  console.log(`[selftest] 响应前400字符: ${text.slice(0, 400).replace(/\s+/g, ' ')}`)
  // 对照:正常应是 {"status":0,...} 或服务未开通类 JSON;若是 HTML/代理报错/DNS 劫持页,这里会直接暴露
} catch (err) {
  console.log(`[selftest] 请求异常: ${err?.message ?? err} → 服务器出网到 api.map.baidu.com 失败`)
  try {
    const probe = await fetch('https://www.baidu.com', { signal: AbortSignal.timeout(10000) })
    console.log(`[selftest] 对照探测 www.baidu.com: HTTP ${probe.status}(通则说明仅 api.map.baidu.com 被拦,不通则整机出网异常)`)
  } catch (err2) {
    console.log(`[selftest] 对照探测 www.baidu.com 也失败: ${err2?.message ?? err2}`)
  }
}
