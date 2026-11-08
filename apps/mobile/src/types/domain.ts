/** 三个顶层业务分类；新写入只取这 3 值 */
export type BusinessScene = 'drive' | 'play' | 'wash'

/** 兼容期读值：旧包 / 旧服仍可能返回 fish；新包不得写入，也不作为分类项 */
export type LegacyScene = 'fish'

export type Scene = BusinessScene | LegacyScene

/** 粗门玩玩的子类型；其它场景为 null */
export type PlayType = 'fishing' | 'camping' | 'checkin'

/** 首页分类目录（运营后台可配）：小程序只读启用项 */
export interface SceneTabView {
  scene: BusinessScene
  label: string
  sort: number
}

export interface SceneTabsConfigView {
  revision: number
  updatedAt: string | null
  items: SceneTabView[]
}

export type Difficulty = '入门级' | '轻松级' | '普通级' | '进阶级' | '挑战级'

export interface City {
  code: string
  name: string
}

export interface RouteCard {
  id: string
  scene: Scene
  /** 仅 play 下非空；旧服务端不返回该字段，故可选 */
  subType?: PlayType | null
  title: string
  rank: number
  rankTag: string
  distanceKm: number
  lengthKm: number
  elevationM: number | null
  depthM: number | null
  difficulty: Difficulty
  coverImageUrl: string
  /** 目的地坐标，用于按设备定位实算「距你」距离 */
  latitude?: number | null
  longitude?: number | null
}

export interface RouteDetail extends RouteCard {
  durationLabel: string
  bestTime: string
  carType: string | null
  startPoint: string | null
  endPoint: string | null
  description: string
  tags: string[]
  latitude: number
  longitude: number
  elevationPoints: number[]
}

export interface FishingSpot extends RouteCard {
  shoreKm: number | null
  depthM: number | null
  entryPoint: string | null
  mainArea: string | null
  gear: string | null
  durationLabel: string
  bestTime: string
  description: string
  tags: string[]
  latitude: number
  longitude: number
}

export interface FuelPrice {
  grade: string
  price: number
  change: number
}

/** 单期调价快照：date 为完整 YYYY-MM-DD，change 为较上期涨跌（元/升） */
export interface FuelPriceHistoryItem {
  date: string
  price: number
  change: number
}

/** 某油号的历史调价序列；items 按日期倒序（最新一期在前） */
export interface FuelPriceHistory {
  items: FuelPriceHistoryItem[]
  region: string
  grade: string
}

/** 油价数据来源：省级官方参考价 / 暂无（成品油按省定价，无城市级数据源） */
export type FuelPriceSource = 'province' | 'empty'

/** 附近加油站分页结果：服务端已按「距你」由近到远排好序 */
export interface FuelStationPage {
  items: FuelStation[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  /** 非空时为兜底来源：'city' 表示按所选城市返回（用户坐标附近无站点） */
  fallback?: 'city'
}

/** 站点类型：'fuel' 加油站 / 'ev' 充电站 */
export type StationKind = 'fuel' | 'ev'

export interface FuelStation {
  id: string
  name: string
  brand: string
  distanceKm: number | null
  openingHours: string
  price92: number
  price95: number
  latitude: number
  longitude: number
  address: string
  /** 服务端区分加油站 / 充电站（充电站无成品油价格，字段为空） */
  kind?: StationKind
}

export interface UserProfile {
  avatarUrl: string
  nickname: string
  phone?: string | null
  stats: { mileage: number; favorites: number; checkins: number }
}

export interface FavoriteItem {
  id: string
  type: 'route' | 'spot'
  scene: Scene
  subType?: PlayType | null
  title: string
  subtitle: string
  thumbUrl: string
}

/** 天气图标文件名，取值来自 `static/icons/` 下的同名资源 */
export type WeatherIconName =
  | 'weather-sun.svg'
  | 'weather-cloudy.svg'
  | 'weather-overcast.svg'
  | 'weather-rain.svg'
  | 'weather-snow.svg'
  | 'weather-fog.svg'

export interface Weather {
  cityCode: string
  /** 当前温度，单位为摄氏度 */
  temp: number
  /** 天气描述，如「晴朗 / 多云 / 阴 / 雨 / 雪 / 雾」 */
  desc: string
  /** 风力，如「微风 3 级」 */
  wind: string
  /** 空气质量，如「空气优」 */
  air: string
  /** 出行建议，如「适宜出行」 */
  tip: string
  icon: WeatherIconName
}
