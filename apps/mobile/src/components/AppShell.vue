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

function windowWidthPx(): number {
  try {
    const api = uni as unknown as {
      getWindowInfo?: () => { windowWidth?: number }
      getSystemInfoSync?: () => { windowWidth?: number }
    }
    const width = Number(api.getWindowInfo?.()?.windowWidth ?? api.getSystemInfoSync?.()?.windowWidth)
    return Number.isFinite(width) && width > 0 ? width : 375
  } catch { return 375 }
}

function syncMiniProgramTopInset() {
  try {
    if (typeof uni.getMenuButtonBoundingClientRect !== 'function') return
    const menu = uni.getMenuButtonBoundingClientRect()
    if (!menu || !Number.isFinite(menu.bottom) || menu.bottom <= 0) return
    shellStyle['--chumen-top-inset'] = `${Math.ceil(menu.bottom)}px`
    // 让自定义导航（返回键 + 标题）与右侧胶囊垂直对齐：
    // PageHeader 用 --chumen-header-lift 从内容安全区上移到胶囊顶，
    // 行高取 --chumen-capsule-height（胶囊高），标题/返回键的垂直中心即与胶囊一致。
    if (Number.isFinite(menu.top) && Number.isFinite(menu.height) && menu.height > 0) {
      const contentGapPx = (28 * windowWidthPx()) / 750 // 对应 .page-content padding-top 里的 28rpx
      const lift = Math.ceil(menu.top) - Math.ceil(menu.bottom) - contentGapPx
      shellStyle['--chumen-header-lift'] = `${lift}px`
      shellStyle['--chumen-capsule-height'] = `${Math.ceil(menu.height)}px`
    }
  } catch {
    // H5、非微信小程序和旧基础库没有胶囊布局信息时使用 CSS 回退值。
  }
}

onMounted(syncMiniProgramTopInset)
</script>
