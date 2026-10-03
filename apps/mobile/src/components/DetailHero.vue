<template>
  <view class="detail-hero">
    <image :src="resolveAssetUrl(item.coverImageUrl)" mode="aspectFill" webp />
    <view class="shade" />
    <view class="hero-top"><view v-if="item.rankTag && item.rank > 0" class="rank"><image src="/static/icons/bolt.svg" mode="aspectFit" /><text>{{ item.rankTag }} Top {{ item.rank }}</text></view><view class="distance"><image src="/static/icons/pin-light.svg" mode="aspectFit" /><text>距你 {{ formatDistanceKm(item.distanceKm) }}km</text></view></view>
    <view class="hero-content">
      <text class="title">{{ item.title }}</text>
      <view class="hero-metrics">
        <view><text>{{ item.lengthKm.toFixed(1) }}KM</text><text>{{ item.scene === 'fish' ? '环湖岸线' : '路线长度' }}</text></view>
        <view><text>{{ verticalMetric }}</text><text>{{ item.scene === 'fish' ? '平均水深' : '路线落差' }}</text></view>
        <view><text>{{ item.difficulty }}</text><text>{{ item.scene === 'fish' ? '鱼获难度' : '难度等级' }}</text></view>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { resolveAssetUrl } from '@/common/assetUrl'
import { formatDistanceKm } from '@/common/location'
import type { RouteCard } from '@/types/domain'
const props = defineProps<{ item: RouteCard }>()
const verticalMetric = computed(() => {
  const value = props.item.scene === 'fish' ? props.item.depthM : props.item.elevationM
  return value === null ? '--' : `${value}M`
})
</script>
<style scoped lang="scss">
.detail-hero { position: relative; height: 700rpx; overflow: hidden; background: #222; color: #fff; }.detail-hero > image,.shade { position: absolute; inset: 0; width: 100%; height: 100%; }.shade { background: linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.15) 42%,rgba(0,0,0,.96)); }
.hero-top { position: absolute; top: calc(var(--chumen-top-inset, var(--status-bar-height, 0px)) + 112rpx); right: 32rpx; left: 32rpx; display: flex; align-items: center; justify-content: space-between; font-size: 22rpx; }.rank,.distance { display: flex; align-items: center; white-space: nowrap; }.distance { margin-left: auto; }.rank { max-width: 68%; padding: 12rpx 18rpx; overflow: hidden; border-radius: 999rpx; background: rgba(18,18,18,.88); color: var(--chumen-lime); font-weight: 800; }.rank image { width: 24rpx; height: 24rpx; flex-shrink: 0; margin-right: 8rpx; }.rank text { overflow: hidden; text-overflow: ellipsis; }.distance image { width: 20rpx; height: 20rpx; margin-right: 6rpx; }
.hero-content { position: absolute; right: 32rpx; bottom: 34rpx; left: 32rpx; }.title { display: block; margin-bottom: 28rpx; font-size: 46rpx; line-height: 1.18; font-weight: 900; }
.hero-metrics { display: flex; }.hero-metrics > view { flex: 1; }.hero-metrics text { display: block; }.hero-metrics text:first-child { font-size: 30rpx; font-weight: 900; }.hero-metrics text:last-child { margin-top: 6rpx; color: rgba(255,255,255,.78); font-size: 20rpx; }
</style>
