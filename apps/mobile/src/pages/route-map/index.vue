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
      :markers="markers"
      :include-points="includePoints"
      enable-satellite
      @markertap="onMarkerTap"
      @callouttap="onMarkerTap"
      @tap="onMapTap"
      :show-compass="false"
      :rotate="false"
      :skew="false"
    />
    <view class="header-over-map" :style="{ paddingTop: headerTop + 'px', '--row-h': rowHeight + 'px' }">
      <PageHeader title="完整路线" :fallback="`/pages/route-detail/index?routeId=${routeId}`" />
    </view>

    <view v-if="loading" class="state-card" role="status"><text>正在规划完整路线…</text></view>
    <view v-else-if="errorMsg" class="state-card error" role="alert">
      <text>{{ errorMsg }}</text>
      <button @click="loadLine">重试</button>
    </view>

    <view v-if="line" class="top-chip" :style="{ top: chipTop + 'px' }" role="status">
      <text v-if="line.distanceKm !== null">驾车全程约 {{ line.distanceKm }} km</text>
      <text v-if="line.durationMinutes !== null"> · 约 {{ line.durationMinutes }} 分钟</text>
    </view>
    <button v-if="line" class="start-btn" @click="onNavigateAction">{{ navigateLabel }}</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
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
// 地图上被点选的点：'start' 起点 / 'end' 终点 / null 未选（默认「途经出发地前往终点」）
const selectedPoint = ref<'start' | 'end' | null>(null)

// 分享标题带路线里程，无数据时退化为通用文案
const shareTitle = computed(() => {
  const km = line.value?.distanceKm
  return km ? `完整路线 ${km.toFixed(1)} 公里 · 粗门溜溜自驾` : '完整路线 · 粗门溜溜自驾'
})
// 右上角菜单转发/分享：落地到路线详情页（信息比纯地图完整），再由详情页进入完整路线
onShareAppMessage(() => ({
  title: shareTitle.value,
  path: `/pages/route-detail/index?routeId=${routeId.value}`,
}))
onShareTimeline(() => ({
  title: shareTitle.value,
  query: `routeId=${routeId.value}`,
}))

// 顶栏定位：iOS 上 CSS env(safe-area-inset-top) 取值不可靠，改用胶囊按钮实测位置对齐——
// 返回键所在行与右上角胶囊(···◎)完全同高，永远不会再顶进状态栏
const headerTop = ref(20)
const rowHeight = ref(32)
const chipTop = ref(72)

function measureNavbar() {
  try {
    const rect = uni.getMenuButtonBoundingClientRect()
    if (rect?.top) {
      // 返回键行高 44px(88rpx)，令其中心与胶囊中心对齐
      headerTop.value = Math.max(8, Math.round(rect.top + rect.height / 2 - 22))
      rowHeight.value = rect.height
      chipTop.value = rect.top + rect.height + 14
      return
    }
  } catch { /* 低版本基础库没有该接口，走回落 */ }
  const statusBar = (uni.getSystemInfoSync().statusBarHeight as number | undefined) ?? 20
  headerTop.value = statusBar + 10
  rowHeight.value = 32
  chipTop.value = statusBar + 10 + 32 + 14
}

onLoad(async (query) => {
  measureNavbar()
  routeId.value = String(query?.routeId || '')
  await loadLine()
})

