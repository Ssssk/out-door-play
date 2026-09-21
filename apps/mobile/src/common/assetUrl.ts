import { apiBaseUrl } from '@/common/request'

const ASSET_ORIGIN = apiBaseUrl.replace(/\/v1\/?$/u, '')

/** 把服务端相对路径（如 /v1/uploads/...）拼成完整 URL；http(s)、/static/、本地临时路径原样返回。 */
export function resolveAssetUrl(url: string | undefined): string {
  if (!url) return ''
  if (/^(https?:)?\/\//u.test(url) || url.startsWith('/static/') || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('file:') || url.startsWith('wxfile:')) {
    return url
  }
  return `${ASSET_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`
}
