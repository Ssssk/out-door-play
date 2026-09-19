export type RouteStatus = 'online' | 'pending' | 'offline'
export type Scene = 'drive' | 'fish'

export interface RouteItem {
  id: string; listRank: number; title: string; cityName: string; cityCode: string; difficulty: string
  status: RouteStatus; scene: Scene; rankWeight: number; rankTag: string; tags: string[]
  impressions: number; clicks: number; favoriteCount: number; coverImageUrl: string
}

export interface AdminStats {
  routes: { onShelfCount: number; monthImpressions: number; ctr: number; pendingAuditCount: number }
  users: { total: number; banned: number }
  fuel: { stations: number }
  content: { pending: number }
}

export interface RankingItem {
  id: string; name: string; scene: Scene; coverageCount: number; weight: number
  status: RouteStatus; city: { name: string } | null
}

export interface CityItem {
  code: string; name: string; enabled: boolean; scenes: string[]; routeCount: number
  stationCount: number
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

