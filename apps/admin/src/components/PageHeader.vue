<script setup lang="ts">
defineProps<{ title: string; group: string; description?: string }>()
</script>

<template>
  <header class="page-header">
    <div>
      <div class="crumbs">首页 / {{ group }} / {{ title }}</div>
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>
    <div class="page-header__actions"><slot /></div>
  </header>
</template>

