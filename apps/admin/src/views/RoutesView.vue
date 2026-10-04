<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from '../api/client'
import PageHeader from '../components/PageHeader.vue'
import type { CityItem, RouteItem, Scene } from '../types/admin'
import { useAuthStore } from '../stores/auth'
import routeCover1 from '../../../mobile/src/static/routes/card-route-1.jpg'
import routeCover2 from '../../../mobile/src/static/routes/card-route-2.jpg'
import routeCover3 from '../../../mobile/src/static/routes/card-route-3.jpg'
import fishingCover1 from '../../../mobile/src/static/fishing/card-fishing-1.jpg'
import fishingCover2 from '../../../mobile/src/static/fishing/card-fishing-2.jpg'
import fishingCover3 from '../../../mobile/src/static/fishing/card-fishing-3.jpg'

const bundledCoverImages: Record<string, string> = {
  '/static/routes/card-route-1.jpg': routeCover1,
  '/static/routes/card-route-2.jpg': routeCover2,
  '/static/routes/card-route-3.jpg': routeCover3,
  '/static/fishing/card-fishing-1.jpg': fishingCover1,
  '/static/fishing/card-fishing-2.jpg': fishingCover2,
  '/static/fishing/card-fishing-3.jpg': fishingCover3,
}

const auth = useAuthStore()
const router = useRouter()
const loading = ref(true)
const routes = ref<RouteItem[]>([])
const cities = ref<CityItem[]>([])
const keyword = ref('')
const sceneFilter = ref<Scene | ''>('')
const canEdit = auth.hasPermission('route:edit')

// 编辑/新建共用表单模态（PRD：新建入口锁定场景；编辑展示场景专属字段）
const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const lockedScene = ref<Scene>('drive')
interface RouteForm {
  title: string; scene: Scene; cityCode: string; difficulty: string; level: string
  bestTime: string; durationLabel: string; description: string
  startLng: number | null; startLat: number | null
  lengthKm: number | null; elevationM: number | null; carType: string; startPoint: string; endPoint: string
  endLng: number | null; endLat: number | null
  shoreKm: number | null; depthM: number | null; entryPoint: string; mainArea: string; gear: string
}
const emptyForm = (scene: Scene): RouteForm => ({
  title: '', scene, cityCode: '', difficulty: '入门级', level: 'easy',
  bestTime: '', durationLabel: '', description: '',
  startLng: null, startLat: null,
  lengthKm: null, elevationM: null, carType: '', startPoint: '', endPoint: '', endLng: null, endLat: null,
  shoreKm: null, depthM: null, entryPoint: '', mainArea: '', gear: '',
})
const form = ref<RouteForm>(emptyForm('drive'))

const coverFile = ref<File | undefined>()
const coverPreviewUrl = ref('')
const coverInput = ref<HTMLInputElement>()
const editCoverUrl = ref('')

const LEVEL_OPTIONS = ['入门级', '轻松级', '进阶级', '挑战级']
const BESTTIME_OPTIONS = ['全天', '清晨 04:30-09:30', '上午 08:30-12:00', '下午 13:00-17:00', '傍晚 16:00-19:30（日落）', '夜间 19:00-23:00', '清晨+傍晚 05:00-10:00 / 16:00-19:00']

const filtered = computed(() => routes.value.filter((item) => {
  const text = `${item.title}${item.cityName}${item.tags.join('')}`.toLowerCase()
  const hitKeyword = !keyword.value.trim() || text.includes(keyword.value.trim().toLowerCase())
  const hitScene = !sceneFilter.value || item.scene === sceneFilter.value
  return hitKeyword && hitScene
}))

