<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'
import KpiGrid, { type KpiItem } from '../components/KpiGrid.vue'
import PageHeader from '../components/PageHeader.vue'
import type { CityItem } from '../types/admin'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const items = ref<CityItem[]>([])
const loading = ref(true)
const keyword = ref('')
const statusFilter = ref<'' | 'enabled' | 'disabled'>('')
const canWrite = auth.hasPermission('city:write')

// 新增/编辑城市模态
const dialogVisible = ref(false)
const saving = ref(false)
const editingCode = ref<string | null>(null)
const form = ref({ code: '', name: '', scenes: [] as string[], enabled: true })

const SCENES = [
  { value: 'drive', label: '溜车' },
  { value: 'fish', label: '钓鱼' },
  { value: 'fuel', label: '加油' },
]
const sceneLabel = (value: string) => SCENES.find((scene) => scene.value === value)?.label || value

const filtered = computed(() => items.value.filter((city) => {
  const hitKeyword = !keyword.value.trim() || `${city.name}${city.code}`.includes(keyword.value.trim())
  const hitStatus = !statusFilter.value || (statusFilter.value === 'enabled' ? city.enabled : !city.enabled)
  return hitKeyword && hitStatus
}))
const kpis = computed<KpiItem[]>(() => [
  { label: '总城市', value: items.value.length, delta: '数据库总量' },
  { label: '已启用', value: items.value.filter((city) => city.enabled).length, delta: '小程序可见' },
  { label: '已停用', value: items.value.filter((city) => !city.enabled).length, delta: '已隐藏', warn: items.value.some((city) => !city.enabled) },
])

async function load() {
  loading.value = true
  try { items.value = await apiGet<CityItem[]>('/admin/cities') } finally { loading.value = false }
}

function openCreate() {
  editingCode.value = null
  form.value = { code: '', name: '', scenes: ['drive', 'fuel'], enabled: true }
  dialogVisible.value = true
}

function openEdit(tableRow: unknown) {
  const row = tableRow as CityItem
  editingCode.value = row.code
  form.value = { code: row.code, name: row.name, scenes: [...row.scenes], enabled: row.enabled }
  dialogVisible.value = true
}

async function save() {
  if (!editingCode.value && !/^\d{6}$/.test(form.value.code)) { ElMessage.warning('adcode 需为 6 位数字（如 450100）'); return }
  if (!form.value.name.trim()) { ElMessage.warning('请填写城市名称'); return }
  if (form.value.scenes.length === 0) { ElMessage.warning('请至少选择一个场景'); return }
  saving.value = true
  try {
    if (editingCode.value) {
      await apiPatch(`/admin/cities/${editingCode.value}`, { name: form.value.name.trim(), scenes: form.value.scenes, enabled: form.value.enabled })
      ElMessage.success(`${form.value.name}已更新`)
    } else {
      await apiPost('/admin/cities', { code: form.value.code, name: form.value.name.trim(), scenes: form.value.scenes, enabled: form.value.enabled })
      ElMessage.success(`城市「${form.value.name}」已新增`)
    }
    dialogVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally { saving.value = false }
}

async function remove(tableRow: unknown) {
  const row = tableRow as CityItem
  try {
    await ElMessageBox.confirm(
      `确认删除城市「${row.name}」？<br/><span style="color:#909399;font-size:12px">存在路线/加油站/用户关联数据时会被拦截，届时建议改为「停用」。</span>`,
      '删除城市',
      { type: 'warning', dangerouslyUseHTMLString: true, confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
  } catch { return }
  try {
    await apiDelete(`/admin/cities/${row.code}`)
    ElMessage.success(`已删除：${row.name}`)
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

onMounted(load)
</script>

<template>
  <PageHeader title="城市管理" group="路线运营" description="城市开关与场景配置实时影响小程序端可见范围">
    <el-button v-if="canWrite" type="primary" @click="openCreate">+ 新增城市</el-button>
  </PageHeader>

  <KpiGrid :items="kpis" :loading="loading" />

  <section class="panel">
    <div class="panel__toolbar">
      <div class="panel__filters">
        <el-select v-model="statusFilter" clearable placeholder="全部状态" style="width: 120px">
          <el-option label="启用" value="enabled" />
          <el-option label="停用" value="disabled" />
        </el-select>
        <el-input v-model="keyword" clearable placeholder="搜索城市名/adcode…" style="width: 220px" />
      </div>
      <span class="muted">{{ filtered.length }} 城</span>
    </div>

    <el-table v-loading="loading" :data="filtered">
      <el-table-column prop="name" label="城市" width="120" />
      <el-table-column prop="code" label="adcode" width="110" />
      <el-table-column label="场景" min-width="200">
        <template #default="{ row }">
          <el-tag v-for="scene in (row as CityItem).scenes" :key="scene" size="small" effect="plain" class="scene-tag">{{ sceneLabel(scene) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="routeCount" label="路线数" width="100" align="center" />
      <el-table-column prop="stationCount" label="加油站" width="100" align="center" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><el-tag :type="(row as CityItem).enabled ? 'success' : 'danger'" effect="light">{{ (row as CityItem).enabled ? '启用' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <el-button v-if="canWrite" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="canWrite" size="small" type="danger" plain @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>

  <el-dialog v-model="dialogVisible" :title="editingCode ? `编辑城市 · ${form.name}` : '新增城市'" width="460px">
    <el-form label-width="90px">
      <el-form-item label="adcode" required>
        <el-input v-model="form.code" :disabled="Boolean(editingCode)" placeholder="6 位数字，如 450100" maxlength="6" />
        <div class="field-hint">高德行政区划编码，小程序端按前两位映射省级油价</div>
      </el-form-item>
      <el-form-item label="城市名称" required>
        <el-input v-model="form.name" maxlength="32" placeholder="例：南宁" />
      </el-form-item>
      <el-form-item label="场景" required>
        <el-checkbox-group v-model="form.scenes">
          <el-checkbox v-for="scene in SCENES" :key="scene.value" :value="scene.value" :label="scene.value">{{ scene.label }}</el-checkbox>
        </el-checkbox-group>
        <div class="field-hint">关闭的场景在小程序端不可见（影响首页 tab 与列表）</div>
      </el-form-item>
      <el-form-item label="启用">
        <el-switch v-model="form.enabled" />
        <span class="field-hint inline">停用后小程序端不再返回该城市数据</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.panel__filters { display: flex; gap: 10px; align-items: center; }
.scene-tag { margin-right: 6px; }
.muted { color: var(--el-text-color-secondary); }
.field-hint { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
.field-hint.inline { display: inline-block; margin: 0 0 0 10px; }
</style>
