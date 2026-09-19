<template>
  <view class="discovery-card" role="button" tabindex="0" :aria-label="`${item.title}，距你${formatDistanceKm(item.distanceKm)}公里`" @click="activate" @keyup.enter="activate" @keyup.space="activate">
    <image class="cover" :src="item.coverImageUrl" mode="aspectFill" />
    <view class="overlay" />
    <view class="card-top">
      <view class="rank"><image src="/static/icons/bolt.svg" mode="aspectFit" /><text>{{ item.rankTag }} Top {{ item.rank }}</text></view>
      <view class="distance"><image src="/static/icons/pin-light.svg" mode="aspectFit" /><text>距你 {{ formatDistanceKm(item.distanceKm) }}km</text></view>
    </view>
    <view class="card-bottom">
      <text class="card-title">{{ item.title }}</text>
      <view class="metrics">
        <view><text class="metric-value">{{ item.lengthKm.toFixed(1) }}KM</text><text class="metric-label">{{ item.scene === 'fish' ? '环湖岸线' : '路线长度' }}</text></view>
        <view><text class="metric-value">{{ verticalMetric }}</text><text class="metric-label">{{ item.scene === 'fish' ? '平均水深' : '路线落差' }}</text></view>
        <view><text class="metric-value">{{ item.difficulty }}</text><text class="metric-label">{{ item.scene === 'fish' ? '鱼获难度' : '难度等级' }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDistanceKm } from '@/common/location'
import type { RouteCard } from '@/types/domain'
const props = defineProps<{ item: RouteCard }>()
const emit = defineEmits<{ click: [item: RouteCard] }>()
const verticalMetric = computed(() => {
  const value = props.item.scene === 'fish' ? props.item.depthM : props.item.elevationM
  return value === null ? '--' : `${value}M`
})
function activate() { emit('click', props.item) }
</script>

<style scoped lang="scss">
.discovery-card { position: relative; height: 500rpx; margin-bottom: 28rpx; overflow: hidden; border-radius: 36rpx; background: #222; color: #fff; box-shadow: 0 14rpx 34rpx rgba(28,24,18,.12); }
.cover, .overlay { position: absolute; inset: 0; width: 100%; height: 100%; }
.overlay { background: linear-gradient(180deg, rgba(0,0,0,.3) 0%, rgba(0,0,0,.08) 28%, rgba(0,0,0,.34) 58%, rgba(0,0,0,.92) 100%); }
.card-top { position: absolute; top: 32rpx; right: 30rpx; left: 30rpx; display: flex; align-items: center; justify-content: space-between; }
.rank,.distance { display: flex; align-items: center; white-space: nowrap; }.rank image { width: 24rpx; height: 24rpx; flex-shrink: 0; margin-right: 8rpx; }.distance image { width: 20rpx; height: 20rpx; flex-shrink: 0; margin-right: 6rpx; }
.rank { max-width: 66%; padding: 12rpx 18rpx; overflow: hidden; border-radius: 999rpx; background: rgba(18,18,18,.9); color: var(--chumen-lime); font-size: 22rpx; font-weight: 800; }.rank text { overflow: hidden; text-overflow: ellipsis; }
.distance { font-size: 22rpx; color: rgba(255,255,255,.92); }
.card-bottom { position: absolute; right: 32rpx; bottom: 30rpx; left: 32rpx; }
.card-title { display: block; max-width: 92%; margin-bottom: 22rpx; font-size: 39rpx; line-height: 1.18; font-weight: 900; letter-spacing: -1rpx; }
.metrics { display: flex; align-items: flex-start; }
.metrics > view { flex: 1; min-width: 0; }
.metric-value, .metric-label { display: block; }
.metric-value { font-size: 29rpx; font-weight: 900; white-space: nowrap; }
.metric-label { margin-top: 6rpx; font-size: 20rpx; color: rgba(255,255,255,.78); }
.discovery-card:active { transform: translateY(2rpx); }
</style>
