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

    <view v-if="line" class="top-chip" role="status">
      <text v-if="line.distanceKm !== null">驾车全程约 {{ line.distanceKm }} km</text>
      <text v-if="line.durationMinutes !== null"> · 约 {{ line.durationMinutes }} 分钟</text>
    </view>
    <button v-if="line" class="start-btn" @click="goToStart">前往出发地</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageHeader from '@/components/PageHeader.vue'
import { outdoorApi } from '@/api/outdoor'
import { openNavigation } from '@/common/mapNavigation'
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

/** 唤起系统地图导航到轨迹起点（出发地） */
async function goToStart() {
  const start = line.value?.points[0]
  if (!start) return
  try {
    await openNavigation({ latitude: start.latitude, longitude: start.longitude, name: '出发地' })
  } catch {
    uni.showToast({ title: '当前环境无法唤起地图', icon: 'none' })
  }
}
</script>

<style scoped lang="scss">
.route-map-page { position: relative; width: 100vw; height: 100vh; }
.map { width: 100vw; height: 100vh; }
.header-over-map { position: absolute; z-index: 10; top: 0; right: 24rpx; left: 24rpx; padding-top: calc(env(safe-area-inset-top) + 10rpx); color: #fff; }
.header-over-map :deep(.page-header) { margin-top: 0; color: #fff; }
.header-over-map :deep(.back) { color: #fff; background: rgba(0,0,0,.22); border-color: rgba(255,255,255,.38); }
.header-over-map :deep(.page-title) { color: #fff; text-shadow: 0 2rpx 8rpx rgba(0,0,0,.5); }
.state-card { position: absolute; z-index: 12; top: 45%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 16rpx; padding: 24rpx 34rpx; border-radius: 24rpx; background: rgba(255,255,255,.94); color: var(--chumen-ink); font-size: 26rpx; box-shadow: 0 8rpx 30rpx rgba(0,0,0,.18); }
.state-card.error { flex-direction: column; gap: 12rpx; text-align: center; }
.state-card button { min-height: 60rpx; padding: 0 30rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 24rpx; line-height: 60rpx; }
.top-chip { position: absolute; z-index: 12; top: calc(env(safe-area-inset-top) + 150rpx); left: 50%; transform: translateX(-50%); display: flex; padding: 14rpx 28rpx; border-radius: 999rpx; background: rgba(26,26,26,.92); color: var(--chumen-lime); font-size: 24rpx; font-weight: 700; white-space: nowrap; }
.start-btn { position: absolute; z-index: 12; right: 32rpx; bottom: calc(44rpx + env(safe-area-inset-bottom)); left: 32rpx; min-height: 96rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 30rpx; font-weight: 800; line-height: 96rpx; box-shadow: 0 8rpx 26rpx rgba(0,0,0,.28); }
</style>
