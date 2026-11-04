<template>
  <AppShell>
    <view class="page-content history-page">
      <PageHeader :title="grade ? `${grade} · 历史油价` : '历史油价'" fallback="/pages/fuel/index" />

      <view v-if="loading" class="state" role="status">
        <wd-loading color="#1a1a1a" />
        <text>正在加载历史调价…</text>
      </view>
      <view v-else-if="loadError" class="state" role="alert">
        <text>{{ loadError }}</text>
        <button @click="load">重试</button>
      </view>

      <template v-else>
        <view class="summary card-surface">
          <text class="summary-label">{{ region ? `${region}参考价` : '省级参考价' }}</text>
          <text class="summary-price">{{ latest ? latest.price.toFixed(2) : '—' }}<text class="summary-unit"> 元/升</text></text>
          <text class="summary-meta">{{ latest ? latest.date : '—' }} 调价 · 共 {{ items.length }} 期记录</text>
        </view>

        <view class="chart-card card-surface">
          <view class="section-head">
            <text class="section-title">价格走势</text>
            <text class="chart-range">{{ maxPrice.toFixed(2) }} ~ {{ minPrice.toFixed(2) }}</text>
          </view>
          <view v-if="chart.coords.length" class="chart-wrap">
            <view class="chart-area" :style="{ width: chartWidth + 'rpx', height: chartHeight + 'rpx' }">
              <view
                v-for="(line, index) in chart.lines"
                :key="'line-' + index"
                class="chart-line"
                :style="{ left: line.left + 'rpx', top: line.top + 'rpx', width: line.width + 'rpx', transform: 'rotate(' + line.angle + 'deg)' }"
              />
              <view
                v-for="(coord, index) in chart.coords"
                :key="'dot-' + index"
                class="chart-dot"
                :class="{ latest: index === chart.coords.length - 1 }"
                :style="{ left: coord.x + 'rpx', top: coord.y + 'rpx' }"
              />
            </view>
            <view class="chart-axis"><text>{{ firstDate }}</text><text>{{ lastDate }}</text></view>
          </view>
          <text v-else class="chart-empty">暂无可用的走势数据</text>
          <text v-if="items.length === 1" class="chart-note">历史调价逐期记录，下次调价后即可看到走势连线</text>
        </view>

        <view class="section-head list-head"><text class="section-title">每次调价</text></view>
        <view v-if="items.length === 0" class="state" role="status">
          <text>暂无历史调价记录</text>
          <text class="state-hint">每次成品油调价会自动记录一期，稍后再来看看</text>
        </view>
        <view v-else class="history-list">
          <view v-for="(item, index) in items" :key="item.date" class="history-row">
            <view class="history-date">
              <text>{{ formatDate(item.date) }}</text>
              <text v-if="index === 0" class="latest-badge">最新</text>
            </view>
            <text class="history-price">{{ item.price.toFixed(2) }} 元/升</text>
            <text class="history-change" :class="item.change > 0 ? 'up' : item.change < 0 ? 'down' : 'flat'">{{ changeText(item.change) }}</text>
          </view>
        </view>
      </template>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import AppShell from '@/components/AppShell.vue'
import PageHeader from '@/components/PageHeader.vue'
import { outdoorApi } from '@/api/outdoor'
import { userFacingError } from '@/common/apiErrors'
import { useAppStore } from '@/stores/app'
import { buildPriceChart, CHART_HEIGHT, CHART_WIDTH } from '../priceChart'
import { decodeQueryParam } from './routeParams'
import type { FuelPriceHistoryItem } from '@/types/domain'

const appStore = useAppStore()
const grade = ref('')
const items = ref<FuelPriceHistoryItem[]>([])
const region = ref('')
const loading = ref(true)
const loadError = ref('')
const chartWidth = CHART_WIDTH
const chartHeight = CHART_HEIGHT