async function loadLine() {
  if (!routeId.value) { fatal.value = true; return }
  loading.value = true
  errorMsg.value = ''
  try {
    line.value = await outdoorApi.routeLine(routeId.value)
    // 换路线/重试后清空选中，按钮回到默认的「途经出发地前往终点」
    selectedPoint.value = null
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

// 起终点用「圆点图标 + 常显气泡」表达：label 文字不可点、圆点热区又太小，
// 改用 callout 气泡承载文字（点击气泡会触发 callouttap），面积远大于图标，手指好点；
// 被选中的点圆点放大、气泡反色（绿底黑字），与下方按钮呼应
const markers = computed(() => {
  const points = line.value?.points
  if (!points?.length) return []
  const build = (point: LinePoint, content: string, iconPath: string, markerId: number, kind: 'start' | 'end') => {
    const active = selectedPoint.value === kind
    return {
      id: markerId,
      latitude: point.latitude,
      longitude: point.longitude,
      iconPath,
      width: active ? 40 : 30,
      height: active ? 40 : 30,
      anchor: { x: 0.5, y: 0.5 },
      callout: {
        content,
        color: active ? '#1A1A1A' : '#CCFF00',
        fontSize: 14,
        bgColor: active ? '#CCFF00' : '#1A1A1A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: active ? '#1A1A1A' : '#CCFF00',
        padding: 16,
        display: 'ALWAYS' as const,
        textAlign: 'center' as const,
      },
    }
  }
  return [
    build(points[0], '出发地', '/static/icons/map-point-start.png', 1, 'start'),
    build(points[points.length - 1], '目的地', '/static/icons/map-point-end.png', 2, 'end'),
  ]
})

const includePoints = computed(() => line.value?.points.map((point) => ({ latitude: point.latitude, longitude: point.longitude })) ?? [])

/** 底部按钮文案跟随地图上点选的点：起点 → 前往出发地；终点 → 前往目的地；未选 → 途经方案 */
const navigateLabel = computed(() => {
  if (selectedPoint.value === 'start') return '前往出发地'
  if (selectedPoint.value === 'end') return '前往目的地'
  return '途经出发地前往终点'
})

/** 点圆点图标(markertap)或文字气泡(callouttap)都走这里：起(1) / 终(2) */
function onMarkerTap(event: { detail?: { markerId?: number }; markerId?: number }) {
  const markerId = Number(event?.detail?.markerId ?? event?.markerId)
  if (markerId === 1) selectedPoint.value = 'start'
  else if (markerId === 2) selectedPoint.value = 'end'
}

// 气泡之外再留一层地理兜底：点起/终点附近约 2 公里内也算选中。
// 部分端 map 的 tap 事件 detail 不带经纬度，拿不到坐标时直接忽略，不误选
const TAP_HIT_RADIUS_METERS = 2000

/** 两点间近似球面距离（米） */
function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const midLat = toRad((a.latitude + b.latitude) / 2)
  const x = dLng * Math.cos(midLat)
  return Math.sqrt(dLat * dLat + x * x) * 6371000
}

function onMapTap(event: { detail?: { latitude?: number; longitude?: number } }) {
  const points = line.value?.points
  const latitude = Number(event?.detail?.latitude)
  const longitude = Number(event?.detail?.longitude)
  if (!points?.length || Number.isNaN(latitude) || Number.isNaN(longitude)) return
  const tapped = { latitude, longitude }
  const toStart = distanceMeters(tapped, points[0])
  const toEnd = distanceMeters(tapped, points[points.length - 1])
  if (Math.min(toStart, toEnd) > TAP_HIT_RADIUS_METERS) return
  selectedPoint.value = toStart <= toEnd ? 'start' : 'end'
}

/**
 * 唤起地图导航：
 * - 点选了起点/终点：单点直达该点
 * - 未点选：默认「途经出发地前往终点」，一次导航先到出发地再到终点
 */
async function onNavigateAction() {
  const points = line.value?.points
  if (!points?.length) return
  const start = points[0]
  const end = points[points.length - 1]
  const goingToStart = selectedPoint.value === 'start'
  const target = goingToStart ? start : end
  const waypoints = selectedPoint.value !== null || points.length < 2
    ? []
    : [{ latitude: start.latitude, longitude: start.longitude, name: '出发地' }]
  try {
    await openNavigation(
      { latitude: target.latitude, longitude: target.longitude, name: goingToStart ? '出发地' : '目的地' },
      { waypoints },
    )
  } catch {
    uni.showToast({ title: '当前环境无法唤起地图', icon: 'none' })
  }
}
</script>

<style scoped lang="scss">
.route-map-page { position: relative; width: 100vw; height: 100vh; }
.map { width: 100vw; height: 100vh; }
.header-over-map { position: absolute; z-index: 10; top: 0; right: 24rpx; left: 24rpx; color: #fff; }
.header-over-map :deep(.header-row) { min-height: var(--row-h, 88rpx); }
.header-over-map :deep(.page-header) { margin-top: 0; color: #fff; }
.header-over-map :deep(.back) { color: #fff; background: rgba(0,0,0,.22); border-color: rgba(255,255,255,.38); }
.header-over-map :deep(.page-title) { color: #fff; text-shadow: 0 2rpx 8rpx rgba(0,0,0,.5); }
.state-card { position: absolute; z-index: 12; top: 45%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 16rpx; padding: 24rpx 34rpx; border-radius: 24rpx; background: rgba(255,255,255,.94); color: var(--chumen-ink); font-size: 26rpx; box-shadow: 0 8rpx 30rpx rgba(0,0,0,.18); }
.state-card.error { flex-direction: column; gap: 12rpx; text-align: center; }
.state-card button { min-height: 60rpx; padding: 0 30rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 24rpx; line-height: 60rpx; }
.top-chip { position: absolute; z-index: 12; left: 50%; transform: translateX(-50%); display: flex; padding: 14rpx 28rpx; border-radius: 999rpx; background: rgba(26,26,26,.92); color: var(--chumen-lime); font-size: 24rpx; font-weight: 700; white-space: nowrap; }
.start-btn { position: absolute; z-index: 12; right: 32rpx; bottom: calc(44rpx + env(safe-area-inset-bottom)); left: 32rpx; min-height: 96rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 30rpx; font-weight: 800; line-height: 96rpx; box-shadow: 0 8rpx 26rpx rgba(0,0,0,.28); }
</style>
