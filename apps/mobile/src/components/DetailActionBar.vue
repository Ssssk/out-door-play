<template>
  <view class="action-bar safe-bottom">
    <button class="round-action" :class="{ favorite }" aria-label="收藏" @click="$emit('favorite')"><wd-icon :name="favorite ? 'heart-filled' : 'heart'" size="22px" /></button>
    <button class="round-action" open-type="share" aria-label="分享" @click="$emit('share')"><wd-icon name="share" size="22px" /></button>
    <button class="start-action" @click="$emit('start')">{{ startLabel }}</button>
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ favorite: boolean; startLabel?: string }>(), { startLabel: '前往出发地' })
defineEmits<{ favorite: []; share: []; start: [] }>()
</script>
<style scoped lang="scss">
.action-bar { position: fixed; z-index: 20; right: 0; bottom: 0; left: 0; display: flex; align-items: center; width: 100%; max-width: 430px; margin: 0 auto; padding: 18rpx 32rpx calc(18rpx + env(safe-area-inset-bottom)); border-top: 2rpx solid var(--chumen-line); background: rgba(255,254,249,.96); }
.round-action { width: 80rpx; min-width: 80rpx; height: 80rpx; margin: 0 12rpx 0 0; padding: 0; border: 2rpx solid var(--chumen-line); border-radius: 50%; background: #fff; color: var(--chumen-ink); font-size: 42rpx; line-height: 78rpx; }
.round-action.favorite { color: #f2545b; }
.start-action { flex: 1; min-height: 80rpx; padding: 0; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 28rpx; font-weight: 800; line-height: 80rpx; }
</style>
