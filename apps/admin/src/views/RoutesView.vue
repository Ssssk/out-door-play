<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiGet, apiPatch, apiPost } from '../api/client'
import KpiGrid, { type KpiItem } from '../components/KpiGrid.vue'
import PageHeader from '../components/PageHeader.vue'
import type { AdminStats, RouteItem, RouteStatus, Scene } from '../types/admin'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(true)
const routes = ref<RouteItem[]>([])
const stats = ref<AdminStats>()
const keyword = ref('')
const status = ref<RouteStatus | ''>('')
const scene = ref<Scene | ''>('')
const editVisible = ref(false)
const editForm = ref({ id: '', title: '', difficulty: '', rankWeight: 50 })

const filtered = computed(() => routes.value.filter((item) => {
  const text = `${item.title}${item.cityName}${item.tags.join('')}`.toLowerCase()
  return (!keyword.value || text.includes(keyword.value.trim().toLowerCase())) && (!status.value || item.status === status.value) && (!scene.value || item.scene === scene.value)
}))
const kpis = computed<KpiItem[]>(() => [
  { label: '在架路线', value: stats.value?.routes.onShelfCount ?? '—', delta: '+6 本周' },
  { label: '本月曝光', value: formatWan(stats.value?.routes.monthImpressions), delta: '+12.4%' },
  { label: '详情点击率', value: formatPercent(stats.value?.routes.ctr), delta: '+1.2pp' },
  { label: '待审核', value: stats.value?.routes.pendingAuditCount ?? '—', delta: '需处理', warn: true },
])

function formatWan(value?: number) { return value === undefined ? '—' : value >= 10000 ? `${(value / 10000).toFixed(1)}w` : String(value) }
function formatPercent(value?: number) { return value === undefined ? '—' : `${(value * 100).toFixed(1)}%` }
function statusLabel(value: RouteStatus) { return { online: '在线', pending: '待审核', offline: '已下线' }[value] }

async function load() {
  loading.value = true
  try { [stats.value, routes.value] = await Promise.all([apiGet<AdminStats>('/admin/stats'), apiGet<RouteItem[]>('/admin/routes')]) }
  catch { ElMessage.error('后台数据加载失败，请检查 API 与 MySQL') }
  finally { loading.value = false }
}

function openEdit(tableRow: unknown) {
  const item = tableRow as RouteItem
  editForm.value = { id: item.id, title: item.title, difficulty: item.difficulty, rankWeight: item.rankWeight }
  editVisible.value = true
}

async function saveEdit() {
  await apiPatch(`/admin/routes/${editForm.value.id}`, { title: editForm.value.title, difficulty: editForm.value.difficulty, rankWeight: editForm.value.rankWeight })
  ElMessage.success('路线资料已写入数据库')
  editVisible.value = false
  await load()
}

async function action(tableRow: unknown, type: 'audit-pass' | 'audit-reject' | 'shelf-on' | 'shelf-off') {
  const item = tableRow as RouteItem
  const labels = { 'audit-pass': '审核通过', 'audit-reject': '驳回并下线', 'shelf-on': '重新上架', 'shelf-off': '下架' }
  let note = ''
  if (type.startsWith('audit')) {
    const result = await ElMessageBox.prompt(`确认对「${item.title}」执行${labels[type]}？`, '路线审核', { inputPlaceholder: '审核备注（可选，最多 200 字）', inputValidator: (value) => value.length <= 200 || '备注不能超过 200 字', confirmButtonText: labels[type], cancelButtonText: '取消' })
    note = result.value
  } else {
    await ElMessageBox.confirm(`确认${labels[type]}「${item.title}」？`, '状态变更', { type: 'warning' })
  }
  await apiPost(`/admin/routes/${item.id}/actions`, { actionId: crypto.randomUUID(), action: type, note })
  ElMessage.success(`${labels[type]}成功，已同步数据库`)
  await load()
}

onMounted(load)
</script>

<template>
  <PageHeader title="路线列表" group="路线运营" description="路线、钓点与小程序展示数据同源">
    <el-button :loading="loading" @click="load">刷新数据</el-button>
  </PageHeader>
  <KpiGrid :items="kpis" :loading="loading" />
  <section class="panel">
    <div class="panel__toolbar">
      <div class="panel__filters">
        <el-input v-model="keyword" clearable placeholder="搜索路线名、标签、城市…" style="width: 280px" />
        <el-select v-model="status" placeholder="全部状态" clearable style="width: 130px"><el-option label="在线" value="online" /><el-option label="待审核" value="pending" /><el-option label="已下线" value="offline" /></el-select>
        <el-select v-model="scene" placeholder="全部场景" clearable style="width: 130px"><el-option label="溜车" value="drive" /><el-option label="钓鱼" value="fish" /></el-select>
      </div>
      <span class="muted">共 {{ filtered.length }} 条</span>
    </div>
    <el-table v-loading="loading" :data="filtered" row-key="id">
      <el-table-column prop="listRank" label="排名" width="76" align="center" />
      <el-table-column label="路线名称" min-width="290">
        <template #default="{ row }"><div class="route-name"><span class="route-thumb" :class="row.scene" /><div><strong>{{ row.title }}</strong><small>{{ row.scene === 'drive' ? '溜车' : '钓鱼' }} · {{ row.rankTag }}</small></div></div></template>
      </el-table-column>
      <el-table-column prop="cityName" label="所在城市" width="110" />
      <el-table-column prop="difficulty" label="难度" width="110" />
      <el-table-column prop="rankWeight" label="榜单权重" width="110" align="center" />
      <el-table-column label="状态" width="110"><template #default="{ row }"><el-tag :type="row.status === 'online' ? 'success' : row.status === 'pending' ? 'warning' : 'info'" effect="light"><span class="status-dot" :class="`status-${row.status}`" />{{ statusLabel(row.status) }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="270" fixed="right">
        <template #default="{ row }"><div class="table-actions">
          <el-button v-if="auth.hasPermission('route:edit')" size="small" @click="openEdit(row)">编辑</el-button>
          <template v-if="row.status === 'online'"><el-button v-if="auth.hasPermission('route:edit')" size="small" type="primary" @click="openEdit(row)">配置榜单</el-button><el-button v-if="auth.hasPermission('route:shelf')" size="small" type="danger" plain @click="action(row, 'shelf-off')">下架</el-button></template>
          <template v-else-if="row.status === 'pending' && auth.hasPermission('route:audit')"><el-button size="small" type="success" @click="action(row, 'audit-pass')">通过</el-button><el-button size="small" type="danger" plain @click="action(row, 'audit-reject')">驳回</el-button></template>
          <el-button v-else-if="row.status === 'offline' && auth.hasPermission('route:shelf')" size="small" class="lime-button" @click="action(row, 'shelf-on')">重新上架</el-button>
        </div></template>
      </el-table-column>
    </el-table>
  </section>
  <el-dialog v-model="editVisible" title="编辑路线与榜单配置" width="520px">
    <el-form label-position="top"><el-form-item label="路线名称"><el-input v-model="editForm.title" maxlength="128" show-word-limit /></el-form-item><el-form-item label="难度"><el-input v-model="editForm.difficulty" /></el-form-item><el-form-item label="榜单权重"><el-slider v-model="editForm.rankWeight" show-input /></el-form-item></el-form>
    <template #footer><el-button @click="editVisible = false">取消</el-button><el-button v-if="auth.hasPermission('route:edit')" type="primary" @click="saveEdit">保存到数据库</el-button></template>
  </el-dialog>
</template>
