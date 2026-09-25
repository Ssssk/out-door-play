<template>
  <view class="brand-header">
    <view class="brand-lockup">
      <text class="brand-title">{{ title }}</text>
      <image class="brand-underline" src="/static/icons/brand-underline.svg" mode="scaleToFill" />
    </view>
    <WeatherBanner :city-name="appStore.city.name" :weather="weatherStore.weather" />
    <button class="city-chip" :aria-label="`选择城市，当前已选${appStore.city.name}`" @click="showPicker = true">
      <image src="/static/icons/location.svg" mode="aspectFit" />
      <text>{{ appStore.city.name }}</text>
    </button>
  </view>

  <wd-popup v-model="showPicker" position="bottom" :safe-area-inset-bottom="true" :z-index="1100" custom-style="max-width:430px;margin:0 auto;border-radius:24px 24px 0 0;">
    <view class="city-sheet">
      <view class="sheet-header"><text>选择城市</text><wd-icon name="close" size="22px" @click="showPicker = false" /></view>
      <view v-if="citiesFallback" class="city-notice" role="status">
        <text>城市服务暂不可用，当前显示本地城市列表</text>
        <button :disabled="citiesLoading" @click="$emit('retry-cities')">{{ citiesLoading ? '重试中…' : '重试' }}</button>
      </view>
      <view v-else-if="citiesLoading" class="city-notice" role="status"><text>正在加载可用城市…</text></view>
      <view class="city-grid">
        <button v-for="city in cities" :key="city.code" class="city-option" :class="{ active: city.code === appStore.city.code }" @click="selectCity(city)">{{ city.name }}</button>
      </view>
    </view>
  </wd-popup>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import WeatherBanner from '@/components/WeatherBanner.vue'
import { cities as localCities } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import { useWeatherStore } from '@/stores/weather'
import type { City } from '@/types/domain'

withDefaults(defineProps<{ title?: string; cities?: City[]; citiesLoading?: boolean; citiesFallback?: boolean }>(), {
  title: '粗门溜溜',
  cities: () => localCities,
  citiesLoading: false,
  citiesFallback: false,
})
const emit = defineEmits<{ change: [city: City]; 'retry-cities': [] }>()
const appStore = useAppStore()
// 天气取自共享 store，任何使用品牌栏的页面都会展示同一份数据
const weatherStore = useWeatherStore()
const showPicker = ref(false)

// 由此触发首次拉取：store 对同一城市去重，因此多个页面都挂品牌栏也不会重复请求
onMounted(() => { void weatherStore.load() })

function selectCity(city: City) {
  const changed = city.code !== appStore.city.code
  if (changed) appStore.selectCity(city)
  showPicker.value = false
  if (changed) emit('change', city)
}
</script>

<style scoped lang="scss">
/* z-index 高于吸顶的 SceneTabs(30)：tab 盒子为覆盖状态栏会上移与头部底部重叠，头部内容需保持可点可见 */
.brand-header { position: relative; z-index: 31; display: flex; align-items: center; width: 100%; padding-top: 16rpx; }
.brand-lockup { position: relative; display: inline-flex; min-width: 0; margin-right: auto; flex-direction: column; }
.brand-title { position: relative; z-index: 1; font-size: 48rpx; line-height: 1.15; font-weight: 900; letter-spacing: -2rpx; color: var(--chumen-ink); white-space: nowrap; }
.brand-underline { width: 210rpx; height: 18rpx; margin-top: -2rpx; }
.city-chip { display: flex; align-items: center; min-height: 58rpx; flex-shrink: 0; padding: 0 24rpx; margin: 0 0 0 24rpx; border: 2rpx solid var(--chumen-line); border-radius: 999rpx; background: rgba(255,255,255,.8); color: var(--chumen-text); font-size: 24rpx; line-height: 58rpx; white-space: nowrap; }
.city-chip image { width: 24rpx; height: 24rpx; margin-right: 10rpx; }
.city-sheet { padding: 34rpx 32rpx 28rpx; }
.sheet-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28rpx; font-size: 34rpx; font-weight: 800; }
.city-notice { display: flex; align-items: center; justify-content: space-between; margin: -8rpx 0 20rpx; padding: 16rpx 20rpx; border-radius: 18rpx; background: var(--chumen-soft); color: var(--chumen-muted); font-size: 22rpx; }
.city-notice text { flex: 1; }
.city-notice button { min-height: 54rpx; margin-left: 16rpx; padding: 0 22rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 22rpx; line-height: 54rpx; }
.city-grid { display: flex; flex-wrap: wrap; margin: -8rpx; }
.city-option { width: calc(25% - 16rpx); margin: 8rpx; min-height: 72rpx; padding: 0; border: 2rpx solid var(--chumen-line); border-radius: 999rpx; background: #fff; color: var(--chumen-ink); font-size: 26rpx; line-height: 72rpx; }
.city-option.active { border-color: var(--chumen-ink); background: var(--chumen-ink); color: var(--chumen-lime); }
</style>
