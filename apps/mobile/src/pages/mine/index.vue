<template>
  <AppShell>
    <view class="page-content mine-page">
      <view class="profile-header">
        <image class="avatar" :src="resolveAssetUrl(profile.avatarUrl)" mode="aspectFill" />
        <view class="identity"><text class="nickname">{{ profile.nickname }}</text><text class="user-label">{{ authStore.isAuthenticated ? '户外探索者 · 武汉' : '登录后同步资料与收藏' }}</text></view>
        <button v-if="authStore.isAuthenticated" class="edit-button" @click="open('/pages/mine-edit/index')">编辑 ›</button>
        <button v-else class="edit-button" :disabled="loggingIn" @click="login">{{ loggingIn ? '登录中…' : '登录' }}</button>
      </view>

      <text v-if="loadError" class="load-error" role="alert">{{ loadError }}</text>

      <view class="menu-list">
        <button class="menu-row" @click="open('/pages/favorites/index')"><view class="menu-icon red"><wd-icon name="star" size="20px" /></view><text>我的收藏</text><text class="arrow">›</text></button>
        <button class="menu-row" @click="fanDrawer = true"><view class="menu-icon green"><wd-icon name="chat" size="20px" /></view><view class="menu-copy"><text>官方粉丝群</text><text>扫码加入官方粉丝群</text></view><text class="arrow">›</text></button>
        <button class="menu-row" @click="copyContact"><view class="menu-icon green"><wd-icon name="service" size="20px" /></view><view class="menu-copy"><text>联系方式</text><text>商务合作与问题反馈</text></view><text class="arrow">›</text></button>
        <button class="menu-row" @click="open('/pages/about/index')"><view class="menu-icon green"><wd-icon name="info-circle" size="20px" /></view><text>关于粗门溜溜</text><text class="arrow">›</text></button>
        <button v-if="authStore.isAuthenticated" class="menu-row logout-row" :disabled="loggingOut" @click="logout"><view class="menu-icon red"><wd-icon name="logout" size="20px" /></view><text>{{ loggingOut ? '正在退出…' : '退出登录' }}</text></button>
      </view>
    </view>

    <wd-popup v-model="fanDrawer" position="bottom" :safe-area-inset-bottom="true" :z-index="1100" custom-style="max-width:430px;margin:0 auto;border-radius:24px 24px 0 0;">
      <view class="fan-sheet"><view class="fan-mark">CL</view><text class="fan-title">粗门溜溜官方粉丝群</text><text class="fan-tip">微信搜索「粗门溜溜」或复制群口令加入</text><button class="pill-button" @click="copyGroupCode">复制群口令</button></view>
    </wd-popup>

    <wd-popup v-model="profileDrawer" position="bottom" :safe-area-inset-bottom="true" :z-index="1100" custom-style="max-width:430px;margin:0 auto;border-radius:24px 24px 0 0;">
      <view class="profile-sheet">
        <text class="sheet-title">完善个人资料</text>
        <text class="sheet-tip">使用微信头像和昵称，收藏与打卡将同步展示</text>
        <button class="avatar-picker" open-type="chooseAvatar" :disabled="uploadingAvatar" @chooseavatar="onChooseAvatar" @click="onAvatarClick">
          <image :src="draftAvatar" mode="aspectFill" />
          <text>{{ uploadingAvatar ? '头像上传中…' : '点击使用微信头像' }}</text>
        </button>
        <input v-model="draftNickname" class="nickname-input" type="nickname" maxlength="16" placeholder="请输入昵称" @input="profileError = ''" />
        <text v-if="profileError" class="sheet-error" role="alert">{{ profileError }}</text>
        <view class="sheet-actions">
          <button class="skip-button" :disabled="savingProfile" @click="closeProfileDrawer">稍后再说</button>
          <button class="save-button" :disabled="savingProfile" :loading="savingProfile" @click="saveProfile">保存</button>
        </view>
      </view>
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
import { getWechatLoginCode, isWechatMiniProgram } from '@/common/identityProvider'
import { launchLock } from '@/common/launchLock'
import { navigate } from '@/common/router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const fanDrawer = ref(false)
const loadError = ref('')
const loggingIn = ref(false)
const loggingOut = ref(false)
const anonymousProfile = { avatarUrl: '/static/icons/avatar-mine.png', nickname: '游客' }
const profile = computed(() => authStore.profile || anonymousProfile)

const DEFAULT_AVATAR = '/static/icons/avatar-mine.png'
const profileDrawer = ref(false)
const profilePromptShown = ref(false)
const draftNickname = ref('')
const draftAvatar = ref(resolveAssetUrl(DEFAULT_AVATAR))
const pendingAvatarSaved = ref(false)
const uploadingAvatar = ref(false)
const savingProfile = ref(false)
const profileError = ref('')

onShow(async () => {
  await launchLock.waitReady()
  loadError.value = ''
  if (!authStore.isAuthenticated) return
  try { authStore.setProfile(await outdoorApi.me()) }
  catch (error) { loadError.value = userFacingError(error, '资料加载失败，请稍后重试') }
  maybePromptProfile()
})

