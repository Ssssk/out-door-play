<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiGet, apiPatch, apiPost } from '../api/client'
import KpiGrid from '../components/KpiGrid.vue'; import PageHeader from '../components/PageHeader.vue'
import type { CityItem, CityOilSource } from '../types/admin'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const items = ref<CityItem[]>([])
const loading = ref(true)
const refreshing = ref(false)
const refreshingCode = ref('')
const keyword = ref('')
const sourceFilter = ref<'' | CityOilSource>('')
const canWrite = auth.hasPermission('city:write')

// 手动填写油价模态（web-cities.md §3.1：手动录入的数据不会被自动获取覆盖）
const oilDialog = ref(false)
const oilSaving = ref(false)
const oilTarget = ref<CityItem | null>(null)
const oilForm = ref({ price92: '', price95: '', price0: '', note: '' })

const filtered = computed(() => items.value.filter((city) => {
  const hitKeyword = !keyword.value.trim() || `${city.name}${city.code}`.includes(keyword.value.trim())
  const hitSource = !sourceFilter.value || city.oilSource === sourceFilter.value
  return hitKeyword && hitSource
}))
const lastRefreshLabel = computed(() => {
  const times = items.value.map((city) => city.oilUpdatedAt).filter(Boolean) as string[]
  if (!times.length) return '—'
  return new Date(Math.max(...times.map((time) => new Date(time).getTime()))).toLocaleString('zh-CN', { hour12: false })
})
const kpis = computed(() => {
  const auto = items.value.filter((city) => city.oilSource === 'auto').length
  const manual = items.value.filter((city) => city.oilSource === 'manual').length
  const failed = items.value.filter((city) => city.oilSource === 'failed').length
  const opened = items.value.filter((city) => city.enabled).length
  return [
    { label: '已开通城市', value: opened, delta: `共 ${items.value.length} 城` },
    { label: '自动获取成功', value: auto, delta: opened ? `${Math.round((auto / opened) * 100)}%` : '—' },
    { label: '手动覆盖', value: manual, delta: '运营优先' },
    { label: '获取失败', value: failed, delta: failed ? '待处理' : '无异常', warn: failed > 0 },
  ]
})

const SCENE_LABELS: Record<string, string> = { drive: '溜车', fish: '钓鱼', fuel: '加油' }
const ALL_SCENES = ['drive', 'fish', 'fuel']

function formatPrice(value: number | null) {
  return value == null ? '—' : `¥${value.toFixed(2)}`
}
function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—'
}
function sourceBadge(city: CityItem): { label: string; type: 'success' | 'warning' | 'danger' | 'info' } {
  if (city.oilSource === 'manual') return { label: '手动', type: 'warning' }
  if (city.oilSource === 'auto') return { label: '自动', type: 'success' }
  if (city.oilSource === 'failed') return { label: '失败', type: 'danger' }
  return { label: '未获取', type: 'info' }
}

async function load() {
  loading.value = true
  try { items.value = await apiGet<CityItem[]>('/admin/cities') } finally { loading.value = false }
}

async function toggleEnabled(tableRow: unknown) {
  const row = tableRow as CityItem
  try {
    await apiPatch(`/admin/cities/${row.code}`, { enabled: row.enabled })
    ElMessage.success(`${row.name}已${row.enabled ? '启用' : '停用'}`)
  } catch {
    row.enabled = !row.enabled
    ElMessage.error('状态保存失败')
  }
}

async function toggleScene(tableRow: unknown, scene: string, enabled: boolean) {
  const row = tableRow as CityItem
  const previous = row.scenes
  const next = enabled ? [...new Set([...row.scenes, scene])] : row.scenes.filter((item) => item !== scene)
  row.scenes = next
  try {
    await apiPatch(`/admin/cities/${row.code}/scenes`, { scenes: next })
    ElMessage.success(`${row.name}已${enabled ? '开启' : '关闭'}「${SCENE_LABELS[scene]}」场景`)
  } catch {
    row.scenes = previous
    ElMessage.error('场景保存失败')
  }
}

