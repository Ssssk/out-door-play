<template>
  <!-- 路线/钓点详情页骨架：hero 占位 + 卡片 + 信息行 -->
  <view class="detail-skeleton" aria-hidden="true">
    <view class="hero"><view class="hero-metrics"><view class="line" /><view class="line" /><view class="line" /></view></view>
    <view class="body">
      <view class="summary-card" />
      <view class="line section-title" />
      <view v-for="index in 4" :key="index" class="info-row"><view class="line label" /><view class="line value" /></view>
      <view class="line section-title" />
      <view class="line paragraph" />
      <view class="line paragraph" />
      <view class="line paragraph short" />
    </view>
  </view>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.detail-skeleton { min-height: 100vh; background: var(--chumen-canvas); }
.hero { position: relative; height: 700rpx; background: var(--chumen-soft); }
.hero-metrics { position: absolute; right: 32rpx; bottom: 34rpx; left: 32rpx; display: flex; }
.hero-metrics .line { flex: 1; height: 30rpx; border-radius: 10rpx; background: rgba(255,255,255,.6); }
.hero-metrics .line + .line { margin-left: 20rpx; }
.body { padding: 30rpx 32rpx; }
.summary-card { height: 150rpx; margin-bottom: 30rpx; border-radius: 30rpx; background: var(--chumen-soft); }
.line { border-radius: 10rpx; background: var(--chumen-soft); animation: detail-skeleton-shimmer 1.4s ease-in-out infinite; }
.section-title { width: 180rpx; height: 32rpx; margin: 12rpx 0 20rpx; }
.info-row { display: flex; align-items: center; margin-bottom: 22rpx; }
.info-row .label { width: 150rpx; height: 26rpx; flex-shrink: 0; }
.info-row .value { flex: 1; height: 26rpx; margin-left: 20rpx; }
.paragraph { height: 26rpx; margin-bottom: 16rpx; }
.paragraph.short { width: 60%; }
@keyframes detail-skeleton-shimmer { 0%, 100% { opacity: .5 } 50% { opacity: .9 } }
</style>
