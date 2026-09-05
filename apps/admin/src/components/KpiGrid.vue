<script setup lang="ts">
export interface KpiItem { label: string; value: string | number; delta: string; warn?: boolean }
defineProps<{ items: KpiItem[]; loading?: boolean }>()
</script>

<template>
  <section class="kpi-grid" v-loading="loading ?? false">
    <article v-for="item in items" :key="item.label" class="kpi-card">
      <span class="kpi-card__label">{{ item.label }}</span>
      <strong class="kpi-card__value">{{ item.value }}</strong>
      <span class="kpi-card__delta" :class="{ 'is-warn': item.warn }">{{ item.delta }}</span>
    </article>
  </section>
</template>
