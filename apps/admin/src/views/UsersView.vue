<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiGet, apiPatch } from '../api/client'
import KpiGrid from '../components/KpiGrid.vue'; import PageHeader from '../components/PageHeader.vue'
import type { AdminStats, UserDetail, UserItem } from '../types/admin'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const items = ref<UserItem[]>([])
const stats = ref<AdminStats['users'] | null>(null)
const loading = ref(true)
const keyword = ref('')
const status = ref('')
const cityFilter = ref('')
const canBan = auth.hasPermission('user:ban')

// 详情抽屉（web-users.md §3.2）：资料、登录方式、收藏、发布内容、运营备注
const drawer = ref(false)
const detailLoading = ref(false)
const detail = ref<UserDetail | null>(null)
const noteDraft = ref('')
const noteSaving = ref(false)

const cities = computed(() => [...new Set(items.value.map((item) => item.cityName).filter((name) => name !== '—'))])
const filtered = computed(() => items.value.filter((item) => {
  const hitKeyword = !keyword.value || `${item.nickname}${item.phone}${item.id}`.toLowerCase().includes(keyword.value.toLowerCase())
  const hitStatus = !status.value || item.status === status.value
  const hitCity = !cityFilter.value || item.cityName === cityFilter.value
  return hitKeyword && hitStatus && hitCity
}))
const kpis = computed(() => [
  { label: '总用户', value: stats.value?.total ?? items.value.length, delta: '数据库总量' },
  { label: '日活 DAU', value: stats.value?.dau ?? '—', delta: '近 24h 活跃' },
  { label: '月活 MAU', value: stats.value?.mau ?? '—', delta: '近 30 天活跃' },
  { label: '封禁中', value: stats.value?.banned ?? items.value.filter((item) => item.status === 'banned').length, delta: '需关注', warn: true },
])

async function load() {
  loading.value = true
  try {
    const [users, statsData] = await Promise.all([
      apiGet<UserItem[]>('/admin/users'),
      apiGet<AdminStats>('/admin/stats').catch(() => null),
    ])
    items.value = users
    stats.value = statsData?.users ?? null
  } finally { loading.value = false }
}

async function toggleStatus(tableRow: unknown) {
  const row = tableRow as UserItem
  const next = row.status === 'normal' ? 'banned' : 'normal'
  if (next === 'banned') {
    await ElMessageBox.prompt(
      `封禁「${row.nickname}」后将联动下架其发布的动态（进入待审核队列）。请填写封禁原因：`,
      '封禁确认',
      { type: 'warning', inputPlaceholder: '封禁原因（必填，≤200 字）', inputValidator: (value: string) => (value.trim().length >= 2 && value.length <= 200) || '请填写 2-200 字原因' },
    )
  } else {
    await ElMessageBox.confirm(`确认解禁用户「${row.nickname}」？`, '解禁确认', { type: 'warning' })
  }
  await apiPatch(`/admin/users/${row.id}/status`, { status: next })
  ElMessage.success(next === 'banned' ? '已封禁，其发布内容进入待下架队列' : '已解禁')
  await load()
}

async function openDetail(tableRow: unknown) {
  const row = tableRow as UserItem
  drawer.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await apiGet<UserDetail>(`/admin/users/${row.id}`)
    noteDraft.value = detail.value.adminNote
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '用户详情加载失败')
    drawer.value = false
  } finally { detailLoading.value = false }
}

async function saveNote() {
  if (!detail.value) return
  noteSaving.value = true
  try {
    await apiPatch(`/admin/users/${detail.value.id}/note`, { adminNote: noteDraft.value })
    detail.value.adminNote = noteDraft.value
    ElMessage.success('备注已保存（仅后台可见）')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '备注保存失败')
  } finally { noteSaving.value = false }
}

function formatDate(value: string) { return new Date(value).toLocaleDateString('zh-CN') }
function formatDateTime(value: string) { return new Date(value).toLocaleString('zh-CN', { hour12: false }) }
const STATUS_LABELS: Record<string, string> = { pending: '待审核', published: '已发布', offline: '已下架' }

