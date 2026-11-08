import { computed, shallowRef } from 'vue'
import { outdoorApi } from '@/api/outdoor'
import { BUSINESS_SCENES, SCENE_LABELS, isBusinessScene } from '@/common/scenes'
import type { BusinessScene, SceneTabsConfigView, SceneTabView } from '@/types/domain'

/**
 * 两层默认（CHG-SCENE-EXPANSION-001，2026-11-08 裁决）：
 * - 服务端默认 3 项全启用，由 `GET /v1/config/scene-tabs` 下发；
 * - 本地故障 / 旧服兜底仅 `drive`。绝不内置 3 项默认，否则「新包 + 旧服」会请求
 *   `scene=play` / `wash`，被旧服务端 422 拒绝。
 */
export const FALLBACK_SCENE_TABS: SceneTabsConfigView = {
  revision: 0,
  updatedAt: null,
  items: [{ scene: 'drive', label: SCENE_LABELS.drive, sort: 10 }],
}

/** 兼容既有引用名：内置默认即本地兜底 */
export const DEFAULT_SCENE_TABS = FALLBACK_SCENE_TABS

/** 公开配置是外部输入：逐字段校验，含 fish / 未知值 / 重复项一律视为损坏并整体回退兜底 */
function normalize(raw: unknown): SceneTabsConfigView {
  if (!raw || typeof raw !== 'object') return FALLBACK_SCENE_TABS
  const { revision, updatedAt, items } = raw as Record<string, unknown>
  if (!Array.isArray(items) || items.length === 0 || items.length > BUSINESS_SCENES.length) return FALLBACK_SCENE_TABS
  const valid: SceneTabView[] = []
  const seen = new Set<BusinessScene>()
  for (const entry of items) {
    if (!entry || typeof entry !== 'object') return FALLBACK_SCENE_TABS
    const { scene, label, sort } = entry as Record<string, unknown>
    if (!isBusinessScene(scene) || seen.has(scene)) return FALLBACK_SCENE_TABS
    if (typeof label !== 'string' || label.trim().length < 1 || label.trim().length > 12) return FALLBACK_SCENE_TABS
    if (typeof sort !== 'number' || !Number.isInteger(sort) || sort < 0 || sort > 9999) return FALLBACK_SCENE_TABS
    seen.add(scene)
    valid.push({ scene, label, sort })
  }
  return {
    revision: typeof revision === 'number' && Number.isInteger(revision) && revision >= 0 ? revision : 0,
    updatedAt: typeof updatedAt === 'string' ? updatedAt : null,
    items: valid.sort((a, b) => a.sort - b.sort || a.scene.localeCompare(b.scene)),
  }
}

/**
 * 模块级共享快照：页面卸载后保留上次成功配置，属于跨页面配置缓存而非页面局部状态，
 * 因此不存在「卸载后写回页面状态」的竞态；首页与收藏页共用同一份配置。
 */
const config = shallowRef<SceneTabsConfigView>(FALLBACK_SCENE_TABS)
let inflight: Promise<SceneTabsConfigView> | null = null

export function currentSceneTabs(): SceneTabsConfigView {
  return config.value
}

export function useSceneTabs() {
  const tabs = computed(() => config.value.items)
  const enabledScenes = computed(() => config.value.items.map((item) => item.scene))
  const revision = computed(() => config.value.revision)

  /** 并发 onShow 只发一个请求；404 / 5xx / 超时 / 损坏一律降级到仅 drive，不抛错阻断首屏 */
  function refresh(): Promise<SceneTabsConfigView> {
    if (inflight) return inflight
    inflight = outdoorApi.sceneTabs()
      .then((data) => {
        config.value = normalize(data)
        return config.value
      })
      .catch(() => {
        config.value = FALLBACK_SCENE_TABS
        return config.value
      })
      .finally(() => { inflight = null })
    return inflight
  }

  return { tabs, enabledScenes, revision, config, refresh }
}
