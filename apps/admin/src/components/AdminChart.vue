<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'

echarts.use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])
const props = defineProps<{ option: EChartsCoreOption; height?: number }>()
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

onMounted(() => {
  chart = echarts.init(chartRef.value!)
  chart.setOption(props.option)
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(chartRef.value!)
})
watch(() => props.option, (option) => chart?.setOption(option, true), { deep: true })
onUnmounted(() => { observer?.disconnect(); chart?.dispose(); chart = null })
</script>

<template><div ref="chartRef" :style="{ height: `${height || 320}px` }" /></template>