async function refreshOne(tableRow: unknown) {
  const row = tableRow as CityItem
  refreshingCode.value = row.code
  try {
    const updated = await apiPost<CityItem>(`/admin/cities/${row.code}/oil/refresh`)
    Object.assign(row, updated)
    if (updated.oilSource === 'failed') ElMessage.warning(`${row.name}：${updated.oilError || '获取失败'}`)
    else ElMessage.success(`${row.name}油价已更新（自动）`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '油价获取失败')
  } finally { refreshingCode.value = '' }
}

async function refreshAll() {
  await ElMessageBox.confirm(`将批量重新获取 ${items.value.filter((city) => city.enabled).length} 个启用城市的油价（第三方接口，可能部分失败），继续？`, '刷新油价', { type: 'warning' })
  refreshing.value = true
  try {
    await apiPost('/admin/cities/refresh-oil')
    ElMessage.success('批量刷新完成')
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '批量刷新失败')
  } finally { refreshing.value = false }
}

function openOilDialog(tableRow: unknown) {
  const row = tableRow as CityItem
  oilTarget.value = row
  oilForm.value = {
    price92: row.oilPrice92?.toFixed(2) ?? '',
    price95: row.oilPrice95?.toFixed(2) ?? '',
    price0: row.oilPrice0?.toFixed(2) ?? '',
    note: '',
  }
  oilDialog.value = true
}

