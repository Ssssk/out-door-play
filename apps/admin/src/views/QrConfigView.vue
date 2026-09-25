<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiGet, apiPut } from '../api/client'
import PageHeader from '../components/PageHeader.vue'
import type { QrConfig } from '../types/admin'
import { useAuthStore } from '../stores/auth'

// 对齐 web-system-config.md：小程序「我的」页底部两个扫码入口的二维码配置
const auth = useAuthStore()
const config = reactive<QrConfig>({ fanGroup: '', contact: '', fanGroupAt: null, contactAt: null, savedAt: null })
const loading = ref(true)
const saving = ref(false)
const dirty = ref(false)
const draft = reactive({ fanGroup: '', contact: '' })

const canWrite = auth.hasPermission('config:write')

const cards = [
  { key: 'fanGroup' as const, title: '官方粉丝群二维码', usage: '用于小程序端「我的 → 官方粉丝群」扫码抽屉' },
  { key: 'contact' as const, title: '个人微信号二维码', usage: '用于小程序端「我的 → 联系方式」扫码抽屉' },
]

const syncedLabel = computed(() => config.savedAt ? `已同步至小程序 · ${new Date(config.savedAt).toLocaleString('zh-CN', { hour12: false })}` : '')

async function load() {
  loading.value = true
  try {
    const data = await apiGet<QrConfig>('/admin/config/qrcodes')
    Object.assign(config, data)
    draft.fanGroup = data.fanGroup
    draft.contact = data.contact
    dirty.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '配置加载失败')
  } finally { loading.value = false }
}

function validateImage(file: File): boolean {
  if (!file.type.startsWith('image/')) { ElMessage.warning('请选择图片文件'); return false }
  if (file.size > 2 * 1024 * 1024) { ElMessage.warning('图片不能超过 2MB'); return false }
  return true
}

function readFile(key: 'fanGroup' | 'contact', file: File) {
  if (!validateImage(file)) return
  const reader = new FileReader()
  reader.onload = () => {
    draft[key] = String(reader.result || '')
    dirty.value = true
    ElMessage.success('图片已读取，记得点「保存配置」')
  }
  reader.readAsDataURL(file)
}

function onPick(key: 'fanGroup' | 'contact', event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) readFile(key, file)
  input.value = ''
}

function onDrop(key: 'fanGroup' | 'contact', event: DragEvent) {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (file) readFile(key, file)
}

function clearOne(key: 'fanGroup' | 'contact') {
  draft[key] = ''
  dirty.value = true
}

