<template>
  <AppShell>
    <view class="page-content favorites-page">
      <PageHeader title="我的收藏" fallback="/pages/mine/index" />
      <SceneTabs v-model="scene" />

      <view v-if="loading" class="state"><wd-loading /><text>正在加载收藏…</text></view>
      <view v-else-if="loadError" class="state error-state"><text>{{ loadError }}</text><button @click="load">重试</button></view>
      <view v-else-if="items.length" class="favorite-list">
        <button v-for="item in items" :key="item.id" class="favorite-card card-surface" @click="openItem(item)">
          <image :src="item.thumbUrl" mode="aspectFill" />
          <view class="favorite-copy"><text>{{ item.title }}</text><text>{{ item.subtitle }}</text></view>
          <wd-icon class="heart" name="heart-filled" size="22px" color="#f2545b" />
        </button>
      </view>
      <view v-else class="empty-state"><image class="empty-illustration" src="/static/illustrations/empty-box.png" mode="aspectFit" /><text>暂无收藏</text><button @click="goExplore">去逛逛</button></view>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref, watch } from 'vue'
import AppShell from '@/components/AppShell.vue'
import PageHeader from '@/components/PageHeader.vue'
import SceneTabs from '@/components/SceneTabs.vue'
import { outdoorApi } from '@/api/outdoor'
import { userFacingError } from '@/common/apiErrors'
import { navigate } from '@/common/router'
import { requireAuth } from '@/common/requireAuth'
import { useAppShare } from '@/common/appShare'
import type { FavoriteItem, Scene } from '@/types/domain'

const scene = ref<Scene>('drive')
const items = ref<FavoriteItem[]>([])
const loading = ref(false)
const loadError = ref('')

onShow(() => { void load() })
watch(scene, () => { void load() })

async function load() {
  if (!await requireAuth()) return
  loading.value = true
  loadError.value = ''
  try { items.value = await outdoorApi.favorites(scene.value) }
  catch (error) { items.value = []; loadError.value = userFacingError(error, '收藏加载失败，请稍后重试') }
  finally { loading.value = false }
}

function openItem(item: FavoriteItem) {
  const path = item.type === 'spot' ? '/pages/fishing-detail/index' : '/pages/route-detail/index'
  void navigate(path, item.type === 'spot' ? { spotId: item.id } : { routeId: item.id })
}
function goExplore() { void navigate('/pages/index/index') }

useAppShare('我的收藏 · 好去处一起溜｜粗门溜溜', '/pages/favorites/index')
</script>

<style scoped lang="scss">
.favorite-list { margin-top: 20rpx; }.favorite-card { display: flex; align-items: center; width: 100%; min-height: 176rpx; margin: 0 0 22rpx; padding: 20rpx; color: var(--chumen-ink); text-align: left; line-height: 1.3; }.favorite-card image { width: 132rpx; height: 132rpx; flex-shrink: 0; border-radius: 24rpx; }.favorite-copy { flex: 1; min-width: 0; padding: 0 22rpx; }.favorite-copy text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.favorite-copy text:first-child { font-size: 28rpx; font-weight: 800; }.favorite-copy text:last-child { margin-top: 12rpx; color: var(--chumen-muted); font-size: 22rpx; }.heart { color: #f2545b; font-size: 38rpx; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding-top: 70rpx; color: var(--chumen-muted); }.empty-illustration { width: 340rpx; height: 340rpx; }.empty-state > text { margin: 6rpx 0 30rpx; font-size: 28rpx; }.empty-state button { min-width: 180rpx; min-height: 72rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); font-size: 26rpx; line-height: 72rpx; }
.state { display: flex; flex-direction: column; align-items: center; padding-top: 150rpx; color: var(--chumen-muted); font-size: 25rpx; }.state text { margin-top: 18rpx; }.error-state button { min-width: 160rpx; min-height: 68rpx; margin-top: 24rpx; border-radius: 999rpx; background: var(--chumen-ink); color: var(--chumen-lime); line-height: 68rpx; }
</style>