const sceneLabel = (value: string) => (value === 'fish' ? '钓鱼' : value === 'drive' ? '溜车' : value)
const statusLabel = (value: string) => ({ online: '正常', pending: '待审核', offline: '下架' }[value] || value)
function formatCreatedAt(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function coverImageSrc(url: string) {
  return bundledCoverImages[url] || (url.startsWith('/v1/uploads/') || url.startsWith('https://') || url.startsWith('http://') ? url : '')
}

async function load() {
  loading.value = true
  try {
    const [loadedRoutes, loadedCities] = await Promise.all([
      apiGet<RouteItem[]>('/admin/routes'),
      auth.hasPermission('city:read') ? apiGet<CityItem[]>('/admin/cities') : Promise.resolve([] as CityItem[]),
    ])
    routes.value = loadedRoutes
    cities.value = loadedCities
  }
  catch { ElMessage.error('后台数据加载失败，请检查 API 与 MySQL') }
  finally { loading.value = false }
}

function clearCoverSelection() {
  if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
  coverFile.value = undefined
  coverPreviewUrl.value = ''
  if (coverInput.value) coverInput.value.value = ''
}
function chooseCover() { coverInput.value?.click() }
function onCoverSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    ElMessage.error('封面图片仅支持 JPG、PNG 或 WebP 格式')
    input.value = ''
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('封面图片不能超过 2MB，请压缩后重试')
    input.value = ''
    return
  }
  if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
  coverFile.value = file
  coverPreviewUrl.value = URL.createObjectURL(file)
}

function openCreate(scene: Scene) {
  lockedScene.value = scene
  editingId.value = null
  clearCoverSelection()
  editCoverUrl.value = ''
  form.value = emptyForm(scene)
  dialogVisible.value = true
}

function openEdit(tableRow: unknown) {
  const item = tableRow as RouteItem
  editingId.value = item.id
  clearCoverSelection()
  editCoverUrl.value = item.coverImageUrl || ''
  form.value = {
    title: item.title, scene: item.scene, cityCode: item.cityCode, difficulty: item.difficulty, level: item.level || 'easy',
    bestTime: item.bestTime || '', durationLabel: item.durationLabel || '', description: item.description || '',
    startLng: item.longitude ?? null, startLat: item.latitude ?? null,
    lengthKm: item.lengthKm ?? null, elevationM: item.elevationM ?? null,
    carType: item.carType || '', startPoint: item.startPoint || '', endPoint: item.endPoint || '',
    endLng: item.endLongitude ?? null, endLat: item.endLatitude ?? null,
    shoreKm: item.shoreKm ?? null, depthM: item.depthM ?? null,
    entryPoint: item.entryPoint || '', mainArea: item.mainArea || '', gear: item.gear || '',
  }
  dialogVisible.value = true
}

function collectPayload() {
  const base = {
    title: form.value.title.trim(),
    scene: form.value.scene,
    cityCode: form.value.cityCode,
    difficulty: form.value.difficulty || '入门级',
    level: (form.value.level || undefined) as 'easy' | 'normal' | 'hard' | undefined,
    bestTime: form.value.bestTime,
    durationLabel: form.value.durationLabel.trim(),
    description: form.value.description.trim(),
    latitude: form.value.startLat ?? undefined,
    longitude: form.value.startLng ?? undefined,
  }
  const sceneFields = form.value.scene === 'fish'
    ? {
      shoreKm: form.value.shoreKm ?? undefined, depthM: form.value.depthM ?? undefined,
      entryPoint: form.value.entryPoint.trim(), mainArea: form.value.mainArea.trim(), gear: form.value.gear.trim(),
    }
    : {
      lengthKm: form.value.lengthKm ?? undefined, elevationM: form.value.elevationM ?? undefined,
      carType: form.value.carType.trim(), startPoint: form.value.startPoint.trim(), endPoint: form.value.endPoint.trim(),
      endLongitude: form.value.endLng ?? undefined, endLatitude: form.value.endLat ?? undefined,
    }
  return { ...base, ...sceneFields }
}

