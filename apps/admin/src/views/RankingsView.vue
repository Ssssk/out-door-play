<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'
import PageHeader from '../components/PageHeader.vue'
import type { CityItem, RankingItem, RouteItem, Scene } from '../types/admin'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(true)
const rankings = ref<RankingItem[]>([])
const routes = ref<RouteItem[]>([])
const cities = ref<CityItem[]>([])
const sceneFilter = ref<Scene | ''>('')
const keyword = ref('')
const canWrite = auth.hasPermission('ranking:write')

// 编辑模态：双 Tab（基本信息 / 路线选择）
const dialogVisible = ref(false)
const dialogTab = ref('basic')
const saving = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ name: '', scene: 'drive' as Scene, cityCode: '' })
const picked = ref<string[]>([]) // 已选封面路线（顺序即展示顺序）
const poolKeyword = ref('')
const dragIndex = ref(-1)

const sceneLabel = (value: string) => (value === 'fish' ? '钓鱼' : value === 'drive' ? '溜车' : value)
const filtered = computed(() => rankings.value.filter((item) => {
  const hitScene = !sceneFilter.value || item.scene === sceneFilter.value
  const hitKeyword = !keyword.value.trim() || item.name.includes(keyword.value.trim())
  return hitScene && hitKeyword
}))
const onlineRoutes = computed(() => routes.value.filter((route) => route.status !== 'offline'))
// PRD：封面路线 Tab 只展示榜单场景对应（指定城市时再限同城），其余隐藏并提示
const poolRoutes = computed(() => onlineRoutes.value.filter((route) =>
  route.scene === form.value.scene
  && (!form.value.cityCode || route.cityCode === form.value.cityCode)
  && (!poolKeyword.value.trim() || route.title.includes(poolKeyword.value.trim())),
))
const hiddenRouteCount = computed(() => onlineRoutes.value.length - poolRoutes.value.length - pickedInPoolCount.value)
const pickedInPoolCount = computed(() => picked.value.filter((id) => !poolRoutes.value.some((route) => route.id === id)).length)
const pickedRoutes = computed(() => picked.value.map((id) => routes.value.find((route) => route.id === id)).filter((route): route is RouteItem => Boolean(route)))
const enabledCities = computed(() => cities.value.filter((city) => city.enabled))
const cityLabel = (item: RankingItem) => (item.cityName || '全国榜')

async function load() {
  loading.value = true
  try {
    const [loadedRankings, loadedRoutes, loadedCities] = await Promise.all([
      apiGet<RankingItem[]>('/admin/rankings'),
      apiGet<RouteItem[]>('/admin/routes'),
      apiGet<CityItem[]>('/admin/cities'),
    ])
    rankings.value = loadedRankings
    routes.value = loadedRoutes
    cities.value = loadedCities
  } catch { ElMessage.error('后台数据加载失败，请检查 API 与 MySQL') }
  finally { loading.value = false }
}

function openEditor(tableRow: unknown) {
  const item = tableRow as RankingItem | null
  editingId.value = item?.id ?? null
  form.value = { name: item?.name || '', scene: item?.scene || 'drive', cityCode: item?.cityCode || '' }
  picked.value = [...(item?.coverRouteIds || [])]
  poolKeyword.value = ''
  dialogTab.value = 'basic'
  dialogVisible.value = true
}

function togglePick(route: RouteItem) {
  if (picked.value.includes(route.id)) picked.value = picked.value.filter((id) => id !== route.id)
  else picked.value = [...picked.value, route.id]
}
function unPick(route: RouteItem) { picked.value = picked.value.filter((id) => id !== route.id) }

// 已选列表拖拽排序（PRD：拖拽可调整顺序，顺序即 coverRoutes[]）
function onDragStart(index: number) { dragIndex.value = index }
function onDrop(index: number) {
  if (dragIndex.value < 0 || dragIndex.value === index) return
  const next = [...picked.value]
  const [moved] = next.splice(dragIndex.value, 1)
  next.splice(index, 0, moved)
  picked.value = next
  dragIndex.value = -1
}

