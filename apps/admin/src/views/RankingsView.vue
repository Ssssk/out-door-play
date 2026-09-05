<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiGet, apiPatch } from '../api/client'
import KpiGrid from '../components/KpiGrid.vue'
import PageHeader from '../components/PageHeader.vue'
import type { RankingItem } from '../types/admin'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const items = ref<RankingItem[]>([]); const loading = ref(true); const keyword = ref('')
const filtered = computed(() => items.value.filter((item) => item.name.toLowerCase().includes(keyword.value.toLowerCase())))
const kpis = computed(() => [
  { label: '在用榜单', value: items.value.filter((x) => x.status === 'online').length, delta: '+1 本月' },
  { label: '覆盖路线', value: items.value.reduce((sum, x) => sum + x.coverageCount, 0), delta: '数据库实时汇总' },
  { label: '平均权重', value: items.value.length ? Math.round(items.value.reduce((sum, x) => sum + x.weight, 0) / items.value.length) : 0, delta: '0–100' },
  { label: '待配置', value: items.value.filter((x) => x.status !== 'online').length, delta: '需处理', warn: true },
])
async function load(){ loading.value=true; try{ items.value=await apiGet<RankingItem[]>('/admin/rankings') }finally{ loading.value=false } }
async function save(tableRow: unknown){ const item = tableRow as RankingItem; await apiPatch(`/admin/rankings/${item.id}`, { weight:item.weight, status:item.status }); ElMessage.success('榜单配置已保存') }
onMounted(load)
</script>
<template>
  <PageHeader title="热门榜单配置" group="路线运营" description="调整榜单权重会影响运营排序"><el-button :loading="loading" @click="load">刷新</el-button></PageHeader>
  <KpiGrid :items="kpis" :loading="loading" />
  <section class="panel"><div class="panel__toolbar"><el-input v-model="keyword" clearable placeholder="搜索榜单名…" style="width:260px" /><span class="muted">共 {{ filtered.length }} 个榜单</span></div>
    <el-table v-loading="loading" :data="filtered"><el-table-column type="index" label="#" width="66" /><el-table-column prop="name" label="榜单名" min-width="240" /><el-table-column label="场景" width="90"><template #default="{row}">{{ row.scene==='drive'?'溜车':'钓鱼' }}</template></el-table-column><el-table-column label="城市" width="110"><template #default="{row}">{{ row.city?.name || '全国' }}</template></el-table-column><el-table-column prop="coverageCount" label="覆盖路线" width="100" /><el-table-column label="权重" min-width="230"><template #default="{row}"><div class="weight-cell"><el-slider v-model="row.weight" :disabled="!auth.hasPermission('ranking:write')" :show-tooltip="false" /><strong>{{ row.weight }}</strong></div></template></el-table-column><el-table-column label="状态" width="150"><template #default="{row}"><el-select v-model="row.status" :disabled="!auth.hasPermission('ranking:write')"><el-option label="在线" value="online"/><el-option label="待配置" value="pending"/><el-option label="已下线" value="offline"/></el-select></template></el-table-column><el-table-column v-if="auth.hasPermission('ranking:write')" label="操作" width="100" fixed="right"><template #default="{row}"><el-button type="primary" size="small" @click="save(row)">保存</el-button></template></el-table-column></el-table>
  </section>
</template>
