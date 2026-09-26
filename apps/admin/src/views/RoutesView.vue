<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiGet, apiPatch, apiPost, apiUpload } from '../api/client'
import KpiGrid, { type KpiItem } from '../components/KpiGrid.vue'
import PageHeader from '../components/PageHeader.vue'
import type { AdminStats, CityItem, RouteItem, RouteStatus, Scene } from '../types/admin'
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
const loading = ref(true)
const routes = ref<RouteItem[]>([])
const stats = ref<AdminStats>()
const keyword = ref('')
const status = ref<RouteStatus | ''>('')
const scene = ref<Scene | ''>('')
const editVisible = ref(false)
const createVisible = ref(false)
const savingCreate = ref(false)
const cities = ref<CityItem[]>([])
const coverFile = ref<File | undefined>()
const coverPreviewUrl = ref('')
const coverInput = ref<HTMLInputElement>()
const editCoverUrl = ref('')
const editForm = ref({ id: '', cityCode: '', title: '', difficulty: '', rankWeight: 50 })
const createForm = ref({
  title: '', cityCode: '', scene: 'drive' as Scene, difficulty: '入门级', rankTag: '', rankWeight: 50,
  distanceKm: 0, lengthKm: 0, elevationM: 0, durationLabel: '', bestTime: '', description: '', tags: '', latitude: 0, longitude: 0,
})

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
  try {
    const [loadedStats, loadedRoutes, loadedCities] = await Promise.all([
      apiGet<AdminStats>('/admin/stats'),
      apiGet<RouteItem[]>('/admin/routes'),
      auth.hasPermission('city:read') ? apiGet<CityItem[]>('/admin/cities') : Promise.resolve([] as CityItem[]),
    ])
    stats.value = loadedStats
    routes.value = loadedRoutes
    cities.value = loadedCities
  }
  catch { ElMessage.error('后台数据加载失败，请检查 API 与 MySQL') }
  finally { loading.value = false }
}

function resetCreateForm() {
  createForm.value = {
    title: '', cityCode: '', scene: 'drive', difficulty: '入门级', rankTag: '', rankWeight: 50,
    distanceKm: 0, lengthKm: 0, elevationM: 0, durationLabel: '', bestTime: '', description: '', tags: '', latitude: 0, longitude: 0,
  }
}

function clearCoverSelection() {
  if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
  coverFile.value = undefined
  coverPreviewUrl.value = ''
  if (coverInput.value) coverInput.value.value = ''
}

function coverImageSrc(url: string) {
  return bundledCoverImages[url] || (url.startsWith('/v1/uploads/') || url.startsWith('https://') || url.startsWith('http://') ? url : '')
}

function chooseCover() {
  coverInput.value?.click()
}

function onCoverSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('封面图片仅支持 JPG、PNG 或 WebP 格式')
    input.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('封面图片不能超过 5MB，请压缩后重试')
    input.value = ''
    return
  }
  if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
  coverFile.value = file
  coverPreviewUrl.value = URL.createObjectURL(file)
}

function openCreate() {
  clearCoverSelection()
  resetCreateForm()
  createVisible.value = true
}

function openEdit(tableRow: unknown) {
  const item = tableRow as RouteItem
  clearCoverSelection()
  editCoverUrl.value = item.coverImageUrl || ''
  editForm.value = { id: item.id, cityCode: item.cityCode, title: item.title, difficulty: item.difficulty, rankWeight: item.rankWeight }
  editVisible.value = true
}

async function saveEdit() {
  let metadataSaved = false
  try {
    await apiPatch(`/admin/routes/${editForm.value.id}`, { cityCode: editForm.value.cityCode, title: editForm.value.title, difficulty: editForm.value.difficulty, rankWeight: editForm.value.rankWeight })
    metadataSaved = true
    if (coverFile.value) await apiUpload(`/admin/routes/${editForm.value.id}/cover`, coverFile.value)
    ElMessage.success('路线资料与封面已写入数据库')
    editVisible.value = false
    clearCoverSelection()
    await load()
  } catch (error) {
    const detail = error instanceof Error ? error.message : '请重试'
    ElMessage.error(metadataSaved ? `路线资料已保存，但封面上传失败：${detail}` : `路线保存失败：${detail}`)
  }
}