async function save() {
  saving.value = true
  try {
    const saved = await apiPut<QrConfig>('/admin/config/qrcodes', { fanGroup: draft.fanGroup, contact: draft.contact })
    Object.assign(config, saved)
    dirty.value = false
    ElMessage.success('二维码配置已保存并同步至小程序')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally { saving.value = false }
}

async function reset() {
  await ElMessageBox.confirm('将清空两张二维码并重置更新时间，继续？', '重置', { type: 'warning' })
  draft.fanGroup = ''
  draft.contact = ''
  dirty.value = true
  ElMessage.info('已清空，点击「保存配置」生效')
}

onMounted(load)
</script>
<template>
  <PageHeader title="上传二维码" group="系统配置" description="配置小程序「我的」页底部两个扫码入口，保存后无需发版即时可见" />

  <div class="banner">
    <span class="banner__icon">i</span>
    <div>
      <strong>此页配置小程序「我的」页底部的两个扫码入口</strong>
      <small>保存后写入服务端配置，小程序端下次进入「我的」页即拉取最新二维码，无需发版。</small>
    </div>
  </div>

  <div v-loading="loading" class="cards">
    <section v-for="card in cards" :key="card.key" class="panel qr-card">
      <header class="qr-card__head">
        <h3>{{ card.title }}</h3>
        <small>{{ card.usage }}</small>
      </header>
      <div class="qr-card__body">
        <div class="qr-preview">
          <img v-if="draft[card.key]" :src="draft[card.key]" alt="二维码预览" />
          <span v-else>未上传</span>
        </div>
        <div class="qr-meta">
          <strong>支持 jpg / png / webp 格式</strong>
          <p>建议 ≤ 300×300 像素，不超过 2MB；拖拽到方框内或点「选择图片」上传</p>
          <p v-if="config[card.key === 'fanGroup' ? 'fanGroupAt' : 'contactAt']" class="qr-meta__time">
            上次更新：{{ new Date(config[card.key === 'fanGroup' ? 'fanGroupAt' : 'contactAt'] || '').toLocaleString('zh-CN', { hour12: false }) }}
          </p>
          <label v-if="canWrite" class="qr-drop" @dragover.prevent @drop="onDrop(card.key, $event)">
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onPick(card.key, $event)" />
            <span>拖拽图片到此处，或点击选择</span>
          </label>
        </div>
        <div class="qr-actions" v-if="canWrite">
          <label class="el-button el-button--primary is-plain qr-pick">
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onPick(card.key, $event)" />
            选择图片
          </label>
          <el-button type="danger" plain :disabled="!draft[card.key]" @click="clearOne(card.key)">清除</el-button>
        </div>
      </div>
    </section>
  </div>

  <section class="panel qr-footer">
    <div class="qr-footer__left">
      <el-button v-if="canWrite" type="primary" :loading="saving" :disabled="!dirty" @click="save">保存配置</el-button>
      <el-button v-if="canWrite" @click="reset">重置</el-button>
      <small class="muted">保存后写入服务端配置（system_configs.qrcodes）</small>
    </div>
    <div v-if="syncedLabel && !dirty" class="qr-footer__sync"><span class="online-dot" /> {{ syncedLabel }}</div>
  </section>
</template>

<style scoped>
.banner { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px; padding: 14px 18px; border-radius: 12px; background: var(--el-color-primary-light-9); }
.banner__icon { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--el-color-primary); color: #fff; font-weight: 700; flex-shrink: 0; }
.banner strong { display: block; font-size: 14px; }
.banner small { color: var(--el-text-color-secondary); }
.cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.qr-card__head { margin-bottom: 14px; }
.qr-card__head h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; font-size: 15px; }
.qr-card__head h3::before { content: ''; width: 4px; height: 16px; border-radius: 2px; background: var(--chumen-ink, #1a1a1a); }
.qr-card__head small { color: var(--el-text-color-secondary); }
.qr-card__body { display: flex; gap: 16px; align-items: flex-start; }
.qr-preview { display: flex; align-items: center; justify-content: center; width: 120px; height: 120px; border: 1px dashed var(--el-border-color); border-radius: 10px; background: var(--el-fill-color-lighter); color: var(--el-text-color-placeholder); font-size: 13px; overflow: hidden; flex-shrink: 0; }
.qr-preview img { width: 100%; height: 100%; object-fit: contain; }
.qr-meta { flex: 1; min-width: 0; }
.qr-meta strong { font-size: 13px; }
.qr-meta p { margin: 6px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }
.qr-meta__time { color: var(--el-color-primary); }
.qr-drop { display: block; margin-top: 10px; padding: 10px 12px; border: 1px dashed var(--el-border-color); border-radius: 8px; color: var(--el-text-color-secondary); font-size: 12px; text-align: center; cursor: pointer; }
.qr-drop:hover { border-color: var(--el-color-primary); background: var(--el-fill-color-light); }
.qr-actions { display: flex; flex-direction: column; gap: 8px; }
.qr-pick { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.qr-footer { display: flex; align-items: center; justify-content: space-between; }
.qr-footer__left { display: flex; align-items: center; gap: 12px; }
.qr-footer__sync { display: flex; align-items: center; gap: 6px; color: var(--el-color-success); font-size: 13px; }
.online-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--el-color-success); }
</style>
