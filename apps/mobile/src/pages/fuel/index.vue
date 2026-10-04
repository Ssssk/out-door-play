<template>
  <AppShell>
    <view class="page-content fuel-page">
      <BrandHeader title="今日油价" :cities="availableCities" @change="loadFuel" />
      <text class="updated-at">数据更新于 {{ updatedAt || '—' }}{{ priceSource === 'province' && priceRegion ? ` · ${priceRegion}参考价` : '' }}</text>

      <view v-if="prices.length === 0" class="price-empty" role="status">这个城市暂时没有油价数据</view>
      <view v-else class="price-grid">
        <view v-for="price in prices" :key="price.grade" class="price-card">
          <text class="grade">{{ price.grade }}</text>
          <view><text class="price">{{ price.price.toFixed(2) }}</text><text class="unit">元/升</text></view>
          <text class="change" :class="price.change > 0 ? 'up' : price.change < 0 ? 'down' : 'flat'">{{ price.change > 0 ? '↑' : price.change < 0 ? '↓' : '—' }} {{ price.change === 0 ? '持平' : `${Math.abs(price.change).toFixed(2)} 较上期` }}</text>
        </view>
      </view>

      <view class="station-heading">
        <text class="section-title">附近加油站点</text>
      </view>

      <view v-if="stationFallback === 'city'" class="station-fallback" role="status">
        <text>你所在区域暂未收录加油站，以下为「{{ cityName }}」已收录的站点</text>
      </view>

      <view v-if="loading" class="station-state" role="status">
        <wd-loading color="#1a1a1a" />
        <text>正在获取位置并查询附近站点…</text>
      </view>
      <view v-else-if="stationState === 'denied'" class="station-state station-action" role="alert">
        <text>开启定位后，才能查询你附近的真实加油站</text>
        <button @click="enableLocation">开启定位</button>
      </view>
      <view v-else-if="stationState === 'error'" class="station-state station-action" role="alert">
        <text>{{ stationError }}</text>
        <button @click="loadFuel">重试</button>
      </view>
      <view v-else-if="stationState === 'empty'" class="station-state" role="status">
        <text>当前结果中暂未找到加油站</text>
      </view>

      <view v-else-if="stationState === 'ready'" class="station-list">
        <view v-for="station in stations" :key="station.id" class="station-card card-surface">
          <view class="station-info">
            <text class="station-name">{{ station.name }}</text>
            <!-- 城市兜底时无真实「距你」距离：改展示地址，避免出现「距你 -km」 -->
          <text v-if="stationFallback !== 'city'" class="station-meta">距你 {{ formatDistanceKm(station.distanceKm) }}km{{ station.openingHours ? ` · ${station.openingHours}` : '' }}</text>
          <text v-else class="station-meta">{{ station.address }}</text>
           <!-- 腾讯实时站点不提供油价：拿不到时整行隐藏，避免显示「0.00 元/升」 -->
            <text v-if="station.price92 > 0" class="station-prices">92# <text class="price-strong">{{ station.price92.toFixed(2) }}</text> · 95# {{ station.price95.toFixed(2) }} 元/升</text>
          </view>
          <button class="navigate-button" @click="navigateToStation(station)">导航</button>
        </view>
      </view>

      <!-- 分页状态：触底自动加载下一页 -->
      <view v-if="stationState === 'ready' || stationState === 'empty'" class="station-more" role="status">
        <text v-if="loadingMore">正在加载更多…</text>
        <button v-else-if="hasMore" @click="loadMore">{{ stationError || '加载更多' }}</button>
        <text v-else>已显示本次检索结果</text>
      </view>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BrandHeader from '@/components/BrandHeader.vue'
import { formatDistanceKm } from '@/common/location'
import { onShareAppMessage } from '@dcloudio/uni-app'
import { openNavigation } from '@/common/mapNavigation'
import { cities as localCities } from '@/data/mock'
import { outdoorApi } from '@/api/outdoor'
import { useAppStore } from '@/stores/app'
import type { City, FuelStation } from '@/types/domain'
import { useFuel } from './useFuel'

const appStore = useAppStore()

// 城市列表与出车 tab 同源（/v1/cities）；接口不可用时回退本地兜底，保证两端一致
const availableCities = ref<City[]>(localCities)
async function loadCities() {
  try {
    const items = await outdoorApi.cities()
    if (items.length) availableCities.value = items
  } catch { /* 回退本地列表 */ }
}
onMounted(() => { void loadCities() })

// 兜底提示里展示的城市名：优先用门店选中城市，否则从城市列表查
const cityName = computed(() => {
  const picked = availableCities.value.find((city) => city.code === appStore.city.code)
  return picked?.name || appStore.city.name || appStore.city.code || '该城市'
})

