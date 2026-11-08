import type { PlayType, SceneQuery, SceneFilter } from '../../common/scenes'

export type DiscoveryScene = SceneQuery
export type { SceneFilter } from '../../common/scenes'

export interface PublicCityRecord {
  code: string
  name: string
  scenes?: unknown
}

export interface PublicDiscoveryRecord {
  id: string
  scene: DiscoveryScene
  subType: PlayType | null
  title: string
  rank: number
  rankTag: string
  distanceKm: number
  lengthKm: number
  elevationM: number
  depthM: number | null
  difficulty: string
  coverImageUrl: string
  durationLabel: string
  bestTime: string
  carType: string | null
  startPoint: string | null
  endPoint: string | null
  entryPoint: string | null
  mainArea: string | null
  gear: string | null
  shoreKm: number | null
  description: string
  tags: unknown
  latitude: number
  longitude: number
  elevationPoints: unknown
}

export interface DiscoveryRepository {
  listCities(): Promise<PublicCityRecord[]>
  /** 兼容既有调用：直接传 scene 字符串时内部做归一化 */
  list(filter: SceneFilter | DiscoveryScene, limit: number, cityCode?: string): Promise<PublicDiscoveryRecord[]>
  /** 详情按集合放行，永不引入分类显隐判断 */
  find(id: string, filter: SceneFilter | DiscoveryScene | DiscoveryScene[], subType?: PlayType | null): Promise<PublicDiscoveryRecord | null>
}

export const DISCOVERY_REPOSITORY = Symbol('DISCOVERY_REPOSITORY')
