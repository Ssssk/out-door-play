<template>
  <view class="route-map-page">
    <map
      v-if="!fatal"
      id="routeMap"
      class="map"
      :latitude="center.latitude"
      :longitude="center.longitude"
      :scale="13"
      :polyline="polyline"
      :circles="circles"
      :labels="labels"
      :include-points="includePoints"
      enable-satellite
      :show-compass="false"
      :rotate="false"
      :skew="false"
    />
    <view class="header-over-map">
      <PageHeader title="完整路线" :fallback="`/pages/route-detail/index?routeId=${routeId}`" />
    </view>

    <view v-if="loading" class="state-card" role="status"><text>正在规划完整路线…</text></view>
    <view v-else-if="errorMsg" class="state-card error" role="alert">
      <text>{{ errorMsg }}</text>
      <button @click="loadLine">重试</button>
    </view>

    <view v-if="line" class="footer-chip" role="status">
      <text v-if="line.distanceKm !== null">驾车全程约 {{ line.distanceKm }} km</text>
      <text v-if="line.durationMinutes !== null"> · 约 {{ line.durationMinutes }} 分钟</text>
    </view>
    <button v-if="line" class="locate-btn" aria-label="回到我的位置" @click="locate">◎</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageHeader from '@/components/PageHeader.vue'
import { outdoorApi } from '@/api/outdoor'
import { userFacingError } from '@/common/apiErrors'

interface LinePoint { longitude: number; latitude: number }
interface RouteLine { points: LinePoint[]; distanceKm: number | null; durationMinutes: number | null }

const routeId = ref('')
const line = ref<RouteLine>()
const loading = ref(true)
const errorMsg = ref('')
const fatal = ref(false)
const center = ref({ latitude: 30.3, longitude: 114.3 })

onLoad(async (query) => {
  routeId.value = String(query?.routeId || '')
  await loadLine()
})

async function loadLine() {
  if (!routeId.value) { fatal.value = true; return }
  loading.value = true
  errorMsg.value = ''
  try {
    line.value = await outdoorApi.routeLine(routeId.value)
    const points = line.value.points
    if (points.length) {
      const mid = points[Math.floor(points.length / 2)]
      center.value = { latitude: mid.latitude, longitude: mid.longitude }
    }
  } catch (error) {
    errorMsg.value = userFacingError(error, '该路线暂无完整轨迹')
  } finally {
    loading.value = false
  }
}

const polyline = computed(() => {
  if (!line.value) return []
  return [{
    points: line.value.points.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
    color: '#FF9500FF',
    width: 6,
    arrowLine: true,
    borderColor: '#1A1A1A88',
    borderWidth: 1,
  }]
})

// 起终点用「圆点 + 文本标签」表达：circles/labels 无需图标资源，兼容性最好
const circles = computed(() => {
  const points = line.value?.points
  if (!points?.length) return []
  const build = (point: LinePoint) => ({
    latitude: point.latitude,
    longitude: point.longitude,
    radius: 14,
    color: '#1A1A1ACC',
    fillColor: '#CCFF00E6',
    strokeWidth: 4,
  })
  return [build(points[0]), build(points[points.length - 1])]
})

const labels = computed(() => {
  const points = line.value?.points
  if (!points?.length) return []
  const build = (point: LinePoint, content: string) => ({
    latitude: point.latitude,
    longitude: point.longitude,
    content,
    bgColor: '#1A1A1A',
    color: '#CCFF00',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCFF00',
    padding: 6,
    textAlign: 'center' as const,
    anchorX: 0,
    anchorY: -34,
  })
  return [build(points[0], '起'), build(points[points.length - 1], '终')]
})

const includePoints = computed(() => line.value?.points.map((point) => ({ latitude: point.latitude, longitude: point.longitude })) ?? [])

function locate() {
  try {
    uni.createMapContext('routeMap').moveToLocation()
  } catch {
    uni.showToast({ title: '定位不可用', icon: 'none' })
  }
}
</script>

<style scoped lang="scss">
.route-map-page { position: relative; width: 100vw; height: 100vh; }
.map { width: 100vw; height: 100vh; }
.header-over-map { position: absolute; z-index: 10; top: 0; right: 24rpx; left: 24rpx; color: #fff; }
.header-over-map :deep(.page-header) { margin-top: 0; padding-top: var(--chumen-top-inset, var(--status-bar-height, 0px)); color: #fff; }
.header-over-map :deep(.back) { color: #fff; background: rgba(0,0,0,.22); border-color: rgba(255,255,255,.38); }
.header-over-map :deep(.page-title) { color: #fff; text-shadow: 0 2rpx 8rpx rgba(0,0,0,.5); }
.state-card { position: absolute; z-index: 12; top: 45%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 16rpx; padding: 24rpx 34rpx; border-radius: 24rpx; background: rgba(255,255,255,.94); color: var(--chumen-ink); font-size: 26rpx; box-shadow: 0 8rpx 30rpx rgba(0,0,0,.18); }
.state-card.error { flex-direction: column; gap: 12rpx; text-align: center; }
.state-card button { min-height: 60rpx; padding: 0 30rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 24rpx; line-height: 60rpx; }
.footer-chip { position: absolute; z-index: 12; bottom: calc(40rpx + env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); display: flex; padding: 16rpx 30rpx; border-radius: 999rpx; background: rgba(26,26,26,.92); color: var(--chumen-lime); font-size: 24rpx; font-weight: 700; white-space: nowrap; }
.locate-btn { position: absolute; z-index: 12; right: 24rpx; bottom: calc(140rpx + env(safe-area-inset-bottom)); display: flex; align-items: center; justify-content: center; width: 88rpx; height: 88rpx; margin: 0; padding: 0; border: 2rpx solid var(--chumen-line); border-radius: 50%; background: rgba(255,255,255,.92); color: var(--chumen-ink); font-size: 34rpx; line-height: 1; box-shadow: 0 6rpx 20rpx rgba(0,0,0,.15); }
</style>
