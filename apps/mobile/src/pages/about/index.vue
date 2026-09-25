<template>
  <AppShell>
    <view class="page-content about-page">
      <PageHeader title="关于粗门溜溜" fallback="/pages/mine/index" />
      <view class="brand-hero">
        <view class="brand-logo"><image class="brand-logo-icon" src="/static/icons/bolt-ink.svg" mode="aspectFit" /></view>
        <text class="brand-name">粗门溜溜</text>
        <text class="brand-tagline">世界那么大，值得去看看</text>
      </view>
      <view class="feature-section">
        <text class="about-section-title">我们做什么</text>
        <view class="feature-grid">
          <view v-for="feature in features" :key="feature.title" class="feature-card">
            <view class="feature-icon" :class="feature.tone"><image class="feature-icon-img" :src="feature.icon" mode="aspectFit" /></view>
            <view class="feature-text"><text class="feature-title">{{ feature.title }}</text><text class="feature-desc">{{ feature.description }}</text></view>
          </view>
        </view>
      </view>
      <text class="copyright">© 2026 粗门溜溜团队</text>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import PageHeader from '@/components/PageHeader.vue'
const features = [
  { title: '路线探索', description: '精选城市周边路线，沿途风景和海拔一目了然', icon: '/static/icons/feature-road.svg', tone: 'tone-lime' },
  { title: '钓点地图', description: '全城钓点一图掌握，季节鱼种随时查', icon: '/static/icons/feature-fish.svg', tone: 'tone-amber' },
  { title: '加油服务', description: '实时油价 + 附近加油站，路上不慌', icon: '/static/icons/feature-fuel.svg', tone: 'tone-sky' },
]
</script>

<style scoped lang="scss">
/* 一比一还原 prototypes/mobile-mine-about.html（设计稿 px × 2 = rpx） */
.about-page { padding-bottom: 64rpx; }

/* 品牌卡：顶部椭圆径向渐变衬底 */
.brand-hero {
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 56rpx 32rpx 44rpx;
  border-radius: 40rpx;
  background: #fdf6ea;
  background: radial-gradient(ellipse at top, #e2f8a8 0%, #fdf6ea 70%, #fff 100%);
}
.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 152rpx;
  height: 152rpx;
  margin-bottom: 28rpx;
  border-radius: 44rpx;
  background: var(--chumen-lime);
  box-shadow: 0 20rpx 48rpx rgba(204, 255, 0, 0.35);
}
.brand-logo-icon { width: 80rpx; height: 80rpx; }
.brand-name { margin-top: 0; color: var(--chumen-ink); font-size: 52rpx; font-weight: 700; letter-spacing: 1rpx; }
.brand-tagline { margin-top: 12rpx; color: var(--chumen-muted); font-size: 26rpx; letter-spacing: 0.4rpx; }

.feature-section { margin-top: 36rpx; }
.about-section-title { display: block; padding: 0 8rpx; color: var(--chumen-muted); font-size: 24rpx; font-weight: 600; letter-spacing: 2rpx; }
.feature-grid { margin-top: 20rpx; }
.feature-card {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 28rpx;
  border: 1px solid #e5dccb;
  border-radius: 32rpx;
  background: #fff;
}
.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  flex: 0 0 auto;
  margin-right: 24rpx;
  border-radius: 24rpx;
}
.feature-icon.tone-lime { background: #e2f8a8; }
.feature-icon.tone-amber { background: #ffe9b0; }
.feature-icon.tone-sky { background: #cde7ff; }
.feature-icon-img { width: 44rpx; height: 44rpx; }
.feature-text { flex: 1; }
.feature-title { display: block; margin-bottom: 4rpx; color: var(--chumen-ink); font-size: 28rpx; font-weight: 600; }
.feature-desc { display: block; color: var(--chumen-muted); font-size: 24rpx; line-height: 1.45; }
.copyright { display: block; margin-top: 24rpx; color: var(--chumen-muted); font-size: 24rpx; text-align: center; }
</style>
