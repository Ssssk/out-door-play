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
.scene-tabs { display: flex; align-items: center; margin: 28rpx -8rpx 26rpx; }
.scene-tab { min-height: 70rpx; margin: 0 8rpx; padding: 0 30rpx; border-radius: 999rpx; background: transparent; color: var(--chumen-muted); font-size: 28rpx; line-height: 70rpx; white-space: nowrap; }
.scene-tab.active { background: var(--chumen-ink); color: var(--chumen-lime); font-weight: 800; }
</style>
