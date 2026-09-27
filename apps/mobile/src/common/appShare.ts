import { onShareAppMessage } from '@dcloudio/uni-app'

/**
 * 页面级「转发给朋友」统一注册。定义后小程序右上角菜单即开启分享。
 * 全站除「我的」tab 外每个页面都使用；分享回落地页时可带参数做来源追踪。
 */
export function useAppShare(title: string, path: string) {
  onShareAppMessage(() => ({ title, path }))
}
