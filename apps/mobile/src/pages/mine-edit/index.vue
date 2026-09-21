<template>
  <AppShell>
    <view class="page-content edit-page">
      <PageHeader title="编辑资料" fallback="/pages/mine/index" />

      <button class="avatar-picker" open-type="chooseAvatar" :disabled="uploadingAvatar" @chooseavatar="onChooseAvatar" @click="onAvatarClick">
        <image :src="avatarUrl" mode="aspectFill" />
        <text>{{ uploadingAvatar ? '头像上传中…' : '点击使用微信头像' }}</text>
      </button>

      <view class="form-card card-surface">
        <text class="label">昵称</text>
        <input v-model="nickname" class="nickname-input" type="nickname" maxlength="16" placeholder="请输入昵称" @input="error = ''" />
        <view class="input-meta"><text class="error">{{ error }}</text><text>{{ nickname.length }}/16</text></view>
      </view>

      <button class="save-button" :disabled="saving" :loading="saving" @click="save">保存</button>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import PageHeader from '@/components/PageHeader.vue'
import { resolveAssetUrl } from '@/common/assetUrl'
import { goBack } from '@/common/router'
import { outdoorApi } from '@/api/outdoor'
import { userFacingError } from '@/common/apiErrors'
import { isWechatMiniProgram } from '@/common/identityProvider'
import { requireAuth } from '@/common/requireAuth'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const nickname = ref(authStore.profile?.nickname || '')
const avatarUrl = ref(resolveAssetUrl(authStore.profile?.avatarUrl || '/static/icons/avatar-mine.png'))
const error = ref('')
const saving = ref(false)
const uploadingAvatar = ref(false)

onShow(async () => {
  if (!await requireAuth()) return
  nickname.value = authStore.profile?.nickname || ''
  avatarUrl.value = resolveAssetUrl(authStore.profile?.avatarUrl || '/static/icons/avatar-mine.png')
})

function onAvatarClick() {
  // 微信小程序内由 open-type="chooseAvatar" 接管；其他环境给出提示。
  if (!isWechatMiniProgram) uni.showToast({ title: '请在微信小程序中更换头像', icon: 'none' })
}

async function onChooseAvatar(event: { detail?: { avatarUrl?: string } }) {
  const tempPath = event.detail?.avatarUrl
  if (!tempPath || uploadingAvatar.value) return
  uploadingAvatar.value = true
  error.value = ''
  try {
    const profile = await outdoorApi.uploadAvatar(tempPath)
    authStore.setProfile(profile)
    avatarUrl.value = resolveAssetUrl(profile.avatarUrl)
    uni.showToast({ title: '头像已更新', icon: 'success' })
  } catch (cause) {
    error.value = userFacingError(cause, '头像上传失败，请稍后重试')
  } finally {
    uploadingAvatar.value = false
  }
}

async function save() {
  const value = nickname.value.trim()
  if (!value) { error.value = '昵称不能为空'; return }
  if (value.length > 16) { error.value = '昵称不能超过 16 个字'; return }
  saving.value = true
  try {
    const profile = await outdoorApi.saveMe({ nickname: value, avatarUrl: authStore.profile?.avatarUrl })
    authStore.setProfile(profile)
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => goBack('/pages/mine/index'), 400)
  } catch (cause) {
    error.value = userFacingError(cause, '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.edit-page { min-height: 100vh; padding-bottom: 190rpx; }.avatar-picker { display: flex; flex-direction: column; align-items: center; width: 100%; margin: 70rpx 0 48rpx; padding: 0; border: 0; background: transparent; box-shadow: none; color: var(--chumen-muted); font-size: 24rpx; line-height: 1.4; }.avatar-picker::after { border: 0; }.avatar-picker image { width: 156rpx; height: 156rpx; margin-bottom: 18rpx; border: 8rpx solid var(--chumen-lime); border-radius: 50%; }
.form-card { padding: 28rpx 30rpx; margin-bottom: 26rpx; }.label { display: block; margin-bottom: 18rpx; font-size: 26rpx; font-weight: 800; }.nickname-input { min-height: 90rpx; padding: 0 22rpx; border: 2rpx solid var(--chumen-line); border-radius: 18rpx; background: var(--chumen-soft); font-size: 28rpx; }.input-meta { display: flex; justify-content: space-between; min-height: 42rpx; margin-top: 10rpx; color: var(--chumen-muted); font-size: 22rpx; }.error { color: #e5484d; }
.save-button { position: fixed; right: 0; bottom: calc(28rpx + env(safe-area-inset-bottom)); left: 0; width: calc(100% - 64rpx); max-width: 398px; min-height: 88rpx; margin: 0 auto; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 30rpx; font-weight: 800; line-height: 88rpx; }.save-button[disabled] { opacity: .6; }
</style>
