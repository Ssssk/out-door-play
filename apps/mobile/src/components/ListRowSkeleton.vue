<template>
  <!-- 列表行骨架（收藏页等）：左图 + 两行文案 -->
  <view class="row-skeleton" aria-hidden="true">
    <view class="thumb" />
    <view class="copy"><view class="line title" /><view class="line subtitle" /></view>
  </view>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.row-skeleton { display: flex; align-items: center; min-height: 176rpx; margin: 0 0 22rpx; padding: 20rpx; border-radius: 26rpx; background: var(--chumen-soft); }
.thumb { width: 132rpx; height: 132rpx; flex-shrink: 0; border-radius: 24rpx; background: rgba(28,24,18,.08); }
.copy { flex: 1; min-width: 0; padding: 0 22rpx; }
.line { border-radius: 10rpx; background: rgba(28,24,18,.08); animation: row-skeleton-shimmer 1.4s ease-in-out infinite; }
.line.title { width: 62%; height: 30rpx; margin-bottom: 16rpx; }
.line.subtitle { width: 42%; height: 24rpx; }
@keyframes row-skeleton-shimmer { 0%, 100% { opacity: .5 } 50% { opacity: .9 } }
</style>