async function saveCreate() {
  if (!createForm.value.title.trim()) { ElMessage.warning('请填写路线名称'); return }
  if (!createForm.value.cityCode) { ElMessage.warning('请选择关联城市'); return }
  savingCreate.value = true
  let created: RouteItem | undefined
  try {
    const tags = createForm.value.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean)
    created = await apiPost<RouteItem>('/admin/routes', {
      ...createForm.value,
      title: createForm.value.title.trim(),
      difficulty: createForm.value.difficulty.trim() || '入门级',
      rankTag: createForm.value.rankTag.trim(),
      description: createForm.value.description.trim(),
      tags,
    })
    if (coverFile.value) await apiUpload(`/admin/routes/${created.id}/cover`, coverFile.value)
    ElMessage.success(coverFile.value ? '路线与封面已创建，当前状态为待审核' : '路线已创建，当前状态为待审核')
    createVisible.value = false
    clearCoverSelection()
    await load()
  } catch (error) {
    const detail = error instanceof Error ? error.message : '请重试'
    if (created) {
      createVisible.value = false
      clearCoverSelection()
      await load()
      ElMessage.error(`路线已创建，但封面上传失败：${detail}。可在列表中编辑路线后补传封面`)
    } else {
      ElMessage.error(`路线创建失败：${detail}`)
    }
  } finally {
    savingCreate.value = false
  }
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
onBeforeUnmount(clearCoverSelection)
</script>

