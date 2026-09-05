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
