<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiGet, apiPatch, apiPost } from '../api/client'
import PageHeader from '../components/PageHeader.vue'
import type { CityItem } from '../types/admin'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const items = ref<CityItem[]>([])
const loading = ref(true)
const refreshing = ref(false)
const refreshingCode = ref('')
const keyword = ref('')
const canWrite = auth.hasPermission('city:write')

// 手动填写油价模态（PRD：手动录入后标记「手动」，覆盖下一次自动获取结果）
const oilDialog = ref(false)
const oilSaving = ref(false)
const oilTarget = ref<CityItem | null>(null)
const oilForm = ref({ price92: '', price95: '', price0: '', note: '' })

const filtered = computed(() => items.value.filter((city) =>
  !keyword.value.trim() || `${city.name}${city.code}`.includes(keyword.value.trim()),
))
const lastRefreshLabel = computed(() => {
  const times = items.value.map((city) => city.oilUpdatedAt).filter(Boolean) as string[]
  if (!times.length) return '未刷新'
  const latest = new Date(Math.max(...times.map((time) => new Date(time).getTime())))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${latest.getHours() === 0 && latest.getMinutes() === 0 ? '' : ''}${latest.getFullYear()}-${pad(latest.getMonth() + 1)}-${pad(latest.getDate())} ${pad(latest.getHours())}:${pad(latest.getMinutes())}`
})

function formatPrice(value: number | null) {
  return value == null ? '—' : `¥${value.toFixed(2)}`
}
function formatTime(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
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
    ElMessage.warning('请至少填写一种油品价格')
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
    ElMessage.success(`已保存：${target.name} 油价（手动）`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally { oilSaving.value = false }
}

onMounted(load)
</script>

<template>
  <PageHeader title="油价配置" group="路线运营" description="城市油价自动获取 + 手动兜底；手动录入不会被自动覆盖">
    <span class="fetch-status"><span class="dot" :class="{ ok: lastRefreshLabel !== '未刷新' }" />{{ lastRefreshLabel }}</span>
    <el-button v-if="canWrite" type="primary" :loading="refreshing" @click="refreshAll">↻ 刷新油价</el-button>
  </PageHeader>

  <section class="panel">
    <div class="panel__toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索城市名或 adcode…" style="width: 220px" />
      <span class="muted">共 {{ filtered.length }} 城</span>
    </div>

    <el-table v-loading="loading" :data="filtered">
      <el-table-column label="城市" width="130">
        <template #default="{ row }">
          <strong>{{ (row as CityItem).name }}</strong>
          <span v-if="!(row as CityItem).enabled" class="muted small"> 已停用</span>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="adcode" width="110"><template #default="{ row }"><code>{{ (row as CityItem).code }}</code></template></el-table-column>
      <el-table-column label="92# (¥/L)" width="110"><template #default="{ row }">{{ formatPrice((row as CityItem).oilPrice92) }}</template></el-table-column>
      <el-table-column label="95# (¥/L)" width="110"><template #default="{ row }">{{ formatPrice((row as CityItem).oilPrice95) }}</template></el-table-column>
      <el-table-column label="0# 柴油" width="110"><template #default="{ row }">{{ formatPrice((row as CityItem).oilPrice0) }}</template></el-table-column>
      <el-table-column label="数据来源" width="130">
        <template #default="{ row }">
          <el-tooltip v-if="(row as CityItem).oilSource === 'failed' && (row as CityItem).oilError" :content="(row as CityItem).oilError || ''" placement="top">
            <el-tag :type="sourceBadge(row as CityItem).type" effect="light">{{ sourceBadge(row as CityItem).label }}</el-tag>
          </el-tooltip>
          <el-tag v-else :type="sourceBadge(row as CityItem).type" effect="light">{{ sourceBadge(row as CityItem).label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="160"><template #default="{ row }"><span class="muted small">{{ formatTime((row as CityItem).oilUpdatedAt) }}</span></template></el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button v-if="canWrite" size="small" :disabled="!(row as CityItem).enabled" :loading="refreshingCode === (row as CityItem).code" @click="refreshOne(row)">↻ 重新获取</el-button>
          <el-button v-if="canWrite" size="small" @click="openOilDialog(row)">手动填写</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>

  <el-dialog v-model="oilDialog" :title="`手动填写油价 · ${oilTarget?.name || ''}`" width="480px">
    <div class="city-bar">
      城市：<b>{{ oilTarget?.name }}</b>　·　adcode <code>{{ oilTarget?.code }}</code>　·　当前来源：
      <el-tag v-if="oilTarget" :type="sourceBadge(oilTarget).type" effect="light" size="small">{{ sourceBadge(oilTarget).label }}</el-tag>
    </div>
    <el-form label-width="120px">
      <el-form-item label="92# 汽油 (¥/L)"><el-input v-model="oilForm.price92" placeholder="例：7.85" /></el-form-item>
      <el-form-item label="95# 汽油 (¥/L)"><el-input v-model="oilForm.price95" placeholder="例：8.35" /></el-form-item>
      <el-form-item label="0# 柴油 (¥/L)"><el-input v-model="oilForm.price0" placeholder="例：7.50" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="oilForm.note" type="textarea" :rows="2" maxlength="200" placeholder="例：今天上午四川区域调价 0.05 元" /></el-form-item>
    </el-form>
    <p class="muted small">提交后此条数据来源将标记为 <b class="warn-text">手动</b>，覆盖下一次自动获取结果。</p>
    <template #footer>
      <el-button @click="oilDialog = false">取消</el-button>
      <el-button type="primary" :loading="oilSaving" @click="saveOil">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.fetch-status { display: inline-flex; align-items: center; gap: 6px; color: var(--el-text-color-secondary); font-size: 12px; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--el-color-info-light-5); }
.dot.ok { background: var(--el-color-success); }
.muted { color: var(--el-text-color-secondary); }
.small { font-size: 12px; }
.city-bar { margin-bottom: 14px; padding: 10px 12px; border-radius: 6px; background: var(--el-fill-color-light); color: var(--el-text-color-secondary); font-size: 12px; }
.city-bar b { color: var(--el-text-color-primary); }
.warn-text { color: #b86e00; }
</style>
