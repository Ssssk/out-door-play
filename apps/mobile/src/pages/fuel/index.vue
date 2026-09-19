<template>
  <AppShell>
    <view class="page-content fuel-page">
      <BrandHeader title="今日油价" @change="loadFuel" />
      <text class="updated-at">数据更新于 {{ updatedAt || '—' }}{{ priceSource === 'province' && priceRegion ? ` · ${priceRegion}参考价` : '' }}</text>

      <view v-if="prices.length === 0" class="price-empty" role="status">这个城市暂时没有油价数据</view>
      <view v-else class="price-grid">
        <view v-for="price in prices" :key="price.grade" class="price-card">
          <text class="grade">{{ price.grade }}</text>
          <view><text class="price">{{ price.price.toFixed(2) }}</text><text class="unit">元/升</text></view>
          <text class="change" :class="price.change > 0 ? 'up' : price.change < 0 ? 'down' : 'flat'">{{ price.change > 0 ? '↑' : price.change < 0 ? '↓' : '—' }} {{ price.change === 0 ? '持平' : `${Math.abs(price.change).toFixed(2)} 较上期` }}</text>
        </view>
      </view>

      <view class="station-heading"><text class="section-title">附近加油站点</text><text>共 {{ total }} 个 · 按距离</text></view>
      <view class="station-list">
        <view v-for="station in stations" :key="station.id" class="station-card card-surface">
          <view class="station-info">
            <text class="station-name">{{ station.name }}</text>
            <text class="station-meta">距你 {{ formatDistanceKm(station.distanceKm) }}km{{ station.openingHours ? ` · ${station.openingHours}` : '' }}</text>
           <!-- 腾讯实时站点不提供油价：拿不到时整行隐藏，避免显示「0.00 元/升」 -->
            <text v-if="station.price92 > 0" class="station-prices">92# <b>{{ station.price92.toFixed(2) }}</b> · 95# {{ station.price95.toFixed(2) }} 元/升</text>
          </view>
          <button class="navigate-button" @click="navigateToStation(station)">导航</button>
        </view>
      </view>

      <!-- 分页状态：触底自动加载下一页 -->
      <view class="station-more" role="status">
        <text v-if="loadingMore">正在加载更多…</text>
        <text v-else-if="hasMore">上拉加载更多</text>
        <text v-else>已显示全部 {{ total }} 个站点</text>
      </view>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import BrandHeader from '@/components/BrandHeader.vue'
import { formatDistanceKm } from '@/common/location'
import { openNavigation } from '@/common/mapNavigation'
import type { FuelStation } from '@/types/domain'
import { useFuel } from './useFuel'

const { prices, stations, total, hasMore, loadingMore, updatedAt, priceSource, priceRegion, loadFuel } = useFuel()
async function navigateToStation(station: FuelStation) {
  try { await openNavigation({ latitude: station.latitude, longitude: station.longitude, name: station.name, address: station.address }) }
  catch { uni.showToast({ title: '当前环境无法唤起地图', icon: 'none' }) }
}
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
.station-heading { display: flex; align-items: center; justify-content: space-between; }.station-heading > text:last-child { color: var(--chumen-muted); font-size: 22rpx; }
.station-more { padding: 20rpx 0 4rpx; color: var(--chumen-muted); font-size: 22rpx; text-align: center; }
.station-card { display: flex; align-items: center; min-height: 178rpx; margin-bottom: 22rpx; padding: 24rpx 28rpx; }
.station-info { flex: 1; min-width: 0; padding-right: 18rpx; }.station-name,.station-meta,.station-prices { display: block; }
.station-name { overflow: hidden; color: var(--chumen-ink); font-size: 28rpx; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.station-meta,.station-prices { margin-top: 10rpx; color: var(--chumen-muted); font-size: 22rpx; }.station-prices b { color: var(--chumen-ink); }
.navigate-button { min-width: 142rpx; min-height: 72rpx; margin: 0; padding: 0 26rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 26rpx; line-height: 72rpx; }
</style>
