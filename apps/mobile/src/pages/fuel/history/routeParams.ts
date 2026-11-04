/**
 * 小程序 `onLoad` 的 query 在不同基础库里可能是「已编码的原始串」或「已解码串」，
 * 统一解码一次，避免页面标题显示 %E6% 乱码、请求参数被二次编码成 %25。
 * 非法转义或非字符串安全回退，不抛错。
 */
export function decodeQueryParam(value: unknown): string {
  const raw = typeof value === 'string' ? value : ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
