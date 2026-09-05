<template>
  <AppShell>
    <view class="page-content login-page">
      <PageHeader title="登录" fallback="/pages/mine/index" />
      <view class="brand-mark">CL</view>
      <text class="title">登录粗门溜溜</text>
      <text class="subtitle">登录后可同步个人资料与收藏。我们不会在客户端保存服务端密钥。</text>

      <button v-if="isWechatMiniProgram" class="primary" :disabled="submitting" :loading="submitting" @click="loginWechat">
        微信快捷登录
      </button>

      <view v-if="isDevIdentityEnabled" class="dev-card card-surface">
        <text class="dev-title">开发环境身份</text>
        <input v-model="devHandle" maxlength="64" placeholder="输入开发身份，例如 local-dev-user" @input="error = ''" />
        <button class="primary" :disabled="submitting" :loading="submitting" @click="loginDev">开发身份登录</button>
      </view>

      <view v-if="!isWechatMiniProgram && !isDevIdentityEnabled" class="unsupported card-surface">
        当前环境未提供登录方式，请在微信小程序中打开。
      </view>
      <text v-if="error" class="error" role="alert">{{ error }}</text>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppShell from '@/components/AppShell.vue'
import PageHeader from '@/components/PageHeader.vue'
import { userFacingError } from '@/common/apiErrors'
import { getWechatLoginCode, isDevIdentityEnabled, isWechatMiniProgram } from '@/common/identityProvider'
import { redirectAfterLogin } from '@/common/router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const devHandle = ref('local-dev-user')
const submitting = ref(false)
const error = ref('')
let returnTo: unknown

onLoad((query) => { returnTo = query?.returnTo })

async function submit(action: () => Promise<void>) {
  if (submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    await action()
    await redirectAfterLogin(returnTo)
  } catch (cause) {
    error.value = userFacingError(cause, '登录失败，请重试')
  } finally {
    submitting.value = false
  }
}

function loginWechat() {
  void submit(async () => authStore.loginWithWechat(await getWechatLoginCode()))
}

function loginDev() {
  const handle = devHandle.value.trim()
  if (!/^[A-Za-z0-9_-]{1,64}$/u.test(handle)) {
    error.value = '开发身份只能包含字母、数字、下划线或连字符'
    return
  }
  void submit(() => authStore.loginWithDev(handle))
}
</script>

<style scoped lang="scss">
.login-page { display: flex; flex-direction: column; align-items: stretch; text-align: center; }
.brand-mark { display: flex; align-items: center; justify-content: center; width: 144rpx; height: 144rpx; margin: 86rpx auto 28rpx; border-radius: 38rpx; background: var(--chumen-lime); color: var(--chumen-ink); font-size: 44rpx; font-weight: 900; }
.title { color: var(--chumen-ink); font-size: 42rpx; font-weight: 900; }.subtitle { margin: 18rpx 24rpx 56rpx; color: var(--chumen-muted); font-size: 25rpx; line-height: 1.7; }
.primary { width: 100%; min-height: 88rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 29rpx; font-weight: 800; line-height: 88rpx; }.primary[disabled] { opacity: .6; }
.dev-card { padding: 30rpx; text-align: left; }.dev-title { display: block; margin-bottom: 18rpx; font-size: 26rpx; font-weight: 800; }.dev-card input { min-height: 82rpx; margin-bottom: 22rpx; padding: 0 22rpx; border: 2rpx solid var(--chumen-line); border-radius: 18rpx; background: var(--chumen-soft); }
.unsupported { padding: 34rpx; color: var(--chumen-muted); font-size: 25rpx; line-height: 1.6; }.error { margin-top: 24rpx; color: #d83b42; font-size: 24rpx; }
</style>
