<template>
  <view class="discovery-card" role="button" tabindex="0" :aria-label="`${item.title}，距你${formatDistanceKm(item.distanceKm)}公里`" @click="activate" @keyup.enter="activate" @keyup.space="activate">
    <image class="cover" :src="resolveAssetUrl(item.coverImageUrl)" mode="aspectFill" webp />
    <view class="overlay" />
    <view class="card-top">
      <view v-if="item.rankTag && item.rank > 0" class="rank"><image src="/static/icons/bolt.svg" mode="aspectFit" /><text>{{ item.rankTag }} Top {{ item.rank }}</text></view>
      <view v-if="item.distanceKm > 0" class="distance"><image src="/static/icons/pin-light.svg" mode="aspectFit" /><text>距你 {{ formatDistanceKm(item.distanceKm) }}km</text></view>
    </view>
    <view class="card-bottom">
      <text class="card-title">{{ item.title }}</text>
      <view class="metrics">
        <view v-for="m in metrics" :key="m.label"><text class="metric-value">{{ m.value }}</text><text class="metric-label">{{ m.label }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveAssetUrl } from '@/common/assetUrl'
import { formatDistanceKm } from '@/common/location'
import { isDestinationOnlyRecord, isFishingRecord } from '@/common/scenes'
import type { RouteCard } from '@/types/domain'
const props = defineProps<{ item: RouteCard }>()
const emit = defineEmits<{ click: [item: RouteCard] }>()
const fishing = computed(() => isFishingRecord(props.item.scene, props.item.subType))
const destinationOnly = computed(() => isDestinationOnlyRecord(props.item.scene, props.item.subType))
const verticalMetric = computed(() => {
  const value = fishing.value ? props.item.depthM : props.item.elevationM
  return value === null ? '--' : `${value}M`
})
// 卡片三指标：钓鱼/路线展示里程·落差·难度；目的地型（洗车/露营/打卡）展示门票·开放时间·建议停留，与钓鱼卡片视觉对称
const metrics = computed(() => {
  if (destinationOnly.value) {
    return [
      { value: props.item.priceLabel || '--', label: '门票' },
      { value: props.item.bestTime || '--', label: '开放时间' },
      { value: props.item.durationLabel || '--', label: '建议停留' },
    ]
  }
  if (fishing.value) {
    return [
      { value: `${props.item.lengthKm.toFixed(1)}KM`, label: '环湖岸线' },
      { value: verticalMetric.value, label: '平均水深' },
      { value: props.item.difficulty, label: '鱼获难度' },
    ]
  }
  return [
    { value: `${props.item.lengthKm.toFixed(1)}KM`, label: '路线长度' },
    { value: verticalMetric.value, label: '路线落差' },
    { value: props.item.difficulty, label: '难度等级' },
  ]
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
