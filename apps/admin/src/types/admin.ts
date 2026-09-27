export type RouteStatus = 'online' | 'pending' | 'offline'
export type Scene = 'drive' | 'fish'

export interface RouteItem {
  id: string; listRank: number; title: string; cityName: string; cityCode: string; difficulty: string
  status: RouteStatus; scene: Scene; rankWeight: number; rankTag: string; tags: string[]
  impressions: number; clicks: number; favoriteCount: number; coverImageUrl: string
  createdAt: string; boundRankings: number
  bestTime: string; durationLabel: string; description: string
  lengthKm: number; elevationM: number; carType: string | null; startPoint: string | null; endPoint: string | null
  shoreKm: number | null; depthM: number | null; entryPoint: string | null; mainArea: string | null; gear: string | null
}

export interface AdminStats {
  routes: { onShelfCount: number; monthImpressions: number; ctr: number; pendingAuditCount: number }
  users: { total: number; banned: number; dau: number; mau: number; todayNew: number; yesterdayNew: number }
  fuel: { stations: number }
  content: { pending: number }
}

export interface RankingItem {
  id: string; name: string; scene: Scene; cityCode: string | null; cityName: string
  seq: number; coverageCount: number; coverRouteIds: string[]; status: RouteStatus
}

export type CityOilSource = 'manual' | 'auto' | 'failed' | ''

export interface CityItem {
  code: string; name: string; enabled: boolean; scenes: string[]; routeCount: number
  stationCount: number
  oilPrice92: number | null; oilPrice95: number | null; oilPrice98: number | null; oilPrice0: number | null
  oilSource: CityOilSource; oilUpdatedAt: string | null; oilError: string | null
}

export interface QrConfig {
  fanGroup: string; contact: string
  fanGroupAt: string | null; contactAt: string | null; savedAt: string | null
}

export interface UserDetail extends UserItem {
  phone: string; adminNote: string
  providers: Array<{ provider: string; boundAt: string }>
  favorites: Array<{ discoveryId: string; title: string; scene: Scene; createdAt: string }>
  feeds: Array<{ id: string; type: 'text' | 'video'; content: string; status: 'pending' | 'published' | 'offline'; reportCount: number; createdAt: string }>
}

export interface UserItem {
  id: string; nickname: string; avatarUrl: string; phone: string; cityName: string
  status: 'normal' | 'banned'; favoriteCount: number; postCount: number; createdAt: string; lastActiveAt: string
}

export interface FeedItem {
  id: string; type: 'text' | 'video'; content: string; reportCount: number
  status: 'pending' | 'published' | 'offline'; createdAt: string
  author: { nickname: string }; discovery: { title: string } | null
}

export interface AnalyticsData {
  summary: { impressions: number; clicks: number; ctr: number; favoriteConversion: number }
  trend: Array<{ date: string; impressions: number; clicks: number; favorites: number; newUsers: number }>
  topRoutes: Array<{ id: string; title: string; scene: Scene; impressions: number; clicks: number; ctr: number }>
}

export interface ReportItem {
  id: string; name: string; type: 'route' | 'user' | 'fuel' | 'ugc'; dateRange: string
  dimension: string; creator: string; status: 'done' | 'processing' | 'failed'; createdAt: string
}

/** 后台只维护加油站台账；油价由省级官方源下发，不在此维护 */
export interface FuelData {
  stations: Array<{
    id: string; name: string; brand: string; cityCode: string; address: string
    openingHours: string; enabled: boolean; distanceKm: number; city: { name: string }
  }>
}

