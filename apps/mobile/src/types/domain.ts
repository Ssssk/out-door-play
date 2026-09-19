export type Scene = 'drive' | 'fish'
export type Difficulty = '入门级' | '轻松级' | '普通级' | '进阶级' | '挑战级'

export interface City {
  code: string
  name: string
}

export interface RouteCard {
  id: string
  scene: Scene
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

export interface FuelStation {
  id: string
  name: string
  brand: string
  distanceKm: number
  openingHours: string
  price92: number
  price95: number
  latitude: number
  longitude: number
  address: string
}

export interface UserProfile {
  avatarUrl: string
  nickname: string
  stats: { mileage: number; favorites: number; checkins: number }
}

export interface FavoriteItem {
  id: string
  type: 'route' | 'spot'
  scene: Scene
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
