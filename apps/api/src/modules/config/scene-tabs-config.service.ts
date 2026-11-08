import { ConflictException, Injectable, Logger, UnprocessableEntityException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { BUSINESS_SCENES, DEFAULT_SCENE_TABS, isBusinessScene } from '../../common/scenes'
import type { BusinessScene } from '../../common/scenes'

export type Scene = BusinessScene

export interface SceneTabItem {
  scene: Scene
  label: string
  enabled: boolean
  sort: number
}

export interface AdminSceneTabs {
  revision: number
  updatedAt: string | null
  items: SceneTabItem[]
}

export interface PublicSceneTabs {
  revision: number
  updatedAt: string | null
  items: { scene: Scene; label: string; sort: number }[]
}

interface SceneTabsValue {
  revision: number
  items: SceneTabItem[]
}

export const SCENE_TABS_CONFIG_KEY = 'scene_tabs'
const SCENE_WHITELIST: Scene[] = [...BUSINESS_SCENES]

/** 服务端下发默认 3 项全启用；小程序本地故障兜底仅 drive，两层默认分离 */
export const DEFAULT_ADMIN_SCENE_TABS: AdminSceneTabs = {
  revision: 0,
  updatedAt: null,
  items: DEFAULT_SCENE_TABS.map((item) => ({ ...item })),
}

function sortItems(items: SceneTabItem[]): SceneTabItem[] {
  return [...items].sort((a, b) => a.sort - b.sort || a.scene.localeCompare(b.scene))
}

/** 返回校验失败原因；null 表示合法。DTO 之外再做一次业务校验，防止绕过 HTTP 直接调用。 */
export function validateSceneTabItems(items: unknown): string | null {
  if (!Array.isArray(items) || items.length === 0 || items.length > SCENE_WHITELIST.length) return '分类项数量不合法'
  const seen = new Set<string>()
  let enabledCount = 0
  for (const item of items) {
    if (!item || typeof item !== 'object') return '分类项格式不合法'
    const { scene, label, enabled, sort } = item as Record<string, unknown>
    if (!isBusinessScene(scene) || !SCENE_WHITELIST.includes(scene)) return '存在未知业务场景'
    if (seen.has(scene)) return '分类场景重复'
    seen.add(scene)
    if (typeof label !== 'string' || label.trim().length < 1 || label.trim().length > 12) return '显示名称须为 1-12 个字符'
    if (typeof enabled !== 'boolean') return '启用状态必须为布尔值'
    if (typeof sort !== 'number' || !Number.isInteger(sort) || sort < 0 || sort > 9999) return '排序值须为 0-9999 的整数'
    if (enabled) enabledCount += 1
  }
  if (enabledCount === 0) return '至少保留一个启用分类'
  return null
}

/** 残留含 fish 的旧配置视为损坏，回退服务端 3 项默认（裁决：不整体报错） */
function parseStoredValue(raw: unknown): SceneTabsValue | null {
  if (!raw || typeof raw !== 'object') return null
  const { revision, items } = raw as Record<string, unknown>
  if (typeof revision !== 'number' || !Number.isInteger(revision) || revision < 0) return null
  if (validateSceneTabItems(items) !== null) return null
  return { revision, items: (items as SceneTabItem[]).map((item) => ({ ...item, label: item.label.trim() })) }
}

/**
 * 首页分类目录配置：单一键值聚合，整份替换写入。
 * 不做进程内缓存：保存发生在 Admin 进程，缓存无法跨 API 进程失效。
 */
@Injectable()
export class SceneTabsConfigService {
  private readonly logger = new Logger(SceneTabsConfigService.name)

  constructor(private readonly prisma: PrismaService) {}

  private defaults(): AdminSceneTabs {
    return { ...DEFAULT_ADMIN_SCENE_TABS, items: sortItems(DEFAULT_ADMIN_SCENE_TABS.items.map((item) => ({ ...item }))) }
  }

  private async read(): Promise<AdminSceneTabs> {
    const record = await this.prisma.systemConfig.findUnique({ where: { key: SCENE_TABS_CONFIG_KEY } })
    if (!record) return this.defaults()
    const value = parseStoredValue(record.value)
    if (!value) {
      this.logger.warn({ event: 'scene_tabs_config_invalid', key: SCENE_TABS_CONFIG_KEY })
      return this.defaults()
    }
    return { revision: value.revision, updatedAt: record.updatedAt.toISOString(), items: sortItems(value.items) }
  }

  /** 公开读：只投影启用项，不暴露隐藏项与内部字段 */
  async publicView(): Promise<PublicSceneTabs> {
    const { revision, updatedAt, items } = await this.read()
    return {
      revision,
      updatedAt,
      items: items.filter((item) => item.enabled).map(({ scene, label, sort }) => ({ scene, label, sort })),
    }
  }

  /** 管理端读：全量项 + 并发 token（updatedAt） */
  async adminView(): Promise<AdminSceneTabs> {
    return this.read()
  }

  /** 列表用例的服务端强制点：隐藏场景不进入 Repository 查询 */
  async enabledScenes(): Promise<Set<Scene>> {
    const { items } = await this.read()
    return new Set(items.filter((item) => item.enabled).map((item) => item.scene))
  }

  async update(items: SceneTabItem[], expectedUpdatedAt: string | null, actor = 'unknown'): Promise<AdminSceneTabs> {
    const reason = validateSceneTabItems(items)
    if (reason) {
      this.logger.warn({ event: 'scene_tabs_config_rejected', actor, reason })
      throw new UnprocessableEntityException({ code: 'CONFIG_INVALID', message: reason })
    }
    const normalized = sortItems(items.map((item) => ({ ...item, label: item.label.trim() })))
    const record = await this.prisma.systemConfig.findUnique({ where: { key: SCENE_TABS_CONFIG_KEY } })
    const current = record ? parseStoredValue(record.value) : null
    const revision = (current?.revision ?? 0) + 1
    const value = { revision, items: normalized }

    if (record) {
      // 存储值损坏（如兼容期残留 fish）时读取端返回内存默认且 updatedAt=null；
      // 允许运营用 null token 直接修复这份记录，否则该配置永远无法保存。
      const repair = current === null && !expectedUpdatedAt
      if (repair) this.logger.warn({ event: 'scene_tabs_config_repaired', actor, key: SCENE_TABS_CONFIG_KEY })
      const expected = repair ? record.updatedAt : expectedUpdatedAt ? new Date(expectedUpdatedAt) : null
      if (!expected || Number.isNaN(expected.getTime()) || expected.getTime() !== record.updatedAt.getTime()) {
        this.logger.warn({ event: 'scene_tabs_config_conflict', actor, key: SCENE_TABS_CONFIG_KEY })
        throw new ConflictException({ code: 'CONFIG_VERSION_CONFLICT', message: '配置已被其他运营更新，请刷新后重试' })
      }
      const updated = await this.prisma.systemConfig.updateMany({
        where: { key: SCENE_TABS_CONFIG_KEY, updatedAt: expected },
        data: { value: value as object },
      })
      if (updated.count !== 1) {
        this.logger.warn({ event: 'scene_tabs_config_conflict', actor, key: SCENE_TABS_CONFIG_KEY })
        throw new ConflictException({ code: 'CONFIG_VERSION_CONFLICT', message: '配置已被其他运营更新，请刷新后重试' })
      }
    } else {
      if (expectedUpdatedAt !== null && expectedUpdatedAt !== undefined) {
        this.logger.warn({ event: 'scene_tabs_config_conflict', actor, key: SCENE_TABS_CONFIG_KEY })
        throw new ConflictException({ code: 'CONFIG_VERSION_CONFLICT', message: '配置已被其他运营更新，请刷新后重试' })
      }
      try {
        await this.prisma.systemConfig.create({ data: { key: SCENE_TABS_CONFIG_KEY, value: value as object } })
      } catch (error) {
        if ((error as { code?: string }).code === 'P2002') {
          this.logger.warn({ event: 'scene_tabs_config_conflict', actor, key: SCENE_TABS_CONFIG_KEY })
          throw new ConflictException({ code: 'CONFIG_VERSION_CONFLICT', message: '配置已被其他运营更新，请刷新后重试' })
        }
        throw error
      }
    }

    this.logger.log({ event: 'scene_tabs_config_updated', actor, revision, scenes: normalized.map((item) => `${item.scene}:${item.enabled}`) })
    return this.adminView()
  }
}