<template>
  <input ref="coverInput" class="route-cover-input" type="file" accept="image/jpeg,image/png,image/webp" @change="onCoverSelected" />
  <PageHeader title="路线列表" group="路线运营" description="路线、钓点与小程序展示数据同源">
    <el-button v-if="auth.hasPermission('route:edit')" class="lime-button" @click="openCreate">+ 新增路线</el-button>
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
        <template #default="{ row }"><div class="route-name"><el-image v-if="coverImageSrc(row.coverImageUrl)" class="route-thumb route-thumb-image" :src="coverImageSrc(row.coverImageUrl)" :preview-src-list="[coverImageSrc(row.coverImageUrl)]" preview-teleported hide-on-click-modal fit="cover" :alt="`${row.title}封面，点击预览`" /><span v-else class="route-thumb" :class="row.scene" aria-label="暂无路线封面" /><div><strong>{{ row.title }}</strong><small>{{ row.scene === 'drive' ? '溜车' : '钓鱼' }} · {{ row.rankTag }}</small></div></div></template>
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
  <el-dialog v-model="editVisible" title="编辑路线与榜单配置" width="620px">
    <el-form label-position="top">
      <div class="route-form-grid">
        <el-form-item label="关联城市" required><el-select v-model="editForm.cityCode" filterable placeholder="请选择城市" style="width:100%"><el-option v-for="city in cities" :key="city.code" :label="city.enabled ? city.name : `${city.name}（未启用）`" :value="city.code" /></el-select></el-form-item>
        <el-form-item label="路线名称"><el-input v-model="editForm.title" maxlength="128" show-word-limit /></el-form-item>
      </div>
      <el-form-item label="难度"><el-input v-model="editForm.difficulty" /></el-form-item>
      <el-form-item label="榜单权重"><el-slider v-model="editForm.rankWeight" show-input /></el-form-item>
      <div class="route-cover-uploader">
        <div class="route-cover-preview">
          <el-image v-if="coverPreviewUrl" class="route-cover-preview-image" :src="coverPreviewUrl" :preview-src-list="[coverPreviewUrl]" preview-teleported hide-on-click-modal fit="contain" alt="待上传的路线封面，点击预览" />
          <el-image v-else-if="coverImageSrc(editCoverUrl)" class="route-cover-preview-image" :src="coverImageSrc(editCoverUrl)" :preview-src-list="[coverImageSrc(editCoverUrl)]" preview-teleported hide-on-click-modal fit="contain" alt="当前路线封面，点击预览" />
          <span v-else>暂无封面</span>
        </div>
        <div class="route-cover-copy">
          <strong>路线封面图</strong>
          <span>上传后后台与小程序读取同一份图片数据</span>
          <small>支持 JPG / PNG / WebP，单张不超过 5MB</small>
          <div class="route-cover-actions"><el-button size="small" @click="chooseCover">{{ coverFile ? '重新选择' : '选择图片' }}</el-button><el-button v-if="coverFile" size="small" link @click="clearCoverSelection">移除待上传图片</el-button></div>
        </div>
      </div>
    </el-form>
    <template #footer><el-button @click="editVisible = false">取消</el-button><el-button v-if="auth.hasPermission('route:edit')" type="primary" @click="saveEdit">保存到数据库</el-button></template>
  </el-dialog>
  <el-dialog v-model="createVisible" title="新增路线" width="720px">
    <el-form label-position="top">
      <div class="route-form-grid">
        <el-form-item label="路线名称" required><el-input v-model="createForm.title" maxlength="128" show-word-limit placeholder="请输入路线或钓点名称" /></el-form-item>
        <el-form-item label="关联城市" required><el-select v-model="createForm.cityCode" filterable placeholder="请选择城市" style="width:100%"><el-option v-for="city in cities" :key="city.code" :label="city.enabled ? city.name : `${city.name}（未启用）`" :value="city.code" /></el-select></el-form-item>
        <el-form-item label="场景" required><el-select v-model="createForm.scene" style="width:100%"><el-option label="溜车" value="drive" /><el-option label="钓鱼" value="fish" /></el-select></el-form-item>
        <el-form-item label="难度" required><el-input v-model="createForm.difficulty" placeholder="如：入门级、进阶级" /></el-form-item>
        <el-form-item label="榜单标签"><el-input v-model="createForm.rankTag" maxlength="64" placeholder="如：周末热门榜" /></el-form-item>
        <el-form-item label="榜单权重"><el-input-number v-model="createForm.rankWeight" :min="0" :max="100" style="width:100%" /></el-form-item>
        <el-form-item label="参考距离（km）"><el-input-number v-model="createForm.distanceKm" :min="0" :precision="1" style="width:100%" /></el-form-item>
        <el-form-item label="路线长度（km）"><el-input-number v-model="createForm.lengthKm" :min="0" :precision="1" style="width:100%" /></el-form-item>
        <el-form-item label="预计时长"><el-input v-model="createForm.durationLabel" maxlength="32" placeholder="如：约 2h" /></el-form-item>
        <el-form-item label="最佳时段"><el-input v-model="createForm.bestTime" maxlength="64" placeholder="如：清晨、日落前" /></el-form-item>
      </div>
      <div class="route-cover-uploader">
        <div class="route-cover-preview"><el-image v-if="coverPreviewUrl" class="route-cover-preview-image" :src="coverPreviewUrl" :preview-src-list="[coverPreviewUrl]" preview-teleported hide-on-click-modal fit="contain" alt="待上传的路线封面，点击预览" /><span v-else>选择图片后预览</span></div>
        <div class="route-cover-copy">
          <strong>路线封面图</strong>
          <span>保存后会写入服务端，小程序端自动读取同一地址</span>
          <small>支持 JPG / PNG / WebP，单张不超过 5MB；图片过大或格式不支持会明确提示</small>
          <div class="route-cover-actions"><el-button size="small" @click="chooseCover">{{ coverFile ? '重新选择' : '选择图片' }}</el-button><el-button v-if="coverFile" size="small" link @click="clearCoverSelection">移除待上传图片</el-button></div>
        </div>
      </div>
      <el-form-item label="标签"><el-input v-model="createForm.tags" placeholder="多个标签用逗号分隔，如：山景，日落" /></el-form-item>
      <el-form-item label="描述"><el-input v-model="createForm.description" type="textarea" :rows="3" maxlength="5000" show-word-limit placeholder="补充路线特色、注意事项等信息" /></el-form-item>
    </el-form>
    <template #footer><el-button @click="createVisible = false">取消</el-button><el-button v-if="auth.hasPermission('route:edit')" type="primary" :loading="savingCreate" @click="saveCreate">创建并提交审核</el-button></template>
  </el-dialog>
</template>
