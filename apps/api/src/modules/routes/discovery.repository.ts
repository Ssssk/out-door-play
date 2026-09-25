export type DiscoveryScene = 'drive' | 'fish'

export interface PublicCityRecord {
  code: string
  name: string
  scenes?: unknown
}

export interface PublicDiscoveryRecord {
  id: string
  scene: DiscoveryScene
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
  list(scene: DiscoveryScene, limit: number, cityCode?: string): Promise<PublicDiscoveryRecord[]>
  find(id: string, scene: DiscoveryScene): Promise<PublicDiscoveryRecord | null>
}

export const DISCOVERY_REPOSITORY = Symbol('DISCOVERY_REPOSITORY')
