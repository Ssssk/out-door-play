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
  const data = await res.json()
  console.log(`[selftest] 百度天气查询返回: status=${data.status} message=${data.message ?? '-'}`)
} catch (err) {
  console.log(`[selftest] 请求异常: ${err?.message ?? err} → 服务器出网到 api.map.baidu.com 失败`)
}
