export function getWechatLoginCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (result) => result.code ? resolve(result.code) : reject(new Error('未获取到微信登录凭证')),
      fail: () => reject(new Error('微信登录暂不可用')),
    })
  })
}

export const isWechatMiniProgram = import.meta.env.UNI_PLATFORM === 'mp-weixin'
export const isDevIdentityEnabled = import.meta.env.DEV && import.meta.env.VITE_DEV_IDENTITY_ENABLED === 'true'
