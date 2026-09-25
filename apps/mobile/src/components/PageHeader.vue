<template>
  <view class="page-header">
    <view class="header-row">
      <button class="back" aria-label="返回" @click="goBack(fallback)"><wd-icon name="chevron-left" size="24px" /></button>
      <text class="page-title">{{ title }}</text>
    </view>
  </view>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { goBack } from '@/common/router'
withDefaults(defineProps<{ title: string; fallback?: string }>(), { fallback: '/pages/index/index' })
onMounted(() => uni.pageScrollTo({ scrollTop: 0, duration: 0 }))
</script>
<style scoped lang="scss">
// 顶部间距由外层决定：普通页面已由 .page-content 避开系统胶囊（此前组件内再叠一层
// status-bar 高度会导致标题栏偏低），浮在头图上的详情页由页面自己覆盖 inset。
// --chumen-header-lift / --chumen-capsule-height 由 AppShell 按小程序胶囊实测计算，
// 让标题与右侧胶囊垂直平级；H5 无此信息时回退为不上移、行高 88rpx。
.page-header { position: relative; z-index: 31; margin-top: var(--chumen-header-lift, 0px); color: var(--chumen-ink); }
// 返回键与标题在同一行内垂直居中；标题始终水平居中，故返回键绝对定位、不吃掉标题的居中基准
.header-row { position: relative; display: flex; align-items: center; justify-content: center; min-height: var(--chumen-capsule-height, 88rpx); }
.page-title { font-size: 32rpx; font-weight: 800; line-height: 1.2; }
.back { position: absolute; top: 50%; left: 0; display: flex; align-items: center; justify-content: center; width: 72rpx; height: 72rpx; margin: 0; padding: 0; transform: translateY(-50%); border: 2rpx solid var(--chumen-line); border-radius: 50%; background: rgba(255,255,255,.88); color: var(--chumen-ink); line-height: 1; }
</style>
