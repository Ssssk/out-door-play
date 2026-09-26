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
const MAX_QR_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_QR_IMAGE_LABEL = '10MB'

const canWrite = auth.hasPermission('config:write')

type QrKey = 'fanGroup' | 'contact'

const cards: Array<{ key: QrKey; index: string; title: string; usage: string }> = [
  { key: 'fanGroup', index: '01', title: '官方粉丝群二维码', usage: '小程序「我的 → 官方粉丝群」' },
  { key: 'contact', index: '02', title: '个人微信号二维码', usage: '小程序「我的 → 联系方式」' },
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
    ElMessage.error(getErrorMessage(error, '配置加载失败，请稍后重试'))
  } finally { loading.value = false }
}

function validateImage(file: File): boolean {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!supportedTypes.includes(file.type)) { ElMessage.warning('图片格式不支持，请选择 JPG、PNG 或 WEBP 文件'); return false }
  if (file.size > MAX_QR_IMAGE_BYTES) { ElMessage.warning(`图片不能超过 ${MAX_QR_IMAGE_LABEL}，请压缩后重试`); return false }
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
  reader.onerror = () => ElMessage.error('图片读取失败，请重新选择文件')
  reader.onabort = () => ElMessage.warning('图片读取已取消，请重新选择文件')
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

function updatedAtFor(key: QrKey) {
  return config[key === 'fanGroup' ? 'fanGroupAt' : 'contactAt']
}

function isChanged(key: QrKey) {
  return draft[key] !== config[key]
}

function cardStatus(key: QrKey) {
  if (isChanged(key)) return draft[key] ? '待保存' : '待保存清除'
  return draft[key] ? '已配置' : '待上传'
}

function getErrorMessage(error: unknown, fallback: string) {
  const response = (error as { response?: { status?: number; data?: { message?: unknown } } } | null)?.response
  const serverMessage = response?.data?.message
  if (typeof serverMessage === 'string' && serverMessage.trim()) return serverMessage
  if (response?.status === 413) return `图片文件过大，请压缩到 ${MAX_QR_IMAGE_LABEL} 以内后重试`
  if (error instanceof Error && error.message === 'Network Error') return '无法连接服务端，请检查本地 API 是否已启动'
  return error instanceof Error && error.message ? error.message : fallback
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
    ElMessage.error(getErrorMessage(error, '二维码保存失败，请稍后重试'))
  } finally { saving.value = false }
}

async function reset() {
  await ElMessageBox.confirm('将清空两张二维码并重置更新时间，立即生效，继续？', '重置', { type: 'warning' })
  saving.value = true
  try {
    const saved = await apiPut<QrConfig>('/admin/config/qrcodes', { fanGroup: '', contact: '' })
    Object.assign(config, saved)
    draft.fanGroup = ''
    draft.contact = ''
    dirty.value = false
    ElMessage.success('二维码配置已重置并同步至小程序')
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '二维码重置失败，请稍后重试'))
  } finally { saving.value = false }
}

