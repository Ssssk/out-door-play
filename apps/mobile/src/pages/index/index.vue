<template>
  <AppShell>
    <view class="page-content discovery-page">
      <BrandHeader
        :cities="availableCities"
        :cities-loading="citiesLoading"
        :cities-fallback="citiesFallback"
        @change="loadRoutes()"
        @retry-cities="loadCities(true)"
      />

      <SceneTabs :model-value="scene" @update:model-value="changeScene" />

      <!-- 加载中（含下拉刷新）用骨架卡占位：避免旧列表挂半天、新数据到了才突然切换 -->
      <view v-if="status === 'loading' || loading" class="route-list">
        <RouteCardSkeleton v-for="index in 3" :key="index" />
      </view>

      <view v-else-if="status === 'empty'" class="result-state" role="status">
        <text class="state-title">这个城市暂时没有推荐</text>
        <text>可以换个城市或场景再看看</text>
        <button @click="loadRoutes()">重新加载</button>
      </view>

      <view v-else-if="status === 'error'" class="result-state" role="alert">
        <text class="state-title">推荐加载失败</text>
        <text>请检查网络后重试</text>
        <button @click="loadRoutes()">重试</button>
      </view>

      <view v-else class="route-list">
        <DiscoveryCard v-for="route in routes" :key="route.id" :item="route" @click="openDetail" />
      </view>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import BrandHeader from '@/components/BrandHeader.vue'
import DiscoveryCard from '@/components/DiscoveryCard.vue'
import RouteCardSkeleton from '@/components/RouteCardSkeleton.vue'
import SceneTabs from '@/components/SceneTabs.vue'
import { onShareAppMessage } from '@dcloudio/uni-app'
import { navigate } from '@/common/router'
import type { RouteCard } from '@/types/domain'
import { useDiscovery } from './useDiscovery'

const {
  scene,
  routes,
  availableCities,
  loading,
  citiesLoading,
  citiesFallback,
  status,
  loadCities,
  loadRoutes,
  changeScene,
} = useDiscovery()

function openDetail(item: RouteCard) {
  const path = item.scene === 'fish' ? '/pages/fishing-detail/index' : '/pages/route-detail/index'
  void navigate(path, item.scene === 'fish' ? { spotId: item.id } : { routeId: item.id })
}

onShareAppMessage(() => ({ title: '粗门溜溜 · 周末一起出门溜溜', path: '/pages/index/index' }))
</script>

<style scoped lang="scss">
.discovery-page { padding-bottom: 56rpx; }
.loading-state { display: flex; flex-direction: column; align-items: center; padding: 160rpx 0; color: var(--chumen-muted); font-size: 26rpx; }
.loading-state text { margin-top: 18rpx; }
.result-state { display: flex; flex-direction: column; align-items: center; padding: 150rpx 32rpx; color: var(--chumen-muted); font-size: 24rpx; text-align: center; }
.result-state .state-title { margin-bottom: 12rpx; color: var(--chumen-ink); font-size: 32rpx; font-weight: 900; }
.result-state button { min-height: 60rpx; margin-top: 24rpx; padding: 0 28rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 23rpx; line-height: 60rpx; }
.fallback-notice button { min-height: 52rpx; margin: 0 0 0 20rpx; line-height: 52rpx; }
</style>