const {
  prices,
  stations,
  hasMore,
  loading,
  loadingMore,
  stationState,
  stationError,
  stationFallback,
  locationStatus,
  openLocationSettings,
  updatedAt,
  priceSource,
  priceRegion,
  loadFuel,
  loadMore,
} = useFuel()

async function enableLocation() {
  // 首次点击由 getLocation 触发系统授权；拒绝后再带用户去设置页。
  if (locationStatus.value === 'denied') await openLocationSettings()
  await loadFuel()
}

async function navigateToStation(station: FuelStation) {
  try { await openNavigation({ latitude: station.latitude, longitude: station.longitude, name: station.name, address: station.address }) }
  catch { uni.showToast({ title: '当前环境无法唤起地图', icon: 'none' }) }
}

onShareAppMessage(() => ({ title: '今日油价 · 附近加油站｜粗门溜溜', path: '/pages/fuel/index' }))
</script>

<style scoped lang="scss">
.fuel-page { padding-bottom: 50rpx; }
.updated-at { display: block; margin: 34rpx 0 20rpx; color: var(--chumen-muted); font-size: 22rpx; text-align: right; }
.price-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 20rpx; row-gap: 20rpx; }
.price-empty { padding: 60rpx 0; border: 2rpx solid var(--chumen-line); border-radius: 34rpx; background: var(--chumen-soft); color: var(--chumen-muted); font-size: 24rpx; text-align: center; }
.price-card { padding: 28rpx 30rpx; border: 2rpx solid var(--chumen-line); border-radius: 34rpx; background: var(--chumen-soft); }
.grade, .change { display: block; color: var(--chumen-muted); font-size: 24rpx; }
.price { margin-right: 8rpx; color: var(--chumen-ink); font-size: 46rpx; font-weight: 900; }
.unit { font-size: 22rpx; }.change { margin-top: 6rpx; }.up { color: #e5484d; }.down { color: #2ba24c; }
/* 站点标题吸顶：与首页 SceneTabs 同模式——安全区做进盒子 padding（单一背景无接缝），
   等量负 margin 抵消布局高度；油价卡片抬层级避免被上移的盒子背景盖住。 */
.station-heading { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; margin: calc(36rpx - var(--chumen-top-inset, var(--status-bar-height, 0px))) -32rpx 22rpx; padding: calc(var(--chumen-top-inset, var(--status-bar-height, 0px)) + 16rpx) 32rpx 16rpx; background: var(--chumen-canvas); }
.station-heading .section-title { margin: 0; }
.station-heading > text:last-child { color: var(--chumen-muted); font-size: 22rpx; }
/* 城市兜底提示：用户坐标附近无站点时，说明下方列表口径为所选城市 */
.station-fallback { margin: 0 0 18rpx; padding: 16rpx 22rpx; border: 2rpx solid var(--chumen-line); border-radius: 20rpx; background: var(--chumen-soft); color: var(--chumen-muted); font-size: 22rpx; line-height: 1.5; text-align: center; }
.price-grid, .price-empty { position: relative; z-index: 31; }
.station-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220rpx; padding: 28rpx; border: 2rpx solid var(--chumen-line); border-radius: 28rpx; background: var(--chumen-soft); color: var(--chumen-muted); font-size: 24rpx; line-height: 1.6; text-align: center; }
.station-state text { margin-top: 16rpx; }
.station-action button { min-width: 180rpx; min-height: 68rpx; margin-top: 22rpx; padding: 0 28rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 24rpx; line-height: 68rpx; }
.station-more { padding: 20rpx 0 4rpx; color: var(--chumen-muted); font-size: 22rpx; text-align: center; }
.station-card { display: flex; align-items: center; min-height: 178rpx; margin-bottom: 22rpx; padding: 24rpx 28rpx; }
.station-info { flex: 1; min-width: 0; padding-right: 18rpx; }.station-name,.station-meta,.station-prices { display: block; }
.station-name { overflow: hidden; color: var(--chumen-ink); font-size: 28rpx; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.station-meta,.station-prices { margin-top: 10rpx; color: var(--chumen-muted); font-size: 22rpx; }
/* 注意：小程序 <text> 只能嵌套 <text>，写 <b> 会被编译成 <view> 并被整体丢弃（实测 92# 数字因此不显示） */
.station-prices .price-strong { color: var(--chumen-ink); font-weight: 700; }
.navigate-button { min-width: 142rpx; min-height: 72rpx; margin: 0; padding: 0 26rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 26rpx; line-height: 72rpx; }
</style>