onMounted(load)
</script>
<template>
  <PageHeader title="上传二维码" group="系统配置" description="配置小程序「我的」页底部两个扫码入口，保存后无需发版即时可见" />

  <div class="banner">
    <span class="banner__icon">i</span>
    <div>
      <strong>小程序扫码入口配置</strong>
      <small>上传后保存到服务端，小程序端下次进入「我的」页即可读取最新二维码，无需重新发版。</small>
    </div>
    <div class="banner__facts"><span>2 个入口</span><span>服务端同步</span></div>
  </div>

  <div v-loading="loading" class="cards">
    <section v-for="card in cards" :key="card.key" class="panel qr-card">
      <header class="qr-card__head">
        <div class="qr-card__identity">
          <span class="qr-card__index">{{ card.index }}</span>
          <div>
            <h3>{{ card.title }}</h3>
            <small>{{ card.usage }}</small>
          </div>
        </div>
        <span class="qr-card__status" :class="`is-${cardStatus(card.key) === '已配置' ? 'ready' : cardStatus(card.key) === '待上传' ? 'empty' : 'pending'}`">
          {{ cardStatus(card.key) }}
        </span>
      </header>
      <div class="qr-card__body">
        <div class="qr-preview-wrap">
          <div class="qr-preview">
          <img v-if="draft[card.key]" :src="draft[card.key]" alt="二维码预览" />
            <span v-else class="qr-preview__empty"><strong>QR</strong><small>未上传</small></span>
          </div>
          <span class="qr-preview__caption">当前预览</span>
        </div>
        <div class="qr-meta">
          <label v-if="canWrite" class="qr-drop" @dragover.prevent @drop="onDrop(card.key, $event)">
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onPick(card.key, $event)" />
            <span class="qr-drop__icon">↑</span>
            <strong>拖拽图片到这里</strong>
            <span>或点击选择本地文件</span>
            <small>JPG / PNG / WEBP · 最大 {{ MAX_QR_IMAGE_LABEL }}</small>
          </label>
          <div v-else class="qr-readonly">当前账号仅可查看二维码，暂无上传权限</div>
          <div class="qr-meta__footer">
            <span v-if="updatedAtFor(card.key)">上次更新 {{ new Date(updatedAtFor(card.key) || '').toLocaleString('zh-CN', { hour12: false }) }}</span>
            <span v-else>尚未上传过二维码</span>
            <div v-if="canWrite" class="qr-actions">
              <label class="el-button el-button--primary is-plain qr-pick">
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onPick(card.key, $event)" />
                选择图片
              </label>
              <el-button type="danger" plain :disabled="!draft[card.key]" @click="clearOne(card.key)">移除</el-button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>

  <section class="panel qr-footer">
    <div class="qr-footer__message">
      <span class="qr-footer__dot" :class="{ 'is-dirty': dirty }" />
      <div>
        <strong>{{ dirty ? '有未保存的更改' : '配置已同步' }}</strong>
        <small>{{ dirty ? '保存后将立即同步到小程序端' : '服务端配置会在小程序下次进入「我的」页时生效' }}</small>
      </div>
    </div>
    <div class="qr-footer__right">
      <span v-if="syncedLabel && !dirty" class="qr-footer__sync">{{ syncedLabel }}</span>
      <el-button v-if="canWrite" @click="reset">重置</el-button>
      <el-button v-if="canWrite" type="primary" :loading="saving" :disabled="!dirty" @click="save">保存配置</el-button>
    </div>
  </section>
</template>

