import type { BusinessScene, LegacyScene, PlayType, Scene } from '@/types/domain'

/**
 * 与服务端 `apps/api/src/common/scenes.ts` 保持一致的客户端等价常量。
 * 两层默认（2026-11-08 裁决）：服务端下发默认 3 项全启用；客户端本地故障兜底仅 drive。
 */
export const BUSINESS_SCENES: readonly BusinessScene[] = ['drive', 'play', 'wash']

/** 只读兼容值：旧包 / 旧服仍可能返回 fish，新包不得把它作为分类项 */
export const LEGACY_SCENES: readonly LegacyScene[] = ['fish']

export const PLAY_TYPES: readonly PlayType[] = ['fishing', 'camping', 'checkin']

export const SCENE_LABELS: Record<BusinessScene, string> = {
  drive: '粗门溜车',
  play: '粗门玩玩',
  wash: '粗门洗车',
}

export function isBusinessScene(value: unknown): value is BusinessScene {
  return typeof value === 'string' && (BUSINESS_SCENES as readonly string[]).includes(value)
}

export function isPlayType(value: unknown): value is PlayType {
  return typeof value === 'string' && (PLAY_TYPES as readonly string[]).includes(value)
}

/**
 * 钓点专属字段（水深 / 岸线 / 钓具）与详情分流的判定依据。
 * 兼容期同时接受尚未回填的 `fish` 与已回填的 `play + fishing`。
 */
export function isFishingRecord(scene: Scene, subType?: PlayType | null): boolean {
  return scene === 'fish' || (scene === 'play' && subType === 'fishing')
}

/** 露营是目的地不是路线：只有终点，不展示难度/耗时/路线长/落差/车型/起点等指标 */
export function isDestinationOnlyRecord(scene: Scene, subType?: PlayType | null): boolean {
  return scene === 'play' && subType === 'camping'
}
