import type { City, FavoriteItem, FishingSpot, FuelPrice, FuelStation, RouteDetail, UserProfile, Weather } from '@/types/domain'

export const cities: City[] = [
  { code: '420100', name: '武汉' }, { code: '110000', name: '北京' },
  { code: '310000', name: '上海' }, { code: '440100', name: '广州' },
  { code: '440300', name: '深圳' }, { code: '510100', name: '成都' },
  { code: '330100', name: '杭州' }, { code: '320100', name: '南京' },
  { code: '430100', name: '长沙' }, { code: '500000', name: '重庆' },
]

/** 各城市的兜底天气数据，接口不可用时用于保证「今日天气」仍有内容可读 */
export const weather: Weather[] = [
  { cityCode: '420100', temp: 28, desc: '晴朗', wind: '微风 3 级', air: '空气优', tip: '适宜出行', icon: 'weather-sun.svg' },
  { cityCode: '110000', temp: 22, desc: '多云', wind: '西北风 3 级', air: '空气良', tip: '注意添衣', icon: 'weather-cloudy.svg' },
  { cityCode: '310000', temp: 26, desc: '阴', wind: '东风 2 级', air: '空气良', tip: '适宜出行', icon: 'weather-overcast.svg' },
  { cityCode: '440100', temp: 31, desc: '雨', wind: '南风 2 级', air: '空气优', tip: '记得带伞', icon: 'weather-rain.svg' },
  { cityCode: '440300', temp: 30, desc: '多云', wind: '东南风 3 级', air: '空气优', tip: '注意防晒', icon: 'weather-cloudy.svg' },
  { cityCode: '510100', temp: 21, desc: '雾', wind: '静风 1 级', air: '空气良', tip: '减速慢行', icon: 'weather-fog.svg' },
  { cityCode: '330100', temp: 25, desc: '晴朗', wind: '北风 2 级', air: '空气优', tip: '适宜出行', icon: 'weather-sun.svg' },
  { cityCode: '320100', temp: 24, desc: '阴', wind: '东北风 2 级', air: '空气良', tip: '适宜出行', icon: 'weather-overcast.svg' },
  { cityCode: '430100', temp: 27, desc: '多云', wind: '南风 3 级', air: '空气良', tip: '注意防晒', icon: 'weather-cloudy.svg' },
  { cityCode: '500000', temp: 23, desc: '雾', wind: '静风 1 级', air: '空气良', tip: '减速慢行', icon: 'weather-fog.svg' },
]

export const driveRoutes: RouteDetail[] = [
  {
    id: 'bafen-shanlu', scene: 'drive', title: '八分山日落自驾观光线', rank: 9,
    rankTag: '赛道/跑山热门榜', distanceKm: 7.6, lengthKm: 5, elevationM: 220, difficulty: '入门级',
    depthM: null, coverImageUrl: '/static/routes/card-route-1.jpg', durationLabel: '约 1.5h', bestTime: '日落前 1h',
    carType: '轿车/SUV', startPoint: '武汉·八分山北门停车场', endPoint: '八分山观景台（夕阳观景点）',
    description: '沿山脊蜿蜒而上的轻量跑山路线，日落时分视野开阔，适合第一次尝试山路自驾的朋友。',
    tags: ['日落', '盘山公路'], latitude: 30.3596, longitude: 114.3045, elevationPoints: [42, 65, 120, 186, 220, 174, 88],
  },
  {
    id: 'sanlian-chuan', scene: 'drive', title: '大花山-青龙山-八分山三山连穿自驾线路', rank: 7,
    rankTag: '赛道/跑山热门榜', distanceKm: 8, lengthKm: 33, elevationM: 61, difficulty: '入门级',
    depthM: null, coverImageUrl: '/static/routes/card-route-2.jpg', durationLabel: '约 3h', bestTime: '上午 9 点',
    carType: 'SUV/摩托', startPoint: '大花山驿站', endPoint: '八分山观景台',
    description: '串联三座城市近郊山体，弯道节奏丰富，是周末半日自驾的经典路线。',
    tags: ['连穿', '山景'], latitude: 30.345, longitude: 114.319, elevationPoints: [40, 58, 71, 63, 82, 70, 61],
  },
  {
    id: 'qinglongshan', scene: 'drive', title: '青龙山森林氧吧自驾线路', rank: 10,
    rankTag: '赛道/跑山热门榜', distanceKm: 10.3, lengthKm: 18.5, elevationM: 145, difficulty: '轻松级',
    depthM: null, coverImageUrl: '/static/routes/card-route-3.jpg', durationLabel: '约 2h', bestTime: '清晨',
    carType: '全车型', startPoint: '青龙山森林公园', endPoint: '云雾观景台',
    description: '林荫覆盖率高、道路舒缓，适合家庭周末短途放松。',
    tags: ['森林', '轻松'], latitude: 30.301, longitude: 114.331, elevationPoints: [30, 44, 91, 145, 121, 88, 45],
  },
]