onMounted(load)
</script>
<template>
  <PageHeader title="用户管理" group="用户与内容" description="查询用户资料、收藏与发布内容；封禁联动下架其内容">
    <el-button :loading="loading" @click="load">刷新</el-button>
  </PageHeader>

  <KpiGrid :items="kpis" :loading="loading" />

  <section class="panel">
    <div class="panel__toolbar">
      <div class="panel__filters">
        <el-input v-model="keyword" clearable placeholder="昵称 / 手机号 / ID…" style="width: 240px" />
        <el-select v-model="status" clearable placeholder="全部状态" style="width: 120px">
          <el-option label="正常" value="normal" />
          <el-option label="封禁" value="banned" />
        </el-select>
        <el-select v-model="cityFilter" clearable placeholder="全部城市" style="width: 130px">
          <el-option v-for="city in cities" :key="city" :label="city" :value="city" />
        </el-select>
      </div>
      <span class="muted">{{ filtered.length }} 位用户</span>
    </div>

    <el-table :data="filtered" v-loading="loading">
      <el-table-column label="用户" min-width="180">
        <template #default="{ row }">
          <div class="route-name">
            <el-avatar :size="36" :src="row.avatarUrl || undefined">{{ row.nickname.slice(0, 1) }}</el-avatar>
            <div><strong>{{ row.nickname }}</strong><small>{{ row.id }}</small></div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="cityName" label="城市" width="100" />
      <el-table-column label="注册时间" width="120"><template #default="{ row }">{{ formatDate(row.createdAt) }}</template></el-table-column>
      <el-table-column label="最后活跃" width="170"><template #default="{ row }">{{ formatDateTime(row.lastActiveAt) }}</template></el-table-column>
      <el-table-column label="动态 / 收藏" width="110"><template #default="{ row }">{{ row.postCount }} / {{ row.favoriteCount }}</template></el-table-column>
      <el-table-column label="状态" width="95">
        <template #default="{ row }"><el-tag :type="row.status === 'normal' ? 'success' : 'danger'">{{ row.status === 'normal' ? '正常' : '已封禁' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">详情</el-button>
          <el-button v-if="canBan" size="small" :type="row.status === 'normal' ? 'danger' : 'success'" plain @click="toggleStatus(row)">
            {{ row.status === 'normal' ? '封禁' : '解禁' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>

  <el-drawer v-model="drawer" :title="detail ? `用户详情 · ${detail.nickname}` : '用户详情'" size="520px">
    <div v-loading="detailLoading" class="detail">
      <template v-if="detail">
        <section class="detail__block">
          <h4>资料</h4>
          <div class="detail__grid">
            <span>头像</span><el-avatar :size="44" :src="detail.avatarUrl || undefined">{{ detail.nickname.slice(0, 1) }}</el-avatar>
            <span>用户 ID</span><b>{{ detail.id }}</b>
            <span>手机号</span><b>{{ detail.phone }}</b>
            <span>城市</span><b>{{ detail.cityName }}</b>
            <span>状态</span><el-tag :type="detail.status === 'normal' ? 'success' : 'danger'" size="small">{{ detail.status === 'normal' ? '正常' : '已封禁' }}</el-tag>
            <span>注册时间</span><b>{{ formatDateTime(detail.createdAt) }}</b>
            <span>最后活跃</span><b>{{ formatDateTime(detail.lastActiveAt) }}</b>
            <span>登录方式</span><b>{{ detail.providers.map((provider) => provider.provider).join('、') || '—' }}</b>
          </div>
        </section>

        <section class="detail__block">
          <h4>运营内部备注（仅后台可见）</h4>
          <el-input v-model="noteDraft" type="textarea" :rows="2" maxlength="255" placeholder="投诉记录、误封说明等" />
          <div class="detail__note-actions">
            <el-button size="small" type="primary" :loading="noteSaving" @click="saveNote">保存备注</el-button>
          </div>
        </section>

        <section class="detail__block">
          <h4>发布内容（{{ detail.feeds.length }}）</h4>
          <p v-if="!detail.feeds.length" class="muted">暂无发布</p>
          <div v-for="feed in detail.feeds" :key="feed.id" class="detail__feed">
            <div>
              <el-tag size="small" :type="feed.status === 'published' ? 'success' : feed.status === 'pending' ? 'warning' : 'info'" effect="plain">
                {{ STATUS_LABELS[feed.status] }}
              </el-tag>
              <el-tag v-if="feed.reportCount >= 12" size="small" type="danger" effect="plain">举报 {{ feed.reportCount }}</el-tag>
              <small class="muted">{{ formatDateTime(feed.createdAt) }}</small>
            </div>
            <p>{{ feed.content }}</p>
          </div>
        </section>

        <section class="detail__block">
          <h4>收藏（{{ detail.favorites.length }}）</h4>
          <p v-if="!detail.favorites.length" class="muted">暂无收藏</p>
          <div v-for="favorite in detail.favorites" :key="favorite.discoveryId" class="detail__fav">
            <el-tag size="small" effect="plain">{{ favorite.scene === 'fish' ? '钓点' : '路线' }}</el-tag>
            <b>{{ favorite.title }}</b>
            <small class="muted">{{ formatDate(favorite.createdAt) }}</small>
          </div>
        </section>
      </template>
    </div>
  </el-drawer>
</template>

<style scoped>
.panel__filters { display: flex; gap: 10px; align-items: center; }
.detail__block { margin-bottom: 22px; }
.detail__block h4 { margin: 0 0 10px; font-size: 14px; }
.detail__grid { display: grid; grid-template-columns: 84px 1fr; gap: 8px 12px; align-items: center; font-size: 13px; }
.detail__grid span { color: var(--el-text-color-secondary); }
.detail__grid b { font-weight: 600; word-break: break-all; }
.detail__note-actions { margin-top: 8px; text-align: right; }
.detail__feed { padding: 8px 0; border-bottom: 1px dashed var(--el-border-color-lighter); }
.detail__feed p { margin: 6px 0 0; font-size: 13px; color: var(--el-text-color-regular); }
.detail__feed small { margin-left: 8px; }
.detail__fav { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 13px; }
</style>