async function saveOil() {
  const target = oilTarget.value
  if (!target) return
  const price92 = oilForm.value.price92 === '' ? undefined : Number(oilForm.value.price92)
  const price95 = oilForm.value.price95 === '' ? undefined : Number(oilForm.value.price95)
  const price0 = oilForm.value.price0 === '' ? undefined : Number(oilForm.value.price0)
  if (price92 === undefined && price95 === undefined && price0 === undefined) {
    ElMessage.warning('至少填写一档油价')
    return
  }
  for (const price of [price92, price95, price0]) {
    if (price !== undefined && (!Number.isFinite(price) || price <= 0 || price > 20)) {
      ElMessage.warning('油价需在 0-20 元/升之间')
      return
    }
  }
  oilSaving.value = true
  try {
    const updated = await apiPatch<CityItem>(`/admin/cities/${target.code}/oil`, { price92, price95, price0, note: oilForm.value.note })
    Object.assign(target, updated)
    oilDialog.value = false
    ElMessage.success(`${target.name}油价已手动录入`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally { oilSaving.value = false }
}

onMounted(load)
</script>
<template>
  <PageHeader title="油价配置" group="路线运营" description="城市油价自动获取 + 手动兜底；场景开关影响小程序端可见性">
    <div class="header-actions">
      <RouterLink class="fuel-entry" to="/fuel">加油站与油价管理 →</RouterLink>
      <el-button :loading="loading" @click="load">刷新</el-button>
      <el-button v-if="canWrite" type="primary" :loading="refreshing" @click="refreshAll">↻ 刷新油价</el-button>
    </div>
  </PageHeader>

  <KpiGrid :items="kpis" :loading="loading" />

  <section class="panel">
    <div class="panel__toolbar">
      <div class="panel__filters">
        <el-input v-model="keyword" clearable placeholder="搜索城市或 adcode…" style="width: 220px" />
        <el-select v-model="sourceFilter" clearable placeholder="数据来源" style="width: 130px">
          <el-option label="自动获取" value="auto" />
          <el-option label="手动填写" value="manual" />
          <el-option label="获取失败" value="failed" />
        </el-select>
      </div>
      <span class="muted"><span class="dot" :class="{ ok: lastRefreshLabel !== '—' }" /> 最后获取：{{ lastRefreshLabel }}</span>
    </div>

    <el-table v-loading="loading" :data="filtered">
      <el-table-column prop="name" label="城市" width="110" fixed="left" />
      <el-table-column prop="code" label="adcode" width="100" />
      <el-table-column label="92# (¥/L)" width="110"><template #default="{ row }">{{ formatPrice(row.oilPrice92) }}</template></el-table-column>
      <el-table-column label="95# (¥/L)" width="110"><template #default="{ row }">{{ formatPrice(row.oilPrice95) }}</template></el-table-column>
      <el-table-column label="0# 柴油 (¥/L)" width="130"><template #default="{ row }">{{ formatPrice(row.oilPrice0) }}</template></el-table-column>
      <el-table-column label="数据来源" width="110">
        <template #default="{ row }">
          <el-tooltip v-if="row.oilSource === 'failed' && row.oilError" :content="row.oilError" placement="top">
            <el-tag :type="sourceBadge(row as CityItem).type" effect="light">{{ sourceBadge(row as CityItem).label }}</el-tag>
          </el-tooltip>
          <el-tag v-else :type="sourceBadge(row as CityItem).type" effect="light">{{ sourceBadge(row as CityItem).label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="170"><template #default="{ row }">{{ formatTime(row.oilUpdatedAt) }}</template></el-table-column>
      <el-table-column label="场景开关" min-width="200">
        <template #default="{ row }">
          <label v-for="scene in ['drive', 'fish', 'fuel']" :key="scene" class="scene-toggle">
            <el-switch
              :model-value="row.scenes.includes(scene)"
              :disabled="!canWrite"
              size="small"
              @change="(value: unknown) => toggleScene(row, scene, Boolean(value))"
            />
            <span>{{ SCENE_LABELS[scene] }}</span>
          </label>
        </template>
      </el-table-column>
      <el-table-column prop="stationCount" label="加油站" width="90" />
      <el-table-column prop="routeCount" label="路线" width="80" />
      <el-table-column label="启用" width="80" fixed="right">
        <template #default="{ row }"><el-switch v-model="row.enabled" :disabled="!canWrite" @change="toggleEnabled(row)" /></template>
      </el-table-column>
      <el-table-column v-if="canWrite" label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" :disabled="!row.enabled" :loading="refreshingCode === row.code" @click="refreshOne(row)">↻ 重新获取</el-button>
          <el-button size="small" type="primary" plain @click="openOilDialog(row)">手动填写</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>

  <el-dialog v-model="oilDialog" :title="`手动填写油价 · ${oilTarget?.name || ''}`" width="460px">
    <p class="oil-tip">手动录入后标记为「手动」，不会被自动获取覆盖；留空的档位保持原值。</p>
    <el-form label-width="110px">
      <el-form-item label="92# (¥/L)"><el-input v-model="oilForm.price92" placeholder="如 7.62" /></el-form-item>
      <el-form-item label="95# (¥/L)"><el-input v-model="oilForm.price95" placeholder="如 8.18" /></el-form-item>
      <el-form-item label="0# 柴油 (¥/L)"><el-input v-model="oilForm.price0" placeholder="如 7.30" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="oilForm.note" type="textarea" :rows="2" maxlength="200" placeholder="选填，来源说明等" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="oilDialog = false">取消</el-button>
      <el-button type="primary" :loading="oilSaving" @click="saveOil">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.header-actions { display: flex; align-items: center; gap: 12px; }
.fuel-entry { color: var(--el-color-primary); font-size: 13px; text-decoration: none; }
.panel__filters { display: flex; gap: 10px; align-items: center; }
.dot { display: inline-block; width: 8px; height: 8px; margin-right: 6px; border-radius: 50%; background: var(--el-color-info-light-5); }
.dot.ok { background: var(--el-color-success); }
.scene-toggle { display: inline-flex; align-items: center; gap: 4px; margin-right: 12px; font-size: 12px; color: var(--el-text-color-secondary); }
.oil-tip { margin: 0 0 12px; color: var(--el-text-color-secondary); font-size: 13px; }
</style>