export const fishingSpots: FishingSpot[] = [
  {
    id: 'liangzihu', scene: 'fish', title: '梁子湖翘嘴鲌野钓基地', rank: 3, rankTag: '钓点/野钓热门榜',
    distanceKm: 6.2, lengthKm: 12, elevationM: 8, shoreKm: 12, depthM: 8, difficulty: '进阶级',
    coverImageUrl: '/static/fishing/card-fishing-1.jpg', entryPoint: '梁子湖东岸公共入口', mainArea: '芦苇湾深水区',
    gear: '路亚竿·手竿', durationLabel: '4-6h', bestTime: '清晨·傍晚',
    description: '水域开阔，翘嘴鲌活性高，东岸多个公共钓位可停车步行到达。请遵守禁钓期规定并带走垃圾。',
    tags: ['翘嘴鲌', '野钓', '湖库'], latitude: 30.174, longitude: 114.674,
  },
  {
    id: 'mulanhu', scene: 'fish', title: '木兰湖库钓综合体', rank: 5, rankTag: '钓点/野钓热门榜',
    distanceKm: 9.4, lengthKm: 18.5, elevationM: 15, shoreKm: 18.5, depthM: 15, difficulty: '挑战级',
    coverImageUrl: '/static/fishing/card-fishing-2.jpg', entryPoint: '木兰湖西门', mainArea: '北岸深水区',
    gear: '长竿·矶竿', durationLabel: '6-8h', bestTime: '傍晚', description: '库区岸线丰富，深浅交替，适合有经验的钓友。',
    tags: ['库钓', '深水'], latitude: 31.105, longitude: 114.407,
  },
  {
    id: 'houguanhu', scene: 'fish', title: '后官湖路亚钓场', rank: 8, rankTag: '钓点/野钓热门榜',
    distanceKm: 11, lengthKm: 6.5, elevationM: 4, shoreKm: 6.5, depthM: 4, difficulty: '入门级',
    coverImageUrl: '/static/fishing/card-fishing-3.jpg', entryPoint: '后官湖绿道入口', mainArea: '桥下缓流区',
    gear: '轻型路亚竿', durationLabel: '2-4h', bestTime: '清晨', description: '交通便利、岸边平缓，适合路亚新手练习。',
    tags: ['路亚', '新手'], latitude: 30.523, longitude: 114.122,
  },
]

export const fuelPrices: FuelPrice[] = [
  { grade: '92# 汽油', price: 7.85, change: 0.12 }, { grade: '95# 汽油', price: 8.42, change: -0.08 },
  { grade: '98# 汽油', price: 9.61, change: 0 }, { grade: '0# 柴油', price: 7.58, change: 0.05 },
]

export const fuelStations: FuelStation[] = [
  { id: 'station-1', name: '中石化光谷大道加油站', brand: '中石化', distanceKm: 1.2, openingHours: '24h 营业', price92: 7.82, price95: 8.39, latitude: 30.47, longitude: 114.41, address: '光谷大道 88 号' },
  { id: 'station-2', name: '中石油珞喻路加油气站', brand: '中石油', distanceKm: 2.6, openingHours: '24h 营业', price92: 7.85, price95: 8.42, latitude: 30.51, longitude: 114.39, address: '珞喻路 610 号' },
  { id: 'station-3', name: '壳牌武汉关山大道站', brand: 'Shell', distanceKm: 3.4, openingHours: '06:00-23:00', price92: 7.79, price95: 8.35, latitude: 30.48, longitude: 114.42, address: '关山大道 120 号' },
  { id: 'station-4', name: '道达尔高新二路站', brand: '道达尔', distanceKm: 4.8, openingHours: '24h 营业', price92: 7.81, price95: 8.38, latitude: 30.45, longitude: 114.44, address: '高新二路 39 号' },
]

export const mockUser: UserProfile = { avatarUrl: '/static/icons/avatar-mine.png', nickname: '溜车老登', stats: { mileage: 1280, favorites: 6, checkins: 23 } }

export const favoriteItems: FavoriteItem[] = [
  { id: 'bafen-shanlu', type: 'route', scene: 'drive', title: driveRoutes[0].title, subtitle: '5.0km · 落差 220m · 入门级', thumbUrl: driveRoutes[0].coverImageUrl },
  { id: 'qinglongshan', type: 'route', scene: 'drive', title: driveRoutes[2].title, subtitle: '18.5km · 落差 145m · 轻松级', thumbUrl: driveRoutes[2].coverImageUrl },
  { id: 'liangzihu', type: 'spot', scene: 'fish', title: fishingSpots[0].title, subtitle: '翘嘴鲌 · 清晨与傍晚', thumbUrl: fishingSpots[0].coverImageUrl },
]
