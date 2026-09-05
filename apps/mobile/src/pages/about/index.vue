<template>
  <AppShell>
    <view class="page-content about-page">
      <PageHeader title="关于粗门溜溜" fallback="/pages/mine/index" />
      <view class="brand-block"><view class="brand-logo">CL</view><text class="brand-name">粗门溜溜</text><text class="slogan">世界那么大，值得去看看</text></view>
      <text class="section-title">我们做什么</text>
      <view class="feature-list">
        <view v-for="feature in features" :key="feature.title" class="feature-card card-surface"><view class="feature-icon" :class="feature.tone"><wd-icon :name="feature.icon" size="24px" /></view><view><text>{{ feature.title }}</text><text>{{ feature.description }}</text></view></view>
      </view>
      <text class="copyright">© 2026 粗门溜溜团队</text>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import PageHeader from '@/components/PageHeader.vue'
const features = [
  { title: '溜车路线探索', description: '发现城市周边值得跑一趟的山路与风景。', icon: 'road', tone: 'lime' },
  { title: '钓点共创', description: '和钓友共享真实、负责、可持续的钓点信息。', icon: 'fish', tone: 'sky' },
  { title: '加油服务', description: '在出发前掌握油价，快速找到附近补给点。', icon: 'service', tone: 'amber' },
]
</script>

<style scoped lang="scss">
.about-page { min-height: 100vh; }.brand-block { display: flex; flex-direction: column; align-items: center; padding: 70rpx 0 38rpx; }.brand-logo { display: flex; align-items: center; justify-content: center; width: 154rpx; height: 154rpx; border-radius: 44rpx; background: var(--chumen-lime); color: var(--chumen-ink); font-size: 48rpx; font-weight: 900; transform: rotate(-4deg); }.brand-name { margin-top: 28rpx; color: var(--chumen-ink); font-size: 40rpx; font-weight: 900; }.slogan { margin-top: 10rpx; color: var(--chumen-muted); font-size: 24rpx; }
.feature-card { display: flex; align-items: center; min-height: 146rpx; margin-bottom: 22rpx; padding: 24rpx 28rpx; }.feature-icon { display: flex; align-items: center; justify-content: center; width: 82rpx; height: 82rpx; flex-shrink: 0; margin-right: 24rpx; border-radius: 24rpx; color: var(--chumen-ink); }.feature-icon.lime { background: var(--chumen-lime); }.feature-icon.sky { background: #dff2ff; }.feature-icon.amber { background: #ffedc5; }.feature-card text { display: block; }.feature-card text:first-child { font-size: 29rpx; font-weight: 800; }.feature-card text:last-child { margin-top: 8rpx; color: var(--chumen-muted); font-size: 22rpx; line-height: 1.5; }.copyright { display: block; margin: 80rpx 0 30rpx; color: #aaa39a; font-size: 21rpx; text-align: center; }
</style>
