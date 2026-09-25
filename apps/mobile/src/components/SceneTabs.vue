<template>
  <view class="scene-tabs" role="tablist" aria-label="出门场景">
    <button v-for="tab in tabs" :key="tab.id" class="scene-tab" :class="{ active: modelValue === tab.id }" role="tab" :aria-selected="modelValue === tab.id" @click="select(tab.id)">{{ tab.label }}</button>
  </view>
</template>

<script setup lang="ts">
import type { Scene } from '@/types/domain'

defineProps<{ modelValue: Scene }>()
const emit = defineEmits<{ 'update:modelValue': [scene: Scene] }>()
const tabs: { id: Scene; label: string }[] = [{ id: 'drive', label: '粗门溜车' }, { id: 'fish', label: '粗门钓鱼' }]
let lastClick = 0
function select(scene: Scene) {
  if (Date.now() - lastClick < 300) return
  lastClick = Date.now()
  emit('update:modelValue', scene)
}
</script>

<style scoped lang="scss">
/* 吸顶 tab：把顶部安全区做进盒子自身的 padding（单一背景，避免多节点拼接出现接缝），
   并用等量负 margin 抵消布局高度，未吸顶时按钮位置与原来一致。
   top: 0 使吸顶时背景一直铺到状态栏/胶囊后面，卡片不会从 tab 上方穿出。 */
.scene-tabs { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; margin: calc(28rpx - var(--chumen-top-inset, var(--status-bar-height, 0px))) -32rpx 26rpx; padding: calc(var(--chumen-top-inset, var(--status-bar-height, 0px)) + 14rpx) 24rpx 14rpx; background: var(--chumen-canvas); }
.scene-tab { min-height: 70rpx; margin: 0 8rpx; padding: 0 30rpx; border-radius: 999rpx; background: transparent; color: var(--chumen-muted); font-size: 28rpx; line-height: 70rpx; white-space: nowrap; }
.scene-tab.active { background: var(--chumen-ink); color: var(--chumen-lime); font-weight: 800; }
</style>
