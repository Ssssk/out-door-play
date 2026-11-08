<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '../components/PageHeader.vue'
import { apiGet, apiPut } from '../api/client'
import { useAuthStore } from '../stores/auth'
import type { SceneTabItem, SceneTabsConfig } from '../types/admin'

/** 与服务端 DEFAULT_ADMIN_SCENE_TABS 一致：3 项全启用（CHG-SCENE-EXPANSION-001 裁决 2） */
const DEFAULT_ITEMS: SceneTabItem[] = [
  { scene: 'drive', label: '粗门溜车', enabled: true, sort: 10 },
  { scene: 'play', label: '粗门玩玩', enabled: true, sort: 20 },
  { scene: 'wash', label: '粗门洗车', enabled: true, sort: 30 },
]

const auth = useAuthStore()
const canWrite = computed(() => auth.hasPermission('config:write'))
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const dirty = ref(false)
const form = ref<SceneTabsConfig>({ revision: 0, updatedAt: null, items: [] })
const expectedUpdatedAt = ref<string | null>(null)

const enabledCount = computed(() => form.value.items.filter((item) => item.enabled).length)
const sceneName = (scene: string) => ({ drive: '溜车', play: '玩玩', wash: '洗车' }[scene] || scene)
const updatedLabel = computed(() => (form.value.updatedAt ? new Date(form.value.updatedAt).toLocaleString() : '尚未配置（读取端使用默认配置）'))

function markDirty() {
  dirty.value = true
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await apiGet<SceneTabsConfig>('/admin/config/scene-tabs')
    form.value = { revision: data.revision, updatedAt: data.updatedAt, items: data.items.map((item) => ({ ...item })) }
    expectedUpdatedAt.value = data.updatedAt
    dirty.value = false
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '配置加载失败'
  } finally {
    loading.value = false
  }
}

function validate(): string | null {
  if (!form.value.items.length) return '分类项不能为空'
  const seen = new Set<string>()
  for (const item of form.value.items) {
    const label = item.label.trim()
    if (!label || label.length > 12) return '显示名称须为 1-12 个字符'
    if (seen.has(item.scene)) return '分类场景重复'
    seen.add(item.scene)
    if (!Number.isInteger(item.sort) || item.sort < 0 || item.sort > 9999) return '排序值须为 0-9999 的整数'
  }
  if (enabledCount.value === 0) return '至少保留一个启用分类'
  return null
}

async function submit(items: SceneTabItem[], successMessage: string) {
  if (!canWrite.value || saving.value) return
  saving.value = true
  try {
    await apiPut<SceneTabsConfig>('/admin/config/scene-tabs', {
      expectedUpdatedAt: expectedUpdatedAt.value,
      items: items.map((item) => ({ ...item, label: item.label.trim() })),
    })
    ElMessage.success(successMessage)
    await load()
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败'
    if (message.includes('CONFIG_VERSION_CONFLICT') || message.includes('已被其他运营')) {
      ElMessage.warning('配置已被其他运营更新，请刷新后重试')
      await load()
    } else {
      ElMessage.error(message)
    }
  } finally {
    saving.value = false
  }
}

function save() {
  const reason = validate()
  if (reason) {
    ElMessage.warning(reason)
    return
  }
  void submit(form.value.items, '保存成功，小程序端下次进入首页生效')
}

async function restoreDefault() {
  if (!canWrite.value || saving.value) return
  try {
    await ElMessageBox.confirm('将把所有分类恢复为默认配置（粗门溜车 / 粗门玩玩 / 粗门洗车全部显示），是否继续？', '恢复默认', { type: 'warning' })
  } catch {
    return
  }
  await submit(DEFAULT_ITEMS.map((item) => ({ ...item })), '已恢复默认配置')
}

function move(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= form.value.items.length) return
  const items = [...form.value.items]
  const moved = items.splice(index, 1)[0]
  if (!moved) return
  items.splice(target, 0, moved)
  form.value.items = items.map((item, position) => ({ ...item, sort: (position + 1) * 10 }))
  dirty.value = true
}

onMounted(load)
</script>

<template>
  <PageHeader title="首页分类目录" group="系统配置" description="配置首页场景分类的显示、名称与排序；保存后小程序端下次进入首页生效">
    <el-button v-if="canWrite" :disabled="saving" @click="restoreDefault">恢复默认</el-button>
    <el-button v-if="canWrite" type="primary" :disabled="saving || !dirty" :loading="saving" @click="save">保存</el-button>
  </PageHeader>

  <section v-loading="loading" class="panel">
    <div class="panel__toolbar">
      <div>
        <div class="config-meta"><strong>当前版本</strong> revision {{ form.revision }} · 最近更新 {{ updatedLabel }}</div>
        <div class="muted">隐藏后该分类不再出现在首页与列表，已分享的详情仍可打开；场景标识不可新增或编辑</div>
      </div>
      <el-tag v-if="dirty" type="warning" effect="light">有未保存的修改</el-tag>
    </div>

    <div v-if="loadError" class="state error-state">
      <span>{{ loadError }}</span>
      <el-button @click="load">重试</el-button>
    </div>
    <template v-else>
      <el-table :data="form.items" row-key="scene">
        <el-table-column label="场景" width="150">
          <template #default="{ row }"><el-tag effect="plain">{{ row.scene }}</el-tag> {{ sceneName(row.scene) }}</template>
        </el-table-column>
        <el-table-column label="显示名称" min-width="200">
          <template #default="{ row }"><el-input v-model="row.label" maxlength="12" :disabled="!canWrite" @input="markDirty" /></template>
        </el-table-column>
        <el-table-column label="排序" width="160">
          <template #default="{ row }"><el-input-number v-model="row.sort" :min="0" :max="9999" :step="10" :disabled="!canWrite" @change="markDirty" /></template>
        </el-table-column>
        <el-table-column label="启用" width="110">
          <template #default="{ row }"><el-switch v-model="row.enabled" :disabled="!canWrite" @change="markDirty" /></template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ $index }">
            <el-button size="small" :disabled="!canWrite || $index === 0" @click="move($index, -1)">上移</el-button>
            <el-button size="small" :disabled="!canWrite || $index === form.items.length - 1" @click="move($index, 1)">下移</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!form.items.length" class="empty-state">配置缺失，点击「恢复默认」生成默认 3 个分类</div>
    </template>
  </section>
</template>

<style scoped>
.config-meta { font-size: 14px; line-height: 1.8; }.config-meta strong { margin-right: 10px; }.muted { margin-top: 4px; color: var(--el-text-color-secondary, #909399); font-size: 13px; }.state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 0; color: var(--el-text-color-secondary, #909399); }.empty-state { padding: 24px 0; color: var(--el-text-color-secondary, #909399); text-align: center; }
</style>
