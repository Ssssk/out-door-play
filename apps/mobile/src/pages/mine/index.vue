<template>
  <AppShell>
    <view class="page-content mine-page">
      <view class="profile-header">
        <button v-if="authStore.isAuthenticated" class="avatar avatar-button" open-type="chooseAvatar" :disabled="uploadingAvatar" @chooseavatar="onChooseAvatar">
          <image :src="resolveAssetUrl(profile.avatarUrl)" mode="aspectFill" />
        </button>
        <image v-else class="avatar" :src="resolveAssetUrl(profile.avatarUrl)" mode="aspectFill" />
        <view class="identity"><text class="nickname">{{ profile.nickname }}</text><text v-if="!authStore.isAuthenticated" class="user-label">登录后同步资料与收藏</text></view>
        <button v-if="authStore.isAuthenticated" class="edit-button" @click="open('/pages/mine-edit/index')">编辑 ›</button>
        <button v-else class="edit-button" :disabled="loggingIn" @click="login">{{ loggingIn ? '登录中…' : '登录' }}</button>
      </view>

      <text v-if="loadError" class="load-error" role="alert">{{ loadError }}</text>

      <view class="menu-list">
        <button class="menu-row" @click="open('/pages/favorites/index')"><view class="menu-icon red"><wd-icon name="star" size="20px" /></view><text>我的收藏</text><text class="arrow">›</text></button>
        <button class="menu-row" @click="fanDrawer = true"><view class="menu-icon green"><wd-icon name="chat" size="20px" /></view><view class="menu-copy"><text>官方粉丝群</text><text>扫码加入官方粉丝群</text></view><text class="arrow">›</text></button>
        <button class="menu-row" @click="copyContact"><view class="menu-icon green"><wd-icon name="service" size="20px" /></view><view class="menu-copy"><text>联系方式</text><text>商务合作与问题反馈</text></view><text class="arrow">›</text></button>
        <button class="menu-row" @click="open('/pages/about/index')"><view class="menu-icon green"><wd-icon name="info-circle" size="20px" /></view><text>关于粗门溜溜</text><text class="arrow">›</text></button>
      </view>
    </view>

    <wd-popup v-model="fanDrawer" position="bottom" :safe-area-inset-bottom="true" :z-index="1100" custom-style="max-width:430px;margin:0 auto;border-radius:24px 24px 0 0;">
      <view class="fan-sheet"><view class="fan-mark">CL</view><text class="fan-title">粗门溜溜官方粉丝群</text><text class="fan-tip">微信搜索「粗门溜溜」或复制群口令加入</text><button class="pill-button" @click="copyGroupCode">复制群口令</button></view>
    </wd-popup>
  </AppShell>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import { outdoorApi } from '@/api/outdoor'
import { resolveAssetUrl } from '@/common/assetUrl'
import { userFacingError } from '@/common/apiErrors'
import { getWechatLoginCode } from '@/common/identityProvider'
import { launchLock } from '@/common/launchLock'
import { navigate } from '@/common/router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const fanDrawer = ref(false)
const loadError = ref('')
const loggingIn = ref(false)
const anonymousProfile = { avatarUrl: '/static/icons/avatar-mine.png', nickname: '游客' }
const profile = computed(() => authStore.profile || anonymousProfile)

const DEFAULT_AVATAR = '/static/icons/avatar-mine.png'
const uploadingAvatar = ref(false)

onShow(async () => {
  await launchLock.waitReady()
  loadError.value = ''
  if (!authStore.isAuthenticated) return
  try { authStore.setProfile(await outdoorApi.me()) }
  catch (error) { loadError.value = userFacingError(error, '资料加载失败，请稍后重试') }
})

async function onChooseAvatar(event: { detail?: { avatarUrl?: string } }) {
  const tempPath = event.detail?.avatarUrl
  if (!tempPath || uploadingAvatar.value) return
  uploadingAvatar.value = true
  try {
    const updated = await outdoorApi.uploadAvatar(tempPath)
    authStore.setProfile(updated)
    uni.showToast({ title: '头像已更新', icon: 'success' })
  } catch (cause) {
    uni.showToast({ title: userFacingError(cause, '头像上传失败，请稍后重试'), icon: 'none' })
  } finally {
    uploadingAvatar.value = false
  }
}