/** 登录后资料仍是默认（默认头像或「户外玩家」占位昵称）时，自动拉起完善资料抽屉（每次登录只提示一次）。 */
function maybePromptProfile() {
  const current = authStore.profile
  if (!current || profilePromptShown.value || savingProfile.value || uploadingAvatar.value) return
  if (current.avatarUrl !== DEFAULT_AVATAR && !/^户外玩家/u.test(current.nickname)) return
  profilePromptShown.value = true
  openProfileDrawer()
}

function openProfileDrawer() {
  draftNickname.value = authStore.profile?.nickname || ''
  draftAvatar.value = resolveAssetUrl(authStore.profile?.avatarUrl || DEFAULT_AVATAR)
  pendingAvatarSaved.value = false
  profileError.value = ''
  profileDrawer.value = true
}

function closeProfileDrawer() {
  if (savingProfile.value || uploadingAvatar.value) return
  profileDrawer.value = false
}

function onAvatarClick() {
  // 微信小程序内由 open-type="chooseAvatar" 接管；其他环境给出提示。
  if (!isWechatMiniProgram) uni.showToast({ title: '请在微信小程序中更换头像', icon: 'none' })
}

async function onChooseAvatar(event: { detail?: { avatarUrl?: string } }) {
  const tempPath = event.detail?.avatarUrl
  if (!tempPath || uploadingAvatar.value) return
  uploadingAvatar.value = true
  profileError.value = ''
  try {
    const updated = await outdoorApi.uploadAvatar(tempPath)
    authStore.setProfile(updated)
    draftAvatar.value = resolveAssetUrl(updated.avatarUrl)
    pendingAvatarSaved.value = true
  } catch (cause) {
    profileError.value = userFacingError(cause, '头像上传失败，请稍后重试')
  } finally {
    uploadingAvatar.value = false
  }
}

async function saveProfile() {
  const nickname = draftNickname.value.trim()
  if (!nickname) { profileError.value = '昵称不能为空'; return }
  if (nickname.length > 16) { profileError.value = '昵称不能超过 16 个字'; return }
  savingProfile.value = true
  profileError.value = ''
  try {
    const updated = await outdoorApi.saveMe({ nickname, avatarUrl: authStore.profile?.avatarUrl })
    authStore.setProfile(updated)
    profileDrawer.value = false
    uni.showToast({ title: pendingAvatarSaved.value ? '资料已保存' : '昵称已保存', icon: 'success' })
  } catch (cause) {
    profileError.value = userFacingError(cause, '保存失败，请稍后重试')
  } finally {
    savingProfile.value = false
  }
}

function open(path: string) { void navigate(path) }

/** 点「登录」直接静默 wx.login，成功后刷新资料并弹出完善资料抽屉，不再跳转登录页。 */
async function login() {
  if (loggingIn.value) return
  loggingIn.value = true
  try {
    await authStore.loginWithWechat(await getWechatLoginCode())
    authStore.setProfile(await outdoorApi.me())
    profilePromptShown.value = false
    maybePromptProfile()
  } catch (cause) {
    uni.showToast({ title: userFacingError(cause, '登录失败，请重试'), icon: 'none' })
  } finally {
    loggingIn.value = false
  }
}
async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try { await authStore.logout() }
  finally { loggingOut.value = false }
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
.profile-sheet { display: flex; flex-direction: column; align-items: center; padding: 48rpx 40rpx 36rpx; text-align: center; }.sheet-title { font-size: 34rpx; font-weight: 900; }.sheet-tip { margin: 12rpx 0 30rpx; color: var(--chumen-muted); font-size: 24rpx; }
.avatar-picker { display: flex; flex-direction: column; align-items: center; width: 100%; margin-bottom: 30rpx; padding: 0; border: 0; background: transparent; color: var(--chumen-muted); font-size: 23rpx; line-height: 1.4; }.avatar-picker::after { border: 0; }.avatar-picker image { width: 144rpx; height: 144rpx; margin-bottom: 14rpx; border: 8rpx solid var(--chumen-lime); border-radius: 50%; }
.nickname-input { width: 100%; min-height: 88rpx; padding: 0 24rpx; border: 2rpx solid var(--chumen-line); border-radius: 18rpx; background: var(--chumen-soft); font-size: 28rpx; text-align: center; }.sheet-error { margin-top: 12rpx; color: #d83b42; font-size: 23rpx; }
.sheet-actions { display: flex; gap: 20rpx; width: 100%; margin-top: 30rpx; }.skip-button { flex: 1; min-height: 84rpx; margin: 0; border-radius: 999rpx; background: var(--chumen-soft); color: var(--chumen-muted); font-size: 27rpx; line-height: 84rpx; }.save-button { flex: 1; min-height: 84rpx; margin: 0; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 27rpx; font-weight: 800; line-height: 84rpx; }.save-button[disabled] { opacity: .6; }
.load-error { display: block; margin: -10rpx 0 18rpx; color: #d83b42; font-size: 23rpx; }.logout-row { justify-content: flex-start; color: #c53b42; }.logout-row[disabled] { opacity: .6; }
</style>