// 接口按日期倒序（最新在前），走势图按时间正序绘制
const chart = computed(() =>
  buildPriceChart([...items.value].reverse().map((item) => ({ date: item.date, price: item.price }))),
)
const latest = computed(() => items.value[0] ?? null)
const minPrice = computed(() => chart.value.min)
const maxPrice = computed(() => chart.value.max)
const firstDate = computed(() => chart.value.coords[0]?.date ?? '')
const lastDate = computed(() => chart.value.coords[chart.value.coords.length - 1]?.date ?? '')

onLoad((query) => {
  // 小程序不保证 onLoad 的 query 已解码，统一解一次，避免标题乱码与请求参数二次编码
  grade.value = decodeQueryParam(query?.grade)
  void load()
})
onPullDownRefresh(async () => {
  await load()
  uni.stopPullDownRefresh()
})

async function load() {
  if (!grade.value) {
    loadError.value = '缺少油品参数，请从今日油价页进入'
    loading.value = false
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const result = await outdoorApi.fuelPriceHistory(appStore.city.code, grade.value)
    items.value = result.items
    region.value = result.region
  } catch (error) {
    loadError.value = userFacingError(error, '历史油价加载失败')
  } finally {
    loading.value = false
  }
}

function formatDate(date: string) { return date.replace(/-/g, '/') }
function changeText(change: number) {
  if (change === 0) return '持平'
  return `${change > 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(2)}`
}
</script>

<style scoped lang="scss">
.history-page { padding-bottom: 56rpx; }
.state { display: flex; flex-direction: column; align-items: center; gap: 16rpx; padding: 120rpx 32rpx; color: var(--chumen-muted); font-size: 26rpx; text-align: center; }
.state button { min-height: 60rpx; margin-top: 8rpx; padding: 0 30rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 24rpx; line-height: 60rpx; }
.state-hint { font-size: 22rpx; }
.summary { display: flex; flex-direction: column; gap: 8rpx; padding: 32rpx; border-radius: 34rpx; }
.summary-label, .summary-meta { color: var(--chumen-muted); font-size: 24rpx; }
.summary-price { color: var(--chumen-ink); font-size: 60rpx; font-weight: 900; }
.summary-unit { font-size: 24rpx; font-weight: 500; }
.section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.section-title { color: var(--chumen-ink); font-size: 30rpx; font-weight: 800; }
.chart-range { color: var(--chumen-muted); font-size: 22rpx; }
.chart-card { margin-top: 28rpx; padding: 28rpx 24rpx; border-radius: 34rpx; }
.chart-wrap { display: flex; align-items: center; flex-direction: column; }
.chart-area { position: relative; }
.chart-line { position: absolute; height: 4rpx; border-radius: 2rpx; background: var(--chumen-ink); transform-origin: 0 50%; }
.chart-dot { position: absolute; width: 14rpx; height: 14rpx; margin: -7rpx 0 0 -7rpx; border: 2rpx solid var(--chumen-soft); border-radius: 50%; background: var(--chumen-ink); }
.chart-dot.latest { border-color: var(--chumen-ink); background: var(--chumen-lime); }
.chart-axis { display: flex; justify-content: space-between; width: 620rpx; margin-top: 8rpx; color: var(--chumen-muted); font-size: 20rpx; }
.chart-empty, .chart-note { display: block; padding: 40rpx 0 8rpx; color: var(--chumen-muted); font-size: 22rpx; text-align: center; }
.list-head { margin: 40rpx 0 4rpx; }
.history-list { overflow: hidden; border: 2rpx solid var(--chumen-line); border-radius: 28rpx; }
.history-row { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; padding: 26rpx 24rpx; border-bottom: 2rpx solid var(--chumen-line); }
.history-row:last-child { border-bottom: 0; }
.history-date { display: flex; align-items: center; gap: 10rpx; color: var(--chumen-ink); font-size: 26rpx; font-weight: 700; }
.latest-badge { padding: 2rpx 12rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 18rpx; }
.history-price { color: var(--chumen-ink); font-size: 26rpx; font-weight: 800; }
.history-change { min-width: 110rpx; font-size: 24rpx; text-align: right; }
.up { color: #e5484d; }.down { color: #2ba24c; }.flat { color: var(--chumen-muted); }
</style>
