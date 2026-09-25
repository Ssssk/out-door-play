<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiGet, apiPatch } from '../api/client'
import KpiGrid from '../components/KpiGrid.vue'; import PageHeader from '../components/PageHeader.vue'; import type { FuelData } from '../types/admin'
import { useAuthStore } from '../stores/auth'
const auth=useAuthStore()
const data=ref<FuelData>({stations:[]}); const loading=ref(true); const keyword=ref('')
const filtered=computed(()=>data.value.stations.filter(x=>`${x.name}${x.brand}${x.address}`.includes(keyword.value.trim())))
const kpis=computed(()=>[{label:'加油站',value:data.value.stations.length,delta:'已录入'},{label:'营业中',value:data.value.stations.filter(x=>x.enabled).length,delta:'当前启用'},{label:'停用站点',value:data.value.stations.filter(x=>!x.enabled).length,delta:'需核查',warn:true},{label:'覆盖城市',value:new Set(data.value.stations.map(x=>x.cityCode)).size,delta:'去重统计'}])
async function load(){loading.value=true;try{data.value=await apiGet<FuelData>('/admin/fuel')}finally{loading.value=false}}
async function toggleStation(tableRow:unknown){const row=tableRow as FuelData['stations'][number];try{await apiPatch(`/admin/fuel/stations/${row.id}`,{enabled:row.enabled});ElMessage.success('站点状态已保存')}catch{row.enabled=!row.enabled}}
onMounted(load)
</script>
<template><PageHeader title="加油站" group="路线运营" description="站点台账供小程序加油页展示"><el-button :loading="loading" @click="load">刷新</el-button></PageHeader><KpiGrid :items="kpis" :loading="loading"/><section class="panel"><div class="panel__toolbar"><el-input v-model="keyword" clearable placeholder="搜索站点、品牌或地址…" style="width:260px"/><span class="muted">站点数据由系统同步</span></div><el-table v-loading="loading" :data="filtered"><el-table-column prop="name" label="站点" min-width="240"/><el-table-column prop="brand" label="品牌" width="100"/><el-table-column label="城市" width="100"><template #default="{row}">{{row.city.name}}</template></el-table-column><el-table-column prop="address" label="地址" min-width="220"/><el-table-column prop="openingHours" label="营业时间" width="130"/><el-table-column label="启用" width="90" fixed="right"><template #default="{row}"><el-switch v-model="row.enabled" :disabled="!auth.hasPermission('fuel:write')" @change="toggleStation(row)"/></template></el-table-column></el-table></section></template>