async function save() {
  if (!form.value.name.trim()) { ElMessage.warning('请填写榜单名'); dialogTab.value = 'basic'; return }
  if (form.value.name.trim().length > 30) { ElMessage.warning('榜单名不能超过 30 字'); dialogTab.value = 'basic'; return }
  if (picked.value.length < 1) { ElMessage.warning('请至少选择 1 条封面路线'); dialogTab.value = 'cover'; return }
  saving.value = true
  const payload = { name: form.value.name.trim(), scene: form.value.scene, cityCode: form.value.cityCode || undefined, coverRouteIds: picked.value }
  try {
    if (editingId.value) await apiPatch(`/admin/rankings/${editingId.value}`, payload)
    else await apiPost('/admin/rankings', payload)
    ElMessage.success(`${editingId.value ? '已保存' : '已新建'}：${payload.name}（封面路线 ${picked.value.length} 条）`)
    dialogVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally { saving.value = false }
}

async function remove(tableRow: unknown) {
  const item = tableRow as RankingItem
  const bound = item.coverRouteIds.map((id) => routes.value.find((route) => route.id === id)?.title).filter(Boolean)
  const body = bound.length
    ? `确认删除榜单「${item.name}」？<br/>将被以下路线移除榜单绑定（不影响路线本身）：<br/><b style="color:#909399">${bound.join('、')}</b><br/><span style="color:#909399;font-size:12px">删除后无法恢复。</span>`
    : `确认删除榜单「${item.name}」？<br/><span style="color:#909399;font-size:12px">删除后无法恢复。</span>`
  try {
    await ElMessageBox.confirm(body, '删除榜单', { type: 'warning', dangerouslyUseHTMLString: true, confirmButtonText: '确认删除', cancelButtonText: '取消' })
  } catch { return }
  try {
    await apiDelete(`/admin/rankings/${item.id}`)
    ElMessage.success(`已删除：${item.name}`)
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

function goRoutes() { router.push('/routes') }

onMounted(load)
</script>

<template>
  <PageHeader title="热门榜单配置" group="路线运营" description="榜单顺序由「序」决定；封面路线与路线「已绑榜单数」双向同步">
    <el-button :loading="loading" @click="load">刷新</el-button>
  </PageHeader>

  <section class="panel">
    <div class="panel__toolbar">
      <div class="panel__filters">
        <div class="scene-tabs">
          <button v-for="tab in [{ value: '', label: '全部' }, { value: 'drive', label: '溜车' }, { value: 'fish', label: '钓鱼' }]" :key="tab.value"
            class="scene-tab" :class="{ active: sceneFilter === tab.value }" role="tab" :aria-selected="sceneFilter === tab.value"
            @click="sceneFilter = tab.value as Scene | ''">{{ tab.label }}</button>
        </div>
        <el-input v-model="keyword" clearable placeholder="搜索榜单名…" style="width: 240px" />
      </div>
      <el-button v-if="canWrite" type="primary" @click="openEditor(null)">+ 新建榜单</el-button>
    </div>

    <el-table v-loading="loading" :data="filtered" row-key="id">
      <el-table-column label="序" width="70"><template #default="{ row }"><strong>#{{ row.seq }}</strong></template></el-table-column>
      <el-table-column label="榜单名" min-width="240">
        <template #default="{ row }"><el-link type="primary" :underline="false" @click="openEditor(row)">{{ row.name }}</el-link></template>
      </el-table-column>
      <el-table-column label="场景" width="90"><template #default="{ row }">{{ sceneLabel((row as RankingItem).scene) }}</template></el-table-column>
      <el-table-column label="城市" width="110"><template #default="{ row }">{{ cityLabel(row as RankingItem) }}</template></el-table-column>
      <el-table-column prop="coverageCount" label="覆盖路线" width="100" align="center" />
      <el-table-column label="状态" width="95"><template #default><el-tag type="success" effect="light">正常</el-tag></template></el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button v-if="canWrite" size="small" @click="openEditor(row)">编辑</el-button>
          <el-button v-if="canWrite" size="small" type="danger" plain @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>

  <el-dialog v-model="dialogVisible" :title="`${editingId ? '编辑榜单 · ' : '新建榜单'}${editingId ? form.name : ''}`" width="760px">
    <el-tabs v-model="dialogTab">
      <el-tab-pane label="基本信息" name="basic">
        <el-form label-position="top">
          <el-form-item label="榜单名" required>
            <el-input v-model="form.name" maxlength="30" show-word-limit placeholder="例：武汉 · 周末溜车热门榜" />
          </el-form-item>
          <el-form-item label="场景" required>
            <el-select v-model="form.scene" style="width: 220px">
              <el-option label="溜车" value="drive" />
              <el-option label="钓鱼" value="fish" />
            </el-select>
          </el-form-item>
          <el-form-item label="城市">
            <el-select v-model="form.cityCode" style="width: 220px">
              <el-option label="— 不限城市（全国榜）" value="" />
              <el-option v-for="city in enabledCities" :key="city.code" :label="city.name" :value="city.code" />
            </el-select>
            <div class="field-hint">「—」表示不限城市（全国榜）</div>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane :label="`路线选择（${picked.length}）`" name="cover">
        <div class="cover-board">
          <div class="cover-col">
            <div class="cover-head">
              <span>可选路线（{{ poolRoutes.length }}）</span>
              <el-input v-model="poolKeyword" size="small" clearable placeholder="按名称搜索…" style="width: 160px" />
            </div>
            <ul class="cover-list">
              <li v-for="route in poolRoutes" :key="route.id" class="cover-row" :class="{ picked: picked.includes(route.id) }" @click="togglePick(route)">
                <el-checkbox :model-value="picked.includes(route.id)" @click.stop @change="togglePick(route)" />
                <span class="cover-name">{{ route.title }}</span>
                <span class="cover-meta">{{ route.cityName }}</span>
                <el-tag size="small" effect="plain">{{ sceneLabel(route.scene) }}</el-tag>
              </li>
              <li v-if="!poolRoutes.length" class="cover-empty">当前场景/城市下暂无可选路线，<el-link type="primary" :underline="false" @click="goRoutes">去路线列表新建 →</el-link></li>
            </ul>
            <p v-if="hiddenRouteCount > 0" class="field-hint">本榜单场景为「{{ sceneLabel(form.scene) }}」，{{ hiddenRouteCount }} 条其他场景/城市路线已隐藏</p>
          </div>
          <div class="cover-arrow">⇆</div>
          <div class="cover-col">
            <div class="cover-head"><span>已选路线（<strong>{{ picked.length }}</strong>）</span><span class="field-hint">拖拽可调整顺序</span></div>
            <ul class="cover-list">
              <li v-for="(route, index) in pickedRoutes" :key="route.id" class="cover-row picked" draggable="true"
                @dragstart="onDragStart(index)" @dragover.prevent @drop="onDrop(index)">
                <span class="drag-handle">⋮⋮</span>
                <span class="cover-name">{{ route.title }}</span>
                <span class="cover-meta">{{ route.cityName }}</span>
                <el-tag size="small" effect="plain">{{ sceneLabel(route.scene) }}</el-tag>
                <el-button size="small" link type="danger" @click="unPick(route)">移除</el-button>
              </li>
              <li v-if="!pickedRoutes.length" class="cover-empty">从左侧勾选要加入该榜单的路线（coverRoutes[]）</li>
            </ul>
          </div>
        </div>
        <p class="field-hint">配置完成后点击右下角『保存』，榜单与路线的多对多关系会双向同步：<code>ranking.coverRouteIds[]</code> ↔ <code>route.boundRankings</code></p>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button v-if="canWrite" type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.panel__filters { display: flex; gap: 10px; align-items: center; }
.scene-tabs { display: inline-flex; gap: 6px; }
.scene-tab { min-height: 32px; padding: 0 16px; border: 1px solid var(--el-border-color); border-radius: 999px; background: #fff; color: var(--el-text-color-regular); font-size: 13px; cursor: pointer; }
.scene-tab.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-weight: 600; }
.field-hint { margin: 6px 0 0; color: var(--el-text-color-secondary); font-size: 12px; }
.cover-board { display: grid; grid-template-columns: 1fr 36px 1fr; gap: 10px; align-items: stretch; }
.cover-arrow { display: flex; align-items: center; justify-content: center; color: var(--el-text-color-secondary); font-size: 18px; }
.cover-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
.cover-list { min-height: 220px; max-height: 320px; margin: 0; padding: 6px; overflow-y: auto; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-fill-color-lighter); list-style: none; }
.cover-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; padding: 8px 10px; border: 1px solid transparent; border-radius: 8px; background: #fff; cursor: pointer; font-size: 13px; }
.cover-row:hover { border-color: var(--el-color-primary-light-5); }
.cover-row.picked { border-color: var(--el-color-primary-light-7); background: var(--el-color-primary-light-9); }
.cover-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cover-meta { color: var(--el-text-color-secondary); font-size: 12px; }
.cover-empty { padding: 24px 10px; color: var(--el-text-color-secondary); font-size: 12px; text-align: center; }
.drag-handle { color: var(--el-text-color-placeholder); cursor: grab; letter-spacing: -2px; }
</style>
