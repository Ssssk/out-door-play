/**
 * 业务场景单一事实来源（CHG-SCENE-EXPANSION-001）。
 * 纯领域模块：不依赖 NestJS、Prisma 或任何基础设施。
 *
 * 裁决口径：业务写入白名单 = BUSINESS_SCENES ⊆ enum Scene 值集合；
 * `fish` 只是兼容期的读值，不可写入；play 必须带合法子类型。
 */
export const BUSINESS_SCENES = ['drive', 'play', 'wash'] as const
export type BusinessScene = (typeof BUSINESS_SCENES)[number]

export const LEGACY_SCENES = ['fish'] as const
export type LegacyScene = (typeof LEGACY_SCENES)[number]

export type SceneQuery = BusinessScene | LegacyScene

export const PLAY_TYPES = ['fishing', 'camping', 'checkin'] as const
export type PlayType = (typeof PLAY_TYPES)[number]

export const SCENE_SUBTYPE_INVALID = 'SCENE_SUBTYPE_INVALID'

export const SCENE_LABELS: Record<BusinessScene, string> = {
  drive: '粗门溜车',
  play: '粗门玩玩',
  wash: '粗门洗车',
}

export const PLAY_TYPE_LABELS: Record<PlayType, string> = {
  fishing: '钓鱼',
  camping: '露营',
  checkin: '打卡',
}

/** 服务端下发默认 3 项全启用；小程序本地故障兜底仅 drive，两层默认分离 */
export const DEFAULT_SCENE_TABS: ReadonlyArray<{ scene: BusinessScene; label: string; enabled: boolean; sort: number }> = [
  { scene: 'drive', label: SCENE_LABELS.drive, enabled: true, sort: 10 },
  { scene: 'play', label: SCENE_LABELS.play, enabled: true, sort: 20 },
  { scene: 'wash', label: SCENE_LABELS.wash, enabled: true, sort: 30 },
]

export class SceneSubTypeInvalidError extends Error {
  readonly code = SCENE_SUBTYPE_INVALID

  constructor(message: string) {
    super(message)
    this.name = 'SceneSubTypeInvalidError'
  }
}

export function isBusinessScene(value: unknown): value is BusinessScene {
  return typeof value === 'string' && (BUSINESS_SCENES as readonly string[]).includes(value)
}

export function isPlayType(value: unknown): value is PlayType {
  return typeof value === 'string' && (PLAY_TYPES as readonly string[]).includes(value)
}

export function isSceneQuery(value: unknown): value is SceneQuery {
  return isBusinessScene(value) || (typeof value === 'string' && (LEGACY_SCENES as readonly string[]).includes(value))
}

/** Repository 查询条件：scenes 永远是归一化后的业务场景，legacy 表示还要兼收尚未回填的 fish 记录 */
export interface SceneFilter {
  scenes: BusinessScene[]
  subType: PlayType | null
  legacy: boolean
}

/**
 * 读取归一化：fish → play/fishing（兼容期同时查 fish 与 play+fishing）。
 * 写入路径不得调用本函数；fish 不能用于新建。
 */
export function normalizeScene(scene: SceneQuery, subType?: PlayType | null): SceneFilter {
  if (scene === 'fish') {
    if (subType && subType !== 'fishing') {
      throw new SceneSubTypeInvalidError('历史钓鱼分类只支持 fishing 子类型')
    }
    return { scenes: ['play'], subType: 'fishing', legacy: true }
  }
  if (scene === 'play') {
    if (subType && !isPlayType(subType)) throw new SceneSubTypeInvalidError('粗门玩玩的子类型不合法')
    return { scenes: ['play'], subType: subType ?? null, legacy: false }
  }
  if (subType) throw new SceneSubTypeInvalidError('只有粗门玩玩支持子类型')
  return { scenes: [scene], subType: null, legacy: false }
}

/** 写入校验：返回可持久化的子类型；非法组合抛领域错误，由用例层转 422 */
export function writableSceneSubType(scene: unknown, subType?: unknown): PlayType | null {
  if (!isBusinessScene(scene)) {
    throw new SceneSubTypeInvalidError('业务场景不合法；fish 仅作兼容读值，不可写入')
  }
  if (scene === 'play') {
    if (!isPlayType(subType)) throw new SceneSubTypeInvalidError('粗门玩玩必须选择钓鱼 / 露营 / 打卡之一')
    return subType
  }
  if (subType !== undefined && subType !== null && subType !== '') {
    throw new SceneSubTypeInvalidError('只有粗门玩玩支持子类型')
  }
  return null
}

/** 钓点专属字段（水深 / 岸线 / 钓具）的判定依据 */
export function isFishingRecord(scene: SceneQuery, subType: PlayType | null): boolean {
  return scene === 'fish' || (scene === 'play' && subType === 'fishing')
}

/**
 * 目的地型内容（2026-11-12 露营，2026-11-13 扩展打卡与洗车）：`wash`、
 * `play + camping`、`play + checkin`。
 * 洗车 / 露营 / 打卡是目的地不是路线，只有终点；难度 / 难度等级 / 建议时段 / 耗时 /
 * 路线长 / 落差 / 起点 / 起点坐标均不适用，服务端不写入占位值。
 * 差异点：洗车保留 `carType`（可洗车型）与 `bestTime`（营业时间），不在此口径清空。
 */
export function isDestinationOnlyRecord(scene: SceneQuery, subType: PlayType | null): boolean {
  return scene === 'wash' || (scene === 'play' && (subType === 'camping' || subType === 'checkin'))
}
