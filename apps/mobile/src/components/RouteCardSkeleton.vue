<template>
  <!-- 与 DiscoveryCard 同尺寸的骨架卡：首屏无数据时占位，避免转圈+空白 -->
  <view class="discovery-card skeleton" aria-hidden="true">
    <view class="shade" />
    <view class="card-top"><view class="pill" /></view>
    <view class="card-bottom">
      <view class="line title" />
      <view class="metrics">
        <view v-for="index in 3" :key="index" class="metric"><view class="line value" /><view class="line label" /></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.discovery-card { position: relative; height: 500rpx; margin-bottom: 28rpx; overflow: hidden; border-radius: 36rpx; background: var(--chumen-soft); box-shadow: 0 14rpx 34rpx rgba(28,24,18,.08); }
.shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(28,24,18,.05), rgba(28,24,18,.14)); }
.card-top { position: absolute; top: 32rpx; right: 30rpx; left: 30rpx; }
.pill { width: 180rpx; height: 44rpx; border-radius: 999rpx; background: rgba(255,255,255,.55); }
.card-bottom { position: absolute; right: 32rpx; bottom: 30rpx; left: 32rpx; }
.metrics { display: flex; }
.metric { flex: 1; }
.metrics .metric + .metric { margin-left: 16rpx; }
.line { border-radius: 10rpx; background: rgba(255,255,255,.5); }
.line.title { width: 62%; height: 40rpx; margin-bottom: 26rpx; }
.line.value { width: 78%; height: 30rpx; margin-bottom: 10rpx; }
.line.label { width: 54%; height: 20rpx; }
.skeleton .line, .skeleton .pill { animation: skeleton-shimmer 1.4s ease-in-out infinite; }
@keyframes skeleton-shimmer { 0%, 100% { opacity: .45 } 50% { opacity: .85 } }
</style>
