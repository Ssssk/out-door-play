<template>
  <!-- #ifdef MP-WEIXIN -->
  <view v-if="visible" class="ad-slot" :class="spacing === 'top' ? 'ad-slot--top' : 'ad-slot--bottom'">
    <ad-custom :unit-id="unitId" @load="onLoad" @error="onError" @close="onClose"></ad-custom>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { ref } from 'vue'

/** 微信原生模板广告位：unitId 用于换广告位，spacing 区分「信息流中插」与「卡片下方」 */
withDefaults(defineProps<{ unitId?: string; spacing?: 'top' | 'bottom' }>(), {
  unitId: 'adunit-2684f6a46a835d27',
  spacing: 'bottom',
})

// 加载失败或用户主动关闭后移除整块占位，避免列表/卡片之间留一个空白框
const visible = ref(true)
// #ifdef MP-WEIXIN
function onLoad() { console.log('原生模板广告加载成功') }
function onError(err: unknown) {
  console.error('原生模板广告加载失败', err)
  visible.value = false
}
function onClose() {
  console.log('原生模板广告关闭')
  visible.value = false
}
// #endif
</script>

<style scoped lang="scss">
/* 通用外观与间距都收在组件内，页面无需依赖 scoped 样式透传；高度由微信广告位模板决定 */
.ad-slot { overflow: hidden; border: 2rpx solid var(--chumen-line); border-radius: 28rpx; background: #fff; }
.ad-slot--bottom { margin-bottom: 22rpx; }
.ad-slot--top { margin-top: 24rpx; }
</style>
