<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiGet, apiPatch } from '../api/client'
import KpiGrid from '../components/KpiGrid.vue'; import PageHeader from '../components/PageHeader.vue'; import type { CityItem } from '../types/admin'
import { useAuthStore } from '../stores/auth'
const auth=useAuthStore()
const items=ref<CityItem[]>([]); const loading=ref(true); const keyword=ref('')
const filtered=computed(()=>items.value.filter(x=>`${x.name}${x.code}`.includes(keyword.value.trim())))
const kpis=computed(()=>[{label:'已开通城市',value:items.value.filter(x=>x.enabled).length,delta:'实时状态'},{label:'加油站',value:items.value.reduce((s,x)=>s+x.stationCount,0),delta:'已录入'},{label:'路线与钓点',value:items.value.reduce((s,x)=>s+x.routeCount,0),delta:'数据库汇总'},{label:'未启用城市',value:items.value.filter(x=>!x.enabled).length,delta:'需处理',warn:true}])
async function load(){loading.value=true;try{items.value=await apiGet<CityItem[]>('/admin/cities')}finally{loading.value=false}}
async function toggle(tableRow:unknown){const item=tableRow as CityItem;try{await apiPatch(`/admin/cities/${item.code}`,{enabled:item.enabled});ElMessage.success(`${item.name}已${item.enabled?'启用':'停用'}`)}catch{item.enabled=!item.enabled;ElMessage.error('状态保存失败')}}
onMounted(load)
</script>
<template><PageHeader title="城市与位置" group="路线运营" description="城市开关影响运营可用范围"><el-button :loading="loading" @click="load">刷新</el-button></PageHeader><KpiGrid :items="kpis" :loading="loading"/><section class="panel"><div class="panel__toolbar"><el-input v-model="keyword" clearable placeholder="搜索城市或 adcode…" style="width:260px"/><span class="muted">城市数据来自 MySQL</span></div><el-table v-loading="loading" :data="filtered"><el-table-column prop="name" label="城市" width="140"/><el-table-column prop="code" label="adcode" width="120"/><el-table-column label="已开场景" min-width="220"><template #default="{row}"><el-tag v-for="scene in row.scenes" :key="scene" style="margin-right:6px" effect="plain">{{ scene }}</el-tag></template></el-table-column><el-table-column prop="routeCount" label="路线数" width="100"/><el-table-column prop="stationCount" label="加油站" width="100"/><el-table-column label="启用" width="100" fixed="right"><template #default="{row}"><el-switch v-model="row.enabled" :disabled="!auth.hasPermission('city:write')" @change="toggle(row)"/></template></el-table-column></el-table></section></template>
