<template>
  <wd-config-provider :theme-vars="themeVars">
    <view class="page-shell" :style="shellStyle"><slot /></view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'

const themeVars = {
  colorTheme: '#1a1a1a',
  buttonPrimaryBgColor: '#1a1a1a',
  buttonPrimaryColor: '#ccff00',
  popupBg: '#fffef9',
}

const shellStyle = reactive<Record<string, string>>({})

function syncMiniProgramTopInset() {
  try {
    if (typeof uni.getMenuButtonBoundingClientRect !== 'function') return
    const menu = uni.getMenuButtonBoundingClientRect()
    if (!menu || !Number.isFinite(menu.bottom) || menu.bottom <= 0) return
    shellStyle['--chumen-top-inset'] = `${Math.ceil(menu.bottom)}px`
  } catch {
    // H5、非微信小程序和旧基础库没有胶囊布局信息时使用 CSS 回退值。
  }
}

onMounted(syncMiniProgramTopInset)
</script>