async function save() {
  if (!form.value.title.trim()) { ElMessage.warning('请填写路线名'); return }
  if (!form.value.cityCode) { ElMessage.warning('请选择关联城市'); return }
  saving.value = true
  let metadataSaved = false
  let createdId = editingId.value
  try {
    const payload = collectPayload()
    if (editingId.value) {
      await apiPatch(`/admin/routes/${editingId.value}`, payload)
    } else {
      const created = await apiPost<RouteItem>('/admin/routes', payload)
      createdId = created.id
    }
    metadataSaved = true
    if (coverFile.value && createdId) await apiUpload(`/admin/routes/${createdId}/cover`, coverFile.value)
    ElMessage.success(editingId.value ? '路线资料已写入数据库' : `路线已创建并上线：${payload.title}`)
    dialogVisible.value = false
    clearCoverSelection()
    await load()
  } catch (error) {
    const detail = error instanceof Error ? error.message : '请重试'
    ElMessage.error(metadataSaved ? `路线已保存，但封面上传失败：${detail}。可在列表中编辑路线后补传封面` : `保存失败：${detail}`)
  } finally { saving.value = false }
}

async function remove(tableRow: unknown) {
  const item = tableRow as RouteItem
  try {
    await ElMessageBox.confirm(
      `确认删除路线「${item.title}」？<br/><span style="color:#909399;font-size:12px">删除后无法恢复；若该路线被榜单引用为封面路线，会被拦截并提示先移除。</span>`,
      '删除路线',
      { type: 'warning', dangerouslyUseHTMLString: true, confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
  } catch { return }
  try {
    await apiDelete(`/admin/routes/${item.id}`)
    ElMessage.success(`已删除：${item.title}`)
    await load()
  } catch (error) {
    // 服务端拦截：被榜单引用为封面路线时返回具体榜单名
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

function goRankings() { router.push('/rankings') }

onMounted(load)
onBeforeUnmount(clearCoverSelection)
</script>

<template>
  <input ref="coverInput" class="route-cover-input" type="file" accept="image/jpeg,image/png,image/webp" @change="onCoverSelected" />
  <PageHeader title="路线列表" group="路线运营" description="路线、钓点与小程序展示数据同源">
    <el-input v-model="keyword" clearable placeholder="搜索路线名、标签、城市…" style="width: 280px" />
  </PageHeader>

  <section class="panel">
    <div class="panel__toolbar">
      <div class="scene-tabs">
        <button v-for="tab in [{ value: '', label: '全部' }, { value: 'drive', label: '溜车' }, { value: 'fish', label: '钓鱼' }]" :key="tab.value"
          class="scene-tab" :class="{ active: sceneFilter === tab.value }" role="tab" :aria-selected="sceneFilter === tab.value"
          @click="sceneFilter = tab.value as Scene | ''">{{ tab.label }}</button>
      </div>
      <div class="spacer" />
      <template v-if="canEdit">
        <el-button type="primary" @click="openCreate('drive')">+ 新建溜车路线</el-button>
        <el-button type="info" plain @click="openCreate('fish')">+ 新建钓鱼路线</el-button>
      </template>
    </div>

    <el-table v-loading="loading" :data="filtered" row-key="id">
      <el-table-column prop="listRank" label="排名" width="66" align="center"><template #default="{ row }"><strong>#{{ (row as RouteItem).listRank }}</strong></template></el-table-column>
      <el-table-column label="路线名称" min-width="270">
        <template #default="{ row }">
          <div class="route-name">
            <el-image v-if="coverImageSrc((row as RouteItem).coverImageUrl)" class="route-thumb route-thumb-image" :src="coverImageSrc((row as RouteItem).coverImageUrl)" :preview-src-list="[coverImageSrc((row as RouteItem).coverImageUrl)]" preview-teleported hide-on-click-modal fit="cover" :alt="`${(row as RouteItem).title}封面，点击预览`" />
            <span v-else class="route-thumb" :class="(row as RouteItem).scene" aria-label="暂无路线封面" />
            <div><strong>{{ (row as RouteItem).title }}</strong><small>{{ sceneLabel((row as RouteItem).scene) }} · {{ (row as RouteItem).rankTag }}</small></div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="cityName" label="所在城市" width="100" />
      <el-table-column prop="difficulty" label="难度" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><el-tag :type="(row as RouteItem).status === 'online' ? 'success' : (row as RouteItem).status === 'pending' ? 'warning' : 'info'" effect="light">{{ statusLabel((row as RouteItem).status) }}</el-tag></template>
      </el-table-column>
      <el-table-column label="创建时间" width="150"><template #default="{ row }"><span class="muted small">{{ formatCreatedAt((row as RouteItem).createdAt) }}</span></template></el-table-column>
      <el-table-column label="已绑榜单" width="110">
        <template #default="{ row }">
          <el-link v-if="(row as RouteItem).boundRankings > 0" type="primary" :underline="false" title="点击跳到榜单配置" @click="goRankings">{{ (row as RouteItem).boundRankings }} 个榜单</el-link>
          <span v-else class="muted">0 个榜单</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button v-if="canEdit" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="canEdit" size="small" type="danger" plain @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>

  <el-dialog v-model="dialogVisible" :title="editingId ? `编辑路线 · ${form.title}` : `新建${sceneLabel(form.scene)}路线`" width="680px">
    <p v-if="!editingId" class="field-hint">场景已由入口按钮锁定为「{{ sceneLabel(form.scene) }}」，如需切换场景请关闭后选择对应按钮</p>
    <el-form label-position="top">
      <div class="route-form-grid">
        <el-form-item label="路线名" required>
          <el-input v-model="form.title" maxlength="128" show-word-limit :placeholder="form.scene === 'fish' ? '例：梁子湖翘嘴鲌野钓基地' : '例：八分山日落自驾观光线'" />
        </el-form-item>
        <el-form-item label="场景" required>
          <el-select v-model="form.scene" :disabled="!editingId" style="width: 100%"><el-option label="溜车" value="drive" /><el-option label="钓鱼" value="fish" /></el-select>
        </el-form-item>
        <el-form-item label="城市" required>
          <el-select v-model="form.cityCode" filterable placeholder="请选择城市" style="width: 100%">
            <el-option v-for="city in cities" :key="city.code" :label="city.enabled ? city.name : `${city.name}（未开通）`" :value="city.code" :disabled="!city.enabled" />
          </el-select>
          <div class="field-hint">未开通城市不可选</div>
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="form.difficulty" style="width: 100%"><el-option v-for="opt in LEVEL_OPTIONS" :key="opt" :label="opt" :value="opt" /></el-select>
        </el-form-item>
        <el-form-item label="难度等级">
          <el-select v-model="form.level" style="width: 100%">
            <el-option label="入门（easy）" value="easy" />
            <el-option label="一般（normal）" value="normal" />
            <el-option label="困难（hard）" value="hard" />
          </el-select>
          <div class="field-hint">字段同 mobile-home.route.level（小程序端用于路线卡片徽章）</div>
        </el-form-item>
        <el-form-item label="建议时段">
          <el-select v-model="form.bestTime" filterable allow-create default-first-option style="width: 100%">
            <el-option v-for="option in BESTTIME_OPTIONS" :key="option" :label="option" :value="option" />
          </el-select>
        </el-form-item>
        <el-form-item label="耗时"><el-input v-model="form.durationLabel" placeholder="约 1.5 小时" /></el-form-item>
      </div>

      <div v-if="form.scene === 'fish'" class="route-form-grid">
        <el-form-item label="环湖岸线 (km)"><el-input-number v-model="form.shoreKm" :min="0" :precision="1" style="width: 100%" /></el-form-item>
        <el-form-item label="平均水深 (m)"><el-input-number v-model="form.depthM" :min="0" :precision="1" style="width: 100%" /></el-form-item>
        <el-form-item label="钓点入口"><el-input v-model="form.entryPoint" placeholder="例：梁子湖码头" /></el-form-item>
        <el-form-item label="钓点坐标" class="grid-span-2">
          <div class="coord-row">
            <el-input-number v-model="form.startLng" :min="-180" :max="180" :precision="6" placeholder="经度 lng" controls-position="right" />
            <el-input-number v-model="form.startLat" :min="-90" :max="90" :precision="6" placeholder="纬度 lat" controls-position="right" />
          </div>
          <div class="field-hint">用于小程序端「立即出发」唤起地图导航；可从 高德坐标拾取器 获取（GCJ-02 火星坐标）</div>
        </el-form-item>
        <el-form-item label="主钓区"><el-input v-model="form.mainArea" placeholder="例：北岸深水区" /></el-form-item>
        <el-form-item label="装备建议" class="grid-span-2"><el-input v-model="form.gear" placeholder="例：路亚竿·手竿 2.7m / 4 号主线" /></el-form-item>
      </div>
      <div v-else class="route-form-grid">
        <el-form-item label="路线长 (km)"><el-input-number v-model="form.lengthKm" :min="0" :precision="1" style="width: 100%" /></el-form-item>
        <el-form-item label="落差 (m)"><el-input-number v-model="form.elevationM" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="车型"><el-input v-model="form.carType" placeholder="SUV/轿车" /></el-form-item>
        <el-form-item label="起点"><el-input v-model="form.startPoint" placeholder="例：八分山森林公园停车场" /></el-form-item>
        <el-form-item label="起点坐标" class="grid-span-2">
          <div class="coord-row">
            <el-input-number v-model="form.startLng" :min="-180" :max="180" :precision="6" placeholder="经度 lng" controls-position="right" />
            <el-input-number v-model="form.startLat" :min="-90" :max="90" :precision="6" placeholder="纬度 lat" controls-position="right" />
          </div>
        </el-form-item>
        <el-form-item label="终点"><el-input v-model="form.endPoint" placeholder="例：八分山山顶观景台" /></el-form-item>
        <el-form-item label="终点坐标" class="grid-span-2">
          <div class="coord-row">
            <el-input-number v-model="form.endLng" :min="-180" :max="180" :precision="6" placeholder="经度 lng" controls-position="right" />
            <el-input-number v-model="form.endLat" :min="-90" :max="90" :precision="6" placeholder="纬度 lat" controls-position="right" />
          </div>
          <div class="field-hint">用于小程序端「立即出发」唤起地图导航（优先终点，缺失时回落起点）；可从 高德坐标拾取器 获取（GCJ-02 火星坐标）</div>
        </el-form-item>
      </div>

      <div class="route-cover-uploader">
        <div class="route-cover-preview">
          <el-image v-if="coverPreviewUrl" class="route-cover-preview-image" :src="coverPreviewUrl" :preview-src-list="[coverPreviewUrl]" preview-teleported hide-on-click-modal fit="contain" alt="待上传的路线封面，点击预览" />
          <el-image v-else-if="coverImageSrc(editCoverUrl)" class="route-cover-preview-image" :src="coverImageSrc(editCoverUrl)" :preview-src-list="[coverImageSrc(editCoverUrl)]" preview-teleported hide-on-click-modal fit="contain" alt="当前路线封面，点击预览" />
          <span v-else>暂无封面</span>
        </div>
        <div class="route-cover-copy">
          <strong>封面图</strong>
          <span>供小程序详情页头图与列表缩略图使用</span>
          <small>支持 JPG / PNG / WebP，建议 800×600，不超过 2MB</small>
          <div class="route-cover-actions">
            <el-button size="small" @click="chooseCover">{{ coverFile ? '重新选择' : '选择图片' }}</el-button>
            <el-button v-if="coverFile" size="small" link @click="clearCoverSelection">移除待上传图片</el-button>
          </div>
        </div>
      </div>

      <el-form-item label="简介"><el-input v-model="form.description" type="textarea" :rows="3" :placeholder="form.scene === 'fish' ? '请填写具体的钓点详情' : '请填写具体的路线详情'" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button v-if="canEdit" type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.spacer { flex: 1; }
.scene-tabs { display: inline-flex; gap: 6px; }
.scene-tab { min-height: 32px; padding: 0 16px; border: 1px solid var(--el-border-color); border-radius: 999px; background: #fff; color: var(--el-text-color-regular); font-size: 13px; cursor: pointer; }
.scene-tab.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-weight: 600; }
.field-hint { margin: 4px 0 12px; color: var(--el-text-color-secondary); font-size: 12px; }
.muted { color: var(--el-text-color-secondary); }
.small { font-size: 12px; }
</style>
