<template>
  <view class="page-header">
    <button class="back" aria-label="返回" @click="goBack(fallback)"><wd-icon name="chevron-left" size="24px" /></button>
    <text class="page-title">{{ title }}</text>
  </view>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { goBack } from '@/common/router'
withDefaults(defineProps<{ title: string; fallback?: string }>(), { fallback: '/pages/index/index' })
onMounted(() => uni.pageScrollTo({ scrollTop: 0, duration: 0 }))
</script>
<style scoped lang="scss">
.page-header { position: relative; display: flex; align-items: center; justify-content: center; min-height: 88rpx; padding-top: var(--status-bar-height, 0); color: var(--chumen-ink); }
.page-title { font-size: 32rpx; font-weight: 800; line-height: 1.2; }
.back { position: absolute; top: calc(50% + var(--status-bar-height, 0px) / 2); left: 0; display: flex; align-items: center; justify-content: center; width: 72rpx; height: 72rpx; margin: 0; padding: 0; transform: translateY(-50%); border: 2rpx solid var(--chumen-line); border-radius: 50%; background: rgba(255,255,255,.88); color: var(--chumen-ink); line-height: 1; }
</style>
