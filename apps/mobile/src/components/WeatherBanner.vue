<template>
  <view class="weather-inline" role="group" :aria-label="ariaLabel">
    <image class="weather-icon" :src="iconUrl" mode="aspectFit" />
    <view class="weather-text">
      <text class="weather-temp">{{ tempLabel }}</text>
      <text class="weather-desc">{{ descLabel }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Weather } from '@/types/domain'

const props = defineProps<{ cityName?: string; weather?: Weather | null }>()

// 暂无数据时按 RULE-MOB-006 降级展示
const EMPTY = '——'
const EMPTY_DESC = '暂无数据'
const DEFAULT_ICON = 'weather-sun.svg'

const iconUrl = computed(() => `/static/icons/${props.weather?.icon || DEFAULT_ICON}`)
const tempLabel = computed(() => (typeof props.weather?.temp === 'number' ? `${Math.round(props.weather.temp)}°` : EMPTY))
const descLabel = computed(() => props.weather?.desc?.trim() || EMPTY_DESC)
const ariaLabel = computed(() => `${props.cityName || ''}当前天气 ${tempLabel.value} ${descLabel.value}`)
</script>

<style scoped lang="scss">
/* 内联在品牌行右侧：裸图标 + 温度/描述上下两行，无卡片底色与描边 */
.weather-inline { display: flex; align-items: center; flex-shrink: 0; }
.weather-icon { width: 40rpx; height: 40rpx; flex-shrink: 0; margin-right: 12rpx; }
.weather-text { display: flex; flex-direction: column; align-items: flex-start; }
.weather-temp { font-size: 36rpx; font-weight: 700; line-height: 1.1; color: var(--chumen-ink); }
.weather-desc { font-size: 24rpx; line-height: 1.2; color: var(--chumen-muted); }
</style>