function open(path: string) { void navigate(path) }

/** 点「登录」直接静默 wx.login；登录后若资料仍是默认，提示点头像换微信头像（原生弹窗须由用户点击触发）。 */
async function login() {
  if (loggingIn.value) return
  loggingIn.value = true
  try {
    await authStore.loginWithWechat(await getWechatLoginCode())
    authStore.setProfile(await outdoorApi.me())
    const current = authStore.profile
    if (current && (current.avatarUrl === DEFAULT_AVATAR || /^户外玩家/u.test(current.nickname))) {
      uni.showToast({ title: '点击头像可使用微信头像', icon: 'none', duration: 2500 })
    }
  } catch (cause) {
    uni.showToast({ title: userFacingError(cause, '登录失败，请重试'), icon: 'none' })
  } finally {
    loggingIn.value = false
  }
}
function copy(value: string, title: string) { uni.setClipboardData({ data: value, success: () => uni.showToast({ title, icon: 'none' }) }) }
function copyContact() { copy('chumen-liuliu', '联系方式已复制') }
function copyGroupCode() { copy('粗门溜溜-武汉户外', '群口令已复制'); fanDrawer.value = false }
</script>

<style scoped lang="scss">
.mine-page { padding-top: calc(var(--chumen-top-inset, var(--status-bar-height, 0px)) + 58rpx); }
.profile-header { display: flex; align-items: center; padding: 24rpx 6rpx; }.avatar { width: 128rpx; height: 128rpx; border-radius: 50%; background: var(--chumen-lime); }
.identity { flex: 1; min-width: 0; padding: 0 24rpx; }.nickname,.user-label { display: block; }.nickname { color: var(--chumen-ink); font-size: 36rpx; font-weight: 900; }.user-label { margin-top: 8rpx; color: var(--chumen-muted); font-size: 22rpx; }
.edit-button { min-width: 132rpx; min-height: 68rpx; margin: 0; padding: 0 24rpx; border-radius: 999rpx; background: var(--chumen-ink); color: #fff; font-size: 24rpx; line-height: 68rpx; }
.menu-list { margin-top: 20rpx; }.menu-row { display: flex; align-items: center; width: 100%; min-height: 134rpx; margin: 0 0 22rpx; padding: 20rpx 28rpx; border: 2rpx solid var(--chumen-line); border-radius: 28rpx; background: #fff; color: var(--chumen-ink); font-size: 28rpx; text-align: left; line-height: 1.3; }
.menu-icon { display: flex; align-items: center; justify-content: center; width: 72rpx; height: 72rpx; margin-right: 24rpx; border-radius: 20rpx; }.menu-icon.red { background: #ffe7e8; color: #ef5d66; }.menu-icon.green { background: #ddf6e8; color: #1b8f62; }
.menu-copy { flex: 1; }.menu-copy text { display: block; }.menu-copy text:last-child { margin-top: 8rpx; color: var(--chumen-muted); font-size: 22rpx; }.arrow { margin-left: auto; color: var(--chumen-muted); font-size: 38rpx; }
.fan-sheet { display: flex; flex-direction: column; align-items: center; padding: 52rpx 40rpx 36rpx; text-align: center; }.fan-mark { display: flex; align-items: center; justify-content: center; width: 132rpx; height: 132rpx; border-radius: 34rpx; background: var(--chumen-lime); color: var(--chumen-ink); font-size: 44rpx; font-weight: 900; }.fan-title { margin-top: 24rpx; font-size: 34rpx; font-weight: 900; }.fan-tip { margin: 14rpx 0 32rpx; color: var(--chumen-muted); font-size: 24rpx; }
.load-error { display: block; margin: -10rpx 0 18rpx; color: #d83b42; font-size: 23rpx; }
.avatar-button { margin: 0; padding: 0; border: 0; border-radius: 50%; background: transparent; line-height: 1; }.avatar-button::after { border: 0; }.avatar-button image { display: block; width: 128rpx; height: 128rpx; border-radius: 50%; background: var(--chumen-lime); }
</style>