<style scoped>
.banner { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 14px; align-items: center; margin-bottom: 20px; padding: 18px 20px; border: 1px solid #d8e5ff; border-radius: 14px; background: linear-gradient(120deg, #f2f7ff 0%, #f8fbff 100%); }
.banner__icon { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 11px; color: #fff; background: #2563eb; font-size: 16px; font-weight: 800; }
.banner strong, .banner small { display: block; }
.banner strong { color: #1e3a8a; font-size: 14px; font-weight: 700; }
.banner small { margin-top: 4px; color: #5570aa; font-size: 12px; line-height: 1.6; }
.banner__facts { display: flex; gap: 8px; align-items: center; color: #4362a0; font-size: 12px; white-space: nowrap; }
.banner__facts span { padding: 6px 9px; border: 1px solid #cbdcff; border-radius: 999px; background: rgba(255,255,255,.7); }
.cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; align-items: stretch; }
.cards > .qr-card + .qr-card { margin-top: 0; }
.qr-card { display: flex; min-height: 356px; flex-direction: column; padding: 22px; border-radius: 16px; transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease; }
.qr-card:hover { border-color: #cbd99a; box-shadow: 0 14px 32px rgba(45, 55, 25, .08); transform: translateY(-1px); }
.qr-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.qr-card__identity { display: flex; min-width: 0; align-items: center; gap: 12px; }
.qr-card__index { display: grid; width: 34px; height: 34px; flex: 0 0 auto; place-items: center; border-radius: 10px; color: #516d00; background: #efffc3; font-size: 12px; font-weight: 800; }
.qr-card__head h3 { margin: 0 0 5px; color: var(--el-text-color-primary); font-size: 16px; font-weight: 750; letter-spacing: -.01em; }
.qr-card__head small { color: var(--el-text-color-secondary); font-size: 12px; }
.qr-card__status { flex: 0 0 auto; padding: 5px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.qr-card__status.is-ready { color: #3d6a21; background: #eef8e8; }
.qr-card__status.is-empty { color: #7a7770; background: #f4f3ef; }
.qr-card__status.is-pending { color: #9a6700; background: #fff5d9; }
.qr-card__body { display: grid; grid-template-columns: 148px minmax(0, 1fr); gap: 20px; flex: 1; align-items: stretch; }
.qr-preview-wrap { display: grid; align-content: start; gap: 8px; }
.qr-preview { display: grid; width: 148px; height: 148px; place-items: center; padding: 8px; overflow: hidden; border: 1px solid #e5e8dc; border-radius: 14px; background: #f6f8f0; }
.qr-preview img { display: block; width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
.qr-preview__empty { display: grid; gap: 5px; place-items: center; color: #9aa08f; }
.qr-preview__empty strong { color: #c1c7b5; font-size: 26px; letter-spacing: .08em; }
.qr-preview__empty small, .qr-preview__caption { color: var(--el-text-color-placeholder); font-size: 11px; }
.qr-preview__caption { text-align: center; }
.qr-meta { display: flex; min-width: 0; flex-direction: column; }
.qr-drop { display: grid; min-height: 148px; place-items: center; align-content: center; gap: 6px; padding: 16px; border: 1px dashed #cfd8ba; border-radius: 14px; color: var(--el-text-color-secondary); background: #fbfcf7; text-align: center; cursor: pointer; transition: border-color .2s ease, background .2s ease, color .2s ease; }
.qr-drop:hover { border-color: #91b500; color: var(--el-text-color-primary); background: #f7ffe2; }
.qr-drop__icon { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 9px; color: #587900; background: #efffc3; font-size: 18px; font-weight: 800; }
.qr-drop strong { color: var(--el-text-color-primary); font-size: 13px; }
.qr-drop span:not(.qr-drop__icon) { font-size: 12px; }
.qr-drop small { color: var(--el-text-color-placeholder); font-size: 11px; }
.qr-readonly { display: grid; min-height: 148px; place-items: center; padding: 16px; border: 1px dashed var(--el-border-color); border-radius: 14px; color: var(--el-text-color-secondary); background: var(--el-fill-color-lighter); font-size: 12px; text-align: center; }
.qr-meta__footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: auto; padding-top: 14px; color: var(--el-text-color-placeholder); font-size: 11px; }
.qr-actions { display: flex; flex: 0 0 auto; gap: 8px; }
.qr-pick { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.qr-footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 20px; padding: 15px 18px; border-radius: 14px; }
.qr-footer__message, .qr-footer__right { display: flex; align-items: center; gap: 10px; }
.qr-footer__message strong, .qr-footer__message small { display: block; }
.qr-footer__message strong { color: var(--el-text-color-primary); font-size: 13px; }
.qr-footer__message small { margin-top: 3px; color: var(--el-text-color-secondary); font-size: 11px; }
.qr-footer__dot { width: 9px; height: 9px; flex: 0 0 auto; border-radius: 50%; background: #6ca443; box-shadow: 0 0 0 4px #edf7e7; }
.qr-footer__dot.is-dirty { background: #d59522; box-shadow: 0 0 0 4px #fff5dd; }
.qr-footer__right { justify-content: flex-end; }
.qr-footer__sync { color: var(--el-color-success); font-size: 11px; white-space: nowrap; }
@media (max-width: 1180px) { .banner { grid-template-columns: auto minmax(0, 1fr); } .banner__facts { grid-column: 2; } .cards { gap: 14px; } .qr-card { padding: 18px; } .qr-card__body { grid-template-columns: 116px minmax(0, 1fr); gap: 14px; } .qr-preview { width: 116px; height: 116px; } }
@media (max-width: 900px) { .cards { grid-template-columns: 1fr; } .qr-card { min-height: 0; } .qr-footer { align-items: flex-start; flex-direction: column; } .qr-footer__right { width: 100%; justify-content: flex-end; flex-wrap: wrap; } }
@media (max-width: 620px) { .banner { grid-template-columns: auto minmax(0, 1fr); } .banner__facts { display: none; } .qr-card__body { grid-template-columns: 1fr; } .qr-preview-wrap { justify-items: center; } .qr-preview { width: 160px; height: 160px; } .qr-meta__footer { align-items: flex-start; flex-direction: column; } .qr-actions { width: 100%; } }
</style>
