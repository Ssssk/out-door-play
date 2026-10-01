import { createHash } from 'node:crypto'

/**
 * 腾讯位置服务 SN 校验签名：`md5(请求路径 + "?" + 参数名升序的 key=value 拼接 + SK)`。
 *
 * 官方要点（2026-10 核对 https://lbs.qq.com/faq/serverFaq/webServiceKey）：
 * - 参与签名的必须是**未经 urlencode 的原始值**，发送时才逐值 urlencode，两者不能混用；
 * - 路径如 `/ws/place/v1/search`、`/ws/weather/v1`，末尾是否带 `/` 均可，但必须与实际请求一致；
 * - `sig` 本身不参与计算（先算 sig，再附加到请求参数里）。
 *
 * 加油站（地点搜索）与天气查询共用本实现，避免两处各写一份 md5 拼接。
 */
export function buildSignature(path: string, params: Record<string, string>, secretKey: string): string {
  const rawQuery = Object.entries(params)
    // 参数名按字母升序（a→z），与官方要求一致
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([name, value]) => `${name}=${value}`)
    .join('&')
  return createHash('md5').update(`${path}?${rawQuery}${secretKey}`, 'utf8').digest('hex')
}

/** 控制台开启 SN 校验后下发的 SecretKey；未配置表示该 key 未启用签名校验 */
export function tencentMapSecret(): string {
  return (process.env.TENCENT_MAP_SECRET ?? '').trim()
}

/** 逐值 urlencode 拼查询串（签名用原始值，发送用编码值） */
export function buildTencentUrl(baseUrl: string, path: string, params: Record<string, string>): string {
  const query = Object.entries(params)
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('&')
  return `${baseUrl}${path}?${query}`
}
