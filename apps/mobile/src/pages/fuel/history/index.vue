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
        <view class="chart-card card-surface">
          <view class="section-head">
            <text class="section-title">价格走势</text>
          </view>
          <view v-if="chart.coords.length" class="chart-wrap">
            <view class="chart-area" :style="{ width: chartWidth + 'rpx', height: chartHeight + 'rpx' }">
              <view
                v-for="(tick, index) in chart.yTicks"
                :key="'grid-' + index"
                class="chart-grid-line"
                :style="{ top: tick.top + 'rpx', left: axisLeft + 'rpx', width: (chartWidth - axisLeft) + 'rpx' }"
              />
              <view class="chart-axis-y" :style="{ left: axisLeft + 'rpx', height: axisBottom + 'rpx' }" />
              <view class="chart-axis-x" :style="{ left: axisLeft + 'rpx', top: axisBottom + 'rpx', width: (chartWidth - axisLeft) + 'rpx' }" />
              <text class="chart-unit">元/升</text>
              <text
                v-for="(tick, index) in chart.yTicks"
                :key="'y-label-' + index"
                class="chart-y-label"
                :style="{ top: (tick.top - 12) + 'rpx', width: (axisLeft - 10) + 'rpx' }"
              >{{ tick.label }}</text>
              <view class="chart-reveal" :style="{ height: chartHeight + 'rpx' }">
                <view class="chart-lines" :style="{ width: chartWidth + 'rpx', height: chartHeight + 'rpx' }">
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
                    :class="{ latest: index === chart.coords.length - 1, selected: index === selectedIndex }"
                    :style="{ left: coord.x + 'rpx', top: coord.y + 'rpx', animationDelay: dotDelay(coord.x) }"
                  />
                  <view
                    v-for="(coord, index) in chart.coords"
                    :key="'hit-' + index"
                    class="chart-hit"
                    :style="{ left: coord.x + 'rpx', top: coord.y + 'rpx' }"
                    @click="selectPoint(index)"
                  />
                </view>
              </view>
              <view v-if="tooltip" class="chart-tooltip" :style="{ left: tooltip.left + 'rpx', top: tooltip.top + 'rpx' }">
                <text class="tooltip-price">{{ tooltip.price }} 元/升</text>
                <text class="tooltip-date">{{ tooltip.date }}</text>
              </view>
            </view>
            <view class="chart-x-axis" :style="{ width: chartWidth + 'rpx' }">
              <text
                v-for="(tick, index) in chart.xTicks"
                :key="'x-label-' + index"
                class="chart-x-label"
                :class="'tick-' + tick.align"
                :style="{ left: tick.left + 'rpx' }"
              >{{ tick.label }}</text>
            </view>
          </view>
          <text v-else class="chart-empty">暂无可用的走势数据</text>
          <text v-if="items.length === 1" class="chart-note">历史调价逐期记录，下次调价后即可看到走势连线</text>
        </view>

        <view class="section-head list-head"><text class="section-title">近半年油价</text></view>
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
import { onLoad, onPullDownRefresh, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import AppShell from '@/components/AppShell.vue'
import PageHeader from '@/components/PageHeader.vue'
import { outdoorApi } from '@/api/outdoor'
import { userFacingError } from '@/common/apiErrors'
import { useAppStore } from '@/stores/app'
import { buildChartTooltip, buildPriceChart, CHART_AXIS_BOTTOM, CHART_AXIS_LEFT, CHART_HEIGHT, CHART_WIDTH } from '../priceChart'
import { decodeQueryParam } from './routeParams'
import type { FuelPriceHistoryItem } from '@/types/domain'

const appStore = useAppStore()
const grade = ref('')
const items = ref<FuelPriceHistoryItem[]>([])
const loading = ref(true)
const loadError = ref('')
const selectedIndex = ref<number | null>(null)
const chartWidth = CHART_WIDTH
const chartHeight = CHART_HEIGHT
const axisLeft = CHART_AXIS_LEFT
const axisBottom = CHART_AXIS_BOTTOM
// 与 .chart-reveal 的 900ms 动画保持一致
const REVEAL_MS = 900

// 接口按日期倒序（最新在前），走势图按时间正序绘制
const chart = computed(() =>
  buildPriceChart([...items.value].reverse().map((item) => ({ date: item.date, price: item.price }))),
)
const tooltip = computed(() => {
  if (selectedIndex.value === null) return null
  const coord = chart.value.coords[selectedIndex.value]
  return coord ? buildChartTooltip(coord, chartWidth) : null
})

// 圆点按 x 位置延迟出现，与折线从左到右展开的进度同步
function dotDelay(x: number) {
  return Math.round((x / chartWidth) * (REVEAL_MS - 100)) + 'ms'
}
function selectPoint(index: number) {
  selectedIndex.value = selectedIndex.value === index ? null : index
}

onLoad((query) => {
  // 小程序不保证 onLoad 的 query 已解码，统一解一次，避免标题乱码与请求参数二次编码
  grade.value = decodeQueryParam(query?.grade)
  void load()
})
onPullDownRefresh(async () => {
  await load()
  uni.stopPullDownRefresh()
})
// 右上角菜单转发/朋友圈分享：带上油品参数，好友点开直达同一油号的历史油价
const shareTitle = computed(() => (grade.value ? `${grade.value} · 近半年油价走势` : '粗门溜溜 · 近半年油价走势'))
onShareAppMessage(() => ({
  title: shareTitle.value,
  path: grade.value ? `/pages/fuel/history/index?grade=${encodeURIComponent(grade.value)}` : '/pages/fuel/history/index',
}))
onShareTimeline(() => ({
  title: shareTitle.value,
  query: grade.value ? `grade=${encodeURIComponent(grade.value)}` : '',
}))

async function load() {
  if (!grade.value) {
    loadError.value = '缺少油品参数，请从今日油价页进入'
    loading.value = false
    return
  }
  loading.value = true
  loadError.value = ''
  selectedIndex.value = null
  try {
    const result = await outdoorApi.fuelPriceHistory(appStore.city.code, grade.value)
    items.value = result.items
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
.section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.section-title { color: var(--chumen-ink); font-size: 30rpx; font-weight: 800; }
.chart-card { margin-top: 28rpx; padding: 28rpx 24rpx; border-radius: 34rpx; }
.chart-wrap { display: flex; align-items: center; flex-direction: column; }
.chart-area { position: relative; }
.chart-grid-line { position: absolute; height: 2rpx; background: var(--chumen-line); }
.chart-axis-y { position: absolute; top: 0; width: 2rpx; background: var(--chumen-ink); opacity: .18; }
.chart-axis-x { position: absolute; height: 2rpx; background: var(--chumen-ink); opacity: .18; }
.chart-unit { position: absolute; left: 0; top: 0; color: var(--chumen-muted); font-size: 16rpx; }
.chart-y-label { position: absolute; left: 0; color: var(--chumen-muted); font-size: 18rpx; line-height: 24rpx; text-align: right; }
.chart-x-axis { position: relative; height: 32rpx; margin-top: 10rpx; color: var(--chumen-muted); font-size: 18rpx; }
.chart-x-label { position: absolute; top: 0; white-space: nowrap; }
.chart-x-label.tick-center { transform: translateX(-50%); }
.chart-x-label.tick-end { transform: translateX(-100%); }
.chart-reveal { position: absolute; left: 0; top: 0; overflow: hidden; animation: chart-reveal 900ms cubic-bezier(.25,.8,.35,1) both; }
.chart-lines { position: relative; }
.chart-line { position: absolute; height: 4rpx; border-radius: 2rpx; background: var(--chumen-ink); transform-origin: 0 50%; }
.chart-dot { position: absolute; width: 14rpx; height: 14rpx; margin: -7rpx 0 0 -7rpx; border: 2rpx solid var(--chumen-soft); border-radius: 50%; background: var(--chumen-ink); animation: chart-dot-in 240ms ease-out both; transition: background-color .15s ease, border-color .15s ease, width .15s ease, height .15s ease, margin .15s ease, box-shadow .15s ease; }
.chart-dot.latest { border-color: var(--chumen-ink); background: var(--chumen-lime); }
.chart-dot.selected { z-index: 1; width: 20rpx; height: 20rpx; margin: -10rpx 0 0 -10rpx; border-color: var(--chumen-ink); background: var(--chumen-lime); box-shadow: 0 0 0 6rpx rgba(204,255,0,.35); }
.chart-hit { position: absolute; z-index: 2; width: 48rpx; height: 48rpx; margin: -24rpx 0 0 -24rpx; background: transparent; }
.chart-tooltip { position: absolute; z-index: 3; display: flex; flex-direction: column; align-items: center; padding: 8rpx 14rpx; border-radius: 16rpx; background: var(--chumen-ink); transform: translateX(-50%); pointer-events: none; box-shadow: 0 6rpx 18rpx rgba(0,0,0,.18); }
.tooltip-price { color: var(--chumen-lime); font-size: 22rpx; font-weight: 800; }
.tooltip-date { margin-top: 4rpx; color: #fff; font-size: 18rpx; }
@keyframes chart-reveal { from { width: 0; } to { width: 100%; } }
@keyframes chart-dot-in { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: scale(1); } }
.chart-empty, .chart-note { display: block; padding: 40rpx 0 8rpx; color: var(--chumen-muted); font-size: 22rpx; text-align: center; }
.list-head { margin: 40rpx 0 4rpx; }
.history-list { overflow: hidden; border: 2rpx solid var(--chumen-line); border-radius: 28rpx; }
.history-row { display: flex; align-items: center; padding: 26rpx 24rpx; border-bottom: 2rpx solid var(--chumen-line); }
.history-row:last-child { border-bottom: 0; }
// 三列定宽：首行「最新」徽章不改变日期列宽度，价格列始终居中对齐
.history-date { flex: 0 0 230rpx; display: flex; align-items: center; gap: 10rpx; white-space: nowrap; color: var(--chumen-ink); font-size: 26rpx; font-weight: 700; }
.latest-badge { flex: 0 0 auto; padding: 2rpx 12rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 18rpx; }
.history-price { flex: 1 1 auto; min-width: 0; text-align: center; color: var(--chumen-ink); font-size: 26rpx; font-weight: 800; }
.history-change { flex: 0 0 110rpx; font-size: 24rpx; text-align: right; }
.up { color: #e5484d; }.down { color: #2ba24c; }.flat { color: var(--chumen-muted); }
</style>
