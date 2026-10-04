import { createHash } from 'node:crypto'

/**
 * 百度 WebService API 签名与请求构造（地点检索 / 天气查询共用）。
 *
 * 百度 SN 校验算法（与腾讯不同，曾因混淆导致 `status:211`）：
 * `sn = md5( encodeURIComponent( path + "?" + 参数升序(值已 percentEncode)拼接 + SK ) )`。
 * 即——参与签名的参数值要先 percentEncode，且拼接后的整串**还要再整体 encodeURIComponent** 一次才 md5。
 * 腾讯则是原始值、不整体编码直接 md5，二者不可混用。
 */

/** 百度要求发送参数值做特定 urlencode（与 SN 计算一致） */
export function percentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/!/g, '%21').replace(/\*/g, '%2A').replace(/'/g, '%27')
    .replace(/\(/g, '%28').replace(/\)/g, '%29')
}

/** 拼百度查询串（逐值 percentEncode） */
export function toBaiduQuery(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${percentEncode(v)}`)
    .join('&')
}

/** 百度 SN 校验签名 */
export function calcBaiduSn(path: string, params: Record<string, string>, sk: string): string {
  const keys = Object.keys(params).sort()
  const query = keys.map((k) => `${k}=${percentEncode(params[k])}`).join('&')
  const raw = path + '?' + query + sk
  return createHash('md5').update(encodeURIComponent(raw), 'utf8').digest('hex')
}
