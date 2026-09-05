export class AppUpdateManager {
  static checkUpdate() {
    // #ifdef MP
    if (!uni.canIUse('getUpdateManager')) return
    const manager = uni.getUpdateManager()
    manager.onUpdateReady(() => {
      uni.showModal({
        title: '新版本已准备好', content: '需要重启应用以完成更新。', showCancel: false,
        confirmText: '立即重启', confirmColor: '#1a1a1a', success: ({ confirm }) => confirm && manager.applyUpdate(),
      })
    })
    manager.onUpdateFailed(() => uni.showToast({ title: '新版本下载失败，请稍后重试', icon: 'none' }))
    // #endif
  }
}
