<template>
  <AppShell>
    <view v-if="detail" class="detail-page">
      <view class="header-over-hero"><PageHeader title="路线详情" /></view>
      <DetailHero :item="detail" />
      <view class="detail-body">
        <view v-if="loadState === 'fallback'" class="detail-notice" role="status"><text>网络不太稳定，当前显示本地路线资料</text><button @click="loadDetail">重试</button></view>
        <view class="summary-card">
          <view><text>{{ detail.durationLabel }}</text><text>预计耗时</text></view><view><text>{{ detail.bestTime }}</text><text>推荐时段</text></view><view><text>{{ detail.carType || '--' }}</text><text>车型建议</text></view>
        </view>
        <text class="section-title">路线信息</text>
        <view class="info-list">
          <view><text>出发地</text><text>{{ detail.startPoint || '--' }}</text></view><view><text>终点</text><text>{{ detail.endPoint || '--' }}</text></view><view><text>最佳时段</text><text>{{ detail.bestTime }}</text></view><view><text>车型建议</text><text>{{ detail.carType || '--' }}</text></view>
        </view>
        <template v-if="detail.description"><text class="section-title">路线介绍</text><text class="description">{{ detail.description }}</text></template>
      </view>
      <DetailActionBar :favorite="isFavorite" @favorite="toggleFavorite" @share="share" @start="start" />
    </view>
    <view v-else-if="loadState === 'loading'"><DetailSkeleton /></view>
    <view v-else class="loading error-state" role="alert"><text>{{ loadError }}</text><button @click="loadDetail">重试</button></view>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShareAppMessage, onShow } from '@dcloudio/uni-app'
import AppShell from '@/components/AppShell.vue'
import DetailActionBar from '@/components/DetailActionBar.vue'
import DetailHero from '@/components/DetailHero.vue'
import DetailSkeleton from '@/components/DetailSkeleton.vue'
import PageHeader from '@/components/PageHeader.vue'
import { outdoorApi } from '@/api/outdoor'
import { userFacingError } from '@/common/apiErrors'
import { launchLock } from '@/common/launchLock'
import { openNavigation } from '@/common/mapNavigation'
import { withRealDistance } from '@/common/location'
import { requireAuthThen } from '@/common/requireAuth'
import { useUserLocation } from '@/common/userLocation'
import { driveRoutes } from '@/data/mock'
import { useAuthStore } from '@/stores/auth'
import type { RouteDetail } from '@/types/domain'

const detail = ref<RouteDetail>()
const loadState = ref<'loading' | 'ready' | 'fallback' | 'error'>('loading')
const loadError = ref('路线加载失败，请重试')
let requestedId = 'bafen-shanlu'
const authStore = useAuthStore()
const { ensureLocation } = useUserLocation()
const isFavorite = ref(false)
const favoritePending = ref(false)

onLoad(async (query) => {
  requestedId = String(query?.routeId || 'bafen-shanlu')
  await loadDetail()
})
onShow(() => { void loadFavorite() })
onShareAppMessage(() => ({ title: detail.value?.title || '粗门溜溜路线', path: `/pages/route-detail/index?routeId=${detail.value?.id || ''}` }))

async function loadFavorite() {
  await launchLock.waitReady()
  if (!detail.value || !authStore.isAuthenticated) { isFavorite.value = false; return }
  try { isFavorite.value = (await outdoorApi.favorites('drive')).some((item) => item.id === detail.value?.id) }
  catch { /* 收藏列表失败不影响公开详情，写操作仍会显示明确错误。 */ }
}
async function loadDetail() {
  loadState.value = 'loading'
  loadError.value = '路线加载失败，请重试'
  const point = await ensureLocation()
  try {
    detail.value = withRealDistance(await outdoorApi.route(requestedId), point)
    loadState.value = 'ready'
  } catch (error) {
    const localDetail = driveRoutes.find((item) => item.id === requestedId)
    detail.value = localDetail ? withRealDistance(localDetail, point) : undefined
    if (localDetail) loadState.value = 'fallback'
    else {
      loadState.value = 'error'
      loadError.value = userFacingError(error, '路线不存在或已下线')
    }
  }
  await loadFavorite()
}
async function toggleFavorite() {
  const item = detail.value
  if (!item || favoritePending.value) return
  favoritePending.value = true
  try {
    // 游客：先静默登录，登录成功后自动完成本次收藏，无需再点一次
    const result = await requireAuthThen(async () => {
      if (isFavorite.value) await outdoorApi.removeFavorite(item.id)
      else await outdoorApi.addFavorite(item.id)
      return !isFavorite.value
    })
    if (!result.ok) return
    isFavorite.value = result.value
    uni.showToast({ title: isFavorite.value ? '已收藏' : '已取消收藏', icon: 'none' })
  } catch (error) {
    uni.showToast({ title: userFacingError(error, '收藏操作失败，请重试'), icon: 'none' })
  } finally { favoritePending.value = false }
}
function share() { uni.showToast({ title: '已准备分享卡片', icon: 'none' }) }
async function start() {
  if (!detail.value) return
  try { await openNavigation({ latitude: detail.value.latitude, longitude: detail.value.longitude, name: detail.value.title, address: detail.value.endPoint || undefined }) }
  catch { uni.showToast({ title: '当前环境无法唤起地图', icon: 'none' }) }
}
</script>

<style scoped lang="scss">
/* 底部留白必须覆盖固定操作栏（116rpx）+ 安全区，否则「路线介绍」末行被底栏压住 */
.detail-page { padding-bottom: calc(160rpx + env(safe-area-inset-bottom)); }.header-over-hero { position: absolute; z-index: 10; top: 0; right: 24rpx; left: 24rpx; color: #fff; }.header-over-hero :deep(.page-header) { margin-top: 0; padding-top: var(--chumen-top-inset, var(--status-bar-height, 0px)); color: #fff; }.header-over-hero :deep(.back) { color: #fff; background: rgba(0,0,0,.22); border-color: rgba(255,255,255,.38); }
.detail-body { padding: 30rpx 32rpx; }.summary-card { display: flex; padding: 30rpx 12rpx; border-radius: 30rpx; background: var(--chumen-soft); }.summary-card > view { flex: 1; text-align: center; }.summary-card > view + view { border-left: 2rpx solid var(--chumen-line); }.summary-card text { display: block; }.summary-card text:first-child { font-size: 29rpx; font-weight: 900; }.summary-card text:last-child { margin-top: 8rpx; color: var(--chumen-muted); font-size: 20rpx; }
.info-list > view { display: flex; padding: 12rpx 0; font-size: 25rpx; }.info-list > view text:first-child { width: 150rpx; flex-shrink: 0; color: var(--chumen-muted); }.info-list > view text:last-child { flex: 1; color: var(--chumen-ink); }.description { display: block; color: var(--chumen-muted); font-size: 26rpx; line-height: 1.8; }
.detail-notice { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22rpx; padding: 18rpx 22rpx; border-radius: 22rpx; background: var(--chumen-soft); color: var(--chumen-muted); font-size: 22rpx; }.detail-notice button,.error-state button { min-height: 54rpx; margin-left: 18rpx; padding: 0 24rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 22rpx; line-height: 54rpx; }
.loading { display: flex; flex-direction: column; align-items: center; padding: 40vh 32rpx 0; color: var(--chumen-muted); text-align: center; }.loading text { margin-top: 18rpx; }.error-state button { margin: 24rpx 0 0; }
</style>
