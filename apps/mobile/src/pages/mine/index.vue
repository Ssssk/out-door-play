<template>
  <AppShell>
    <view class="page-content mine-page">
      <view class="profile-header">
        <image class="avatar" :src="profile.avatarUrl" mode="aspectFill" />
        <view class="identity"><text class="nickname">{{ profile.nickname }}</text><text class="user-label">{{ authStore.isAuthenticated ? '户外探索者 · 武汉' : '登录后同步资料与收藏' }}</text></view>
        <button v-if="authStore.isAuthenticated" class="edit-button" @click="open('/pages/mine-edit/index')">编辑 ›</button>
        <button v-else class="edit-button" @click="login">登录</button>
      </view>

      <text v-if="loadError" class="load-error" role="alert">{{ loadError }}</text>

      <view class="stats-card">
        <view><text class="stat-value">{{ profile.stats.mileage }}</text><text class="stat-label">累计公里</text></view>
        <view><text class="stat-value">{{ profile.stats.favorites }}</text><text class="stat-label">我的收藏</text></view>
        <view><text class="stat-value">{{ profile.stats.checkins }}</text><text class="stat-label">出行打卡</text></view>
      </view>

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
  </AppShell>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import { outdoorApi } from '@/api/outdoor'
import { userFacingError } from '@/common/apiErrors'
import { launchLock } from '@/common/launchLock'
import { navigate } from '@/common/router'
import { requireAuth } from '@/common/requireAuth'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const fanDrawer = ref(false)
const loadError = ref('')
const loggingOut = ref(false)
const anonymousProfile = { avatarUrl: '/static/icons/avatar-mine.png', nickname: '游客', stats: { mileage: 0, favorites: 0, checkins: 0 } }
const profile = computed(() => authStore.profile || anonymousProfile)

onShow(async () => {
  await launchLock.waitReady()
  loadError.value = ''
  if (!authStore.isAuthenticated) return
  try { authStore.setProfile(await outdoorApi.me()) }
  catch (error) { loadError.value = userFacingError(error, '资料加载失败，请稍后重试') }
})

function open(path: string) { void navigate(path) }
function login() { void requireAuth('/pages/mine/index') }
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
.stats-card { display: flex; margin: 28rpx 0; padding: 30rpx 12rpx; border: 2rpx solid var(--chumen-line); border-radius: 32rpx; background: #fff; }.stats-card > view { flex: 1; text-align: center; }.stats-card > view + view { border-left: 2rpx solid var(--chumen-line); }.stat-value,.stat-label { display: block; }.stat-value { color: var(--chumen-ink); font-size: 34rpx; font-weight: 900; }.stat-label { margin-top: 6rpx; color: var(--chumen-muted); font-size: 21rpx; }
.menu-list { margin-top: 20rpx; }.menu-row { display: flex; align-items: center; width: 100%; min-height: 134rpx; margin: 0 0 22rpx; padding: 20rpx 28rpx; border: 2rpx solid var(--chumen-line); border-radius: 28rpx; background: #fff; color: var(--chumen-ink); font-size: 28rpx; text-align: left; line-height: 1.3; }
.menu-icon { display: flex; align-items: center; justify-content: center; width: 72rpx; height: 72rpx; margin-right: 24rpx; border-radius: 20rpx; }.menu-icon.red { background: #ffe7e8; color: #ef5d66; }.menu-icon.green { background: #ddf6e8; color: #1b8f62; }
.menu-copy { flex: 1; }.menu-copy text { display: block; }.menu-copy text:last-child { margin-top: 8rpx; color: var(--chumen-muted); font-size: 22rpx; }.arrow { margin-left: auto; color: var(--chumen-muted); font-size: 38rpx; }
.fan-sheet { display: flex; flex-direction: column; align-items: center; padding: 52rpx 40rpx 36rpx; text-align: center; }.fan-mark { display: flex; align-items: center; justify-content: center; width: 132rpx; height: 132rpx; border-radius: 34rpx; background: var(--chumen-lime); color: var(--chumen-ink); font-size: 44rpx; font-weight: 900; }.fan-title { margin-top: 24rpx; font-size: 34rpx; font-weight: 900; }.fan-tip { margin: 14rpx 0 32rpx; color: var(--chumen-muted); font-size: 24rpx; }
.load-error { display: block; margin: -10rpx 0 18rpx; color: #d83b42; font-size: 23rpx; }.logout-row { justify-content: flex-start; color: #c53b42; }.logout-row[disabled] { opacity: .6; }
</style>
