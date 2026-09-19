export type Scene = 'drive' | 'fish'

export interface RouteRecord {
  id: string
  scene: Scene
  title: string
  rank: number
  rankTag: string
  distanceKm: number
  lengthKm: number
  elevationM: number
  difficulty: string
  coverImageUrl: string
  durationLabel: string
  bestTime: string
  carType?: string
  startPoint?: string
  endPoint?: string
  entryPoint?: string
  mainArea?: string
  gear?: string
  shoreKm?: number
  depthM?: number
  description: string
  tags: string[]
  latitude: number
  longitude: number
  elevationPoints?: number[]
}

export const routeRecords: RouteRecord[] = [
  { id: 'bafen-shanlu', scene: 'drive', title: '八分山日落自驾观光线', rank: 9, rankTag: '赛道/跑山热门榜', distanceKm: 7.6, lengthKm: 5, elevationM: 220, difficulty: '入门级', coverImageUrl: '/static/routes/card-route-1.jpg', durationLabel: '约 1.5h', bestTime: '日落前 1h', carType: '轿车/SUV', startPoint: '武汉·八分山北门停车场', endPoint: '八分山观景台（夕阳观景点）', description: '沿山脊蜿蜒而上的轻量跑山路线，日落时分视野开阔，适合第一次尝试山路自驾的朋友。', tags: ['日落', '盘山公路'], latitude: 30.3596, longitude: 114.3045, elevationPoints: [42,65,120,186,220,174,88] },
  { id: 'sanlian-chuan', scene: 'drive', title: '大花山-青龙山-八分山三山连穿自驾线路', rank: 7, rankTag: '赛道/跑山热门榜', distanceKm: 8, lengthKm: 33, elevationM: 61, difficulty: '入门级', coverImageUrl: '/static/routes/card-route-2.jpg', durationLabel: '约 3h', bestTime: '上午 9 点', carType: 'SUV/摩托', startPoint: '大花山驿站', endPoint: '八分山观景台', description: '串联三座城市近郊山体，弯道节奏丰富，是周末半日自驾的经典路线。', tags: ['连穿', '山景'], latitude: 30.345, longitude: 114.319, elevationPoints: [40,58,71,63,82,70,61] },
  { id: 'qinglongshan', scene: 'drive', title: '青龙山森林氧吧自驾线路', rank: 10, rankTag: '赛道/跑山热门榜', distanceKm: 10.3, lengthKm: 18.5, elevationM: 145, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-3.jpg', durationLabel: '约 2h', bestTime: '清晨', carType: '全车型', startPoint: '青龙山森林公园', endPoint: '云雾观景台', description: '林荫覆盖率高、道路舒缓，适合家庭周末短途放松。', tags: ['森林', '轻松'], latitude: 30.301, longitude: 114.331, elevationPoints: [30,44,91,145,121,88,45] },
  { id: 'liangzihu', scene: 'fish', title: '梁子湖翘嘴鲌野钓基地', rank: 3, rankTag: '钓点/野钓热门榜', distanceKm: 6.2, lengthKm: 12, elevationM: 8, shoreKm: 12, depthM: 8, difficulty: '进阶级', coverImageUrl: '/static/fishing/card-fishing-1.jpg', durationLabel: '4-6h', bestTime: '清晨·傍晚', entryPoint: '梁子湖东岸公共入口', mainArea: '芦苇湾深水区', gear: '路亚竿·手竿', description: '水域开阔，翘嘴鲌活性高，东岸多个公共钓位可停车步行到达。请遵守禁钓期规定并带走垃圾。', tags: ['翘嘴鲌', '野钓', '湖库'], latitude: 30.174, longitude: 114.674 },
  { id: 'mulanhu', scene: 'fish', title: '木兰湖库钓综合体', rank: 5, rankTag: '钓点/野钓热门榜', distanceKm: 9.4, lengthKm: 18.5, elevationM: 15, shoreKm: 18.5, depthM: 15, difficulty: '挑战级', coverImageUrl: '/static/fishing/card-fishing-2.jpg', durationLabel: '6-8h', bestTime: '傍晚', entryPoint: '木兰湖西门', mainArea: '北岸深水区', gear: '长竿·矶竿', description: '库区岸线丰富，深浅交替，适合有经验的钓友。', tags: ['库钓', '深水'], latitude: 31.105, longitude: 114.407 },
  { id: 'houguanhu', scene: 'fish', title: '后官湖路亚钓场', rank: 8, rankTag: '钓点/野钓热门榜', distanceKm: 11, lengthKm: 6.5, elevationM: 4, shoreKm: 6.5, depthM: 4, difficulty: '入门级', coverImageUrl: '/static/fishing/card-fishing-3.jpg', durationLabel: '2-4h', bestTime: '清晨', entryPoint: '后官湖绿道入口', mainArea: '桥下缓流区', gear: '轻型路亚竿', description: '交通便利、岸边平缓，适合路亚新手练习。', tags: ['路亚', '新手'], latitude: 30.523, longitude: 114.122 },
]

export const cityRecords = [
  { code: '420100', name: '武汉' }, { code: '110000', name: '北京' }, { code: '310000', name: '上海' },
  { code: '440100', name: '广州' }, { code: '440300', name: '深圳' }, { code: '510100', name: '成都' },
  { code: '330100', name: '杭州' }, { code: '320100', name: '南京' }, { code: '430100', name: '长沙' }, { code: '500000', name: '重庆' },
]

/**
 * 刻意**不种入**「库内城市油价」。
 *
 * 成品油按省定价且由第三方源自动更新，而库内城市价是写死的静态值，
 * 每过一个调价周期就会变旧——此前武汉长期显示过期油价正是这个原因。
 * 因此城市价改为**纯可选的城市级覆盖手段**：确需单独指定某城市价格时再写入，
 * 平时让所有城市都走省级参考价，保证自动更新。
 */

/**
 * 加油站挂牌价：成品油零售价上限即省级指导价（湖北 92# 8.31 / 95# 8.89），
 * 中石化、中石油按上限执行，外资/民营站常有小幅优惠，故略低于上限。
 */
export const fuelStationRecords = [
  { id: 'station-1', name: '中石化光谷大道加油站', brand: '中石化', distanceKm: 1.2, openingHours: '24h 营业', price92: 8.31, price95: 8.89, latitude: 30.47, longitude: 114.41, address: '光谷大道 88 号' },
  { id: 'station-2', name: '中石油珞喻路加油气站', brand: '中石油', distanceKm: 2.6, openingHours: '24h 营业', price92: 8.31, price95: 8.89, latitude: 30.51, longitude: 114.39, address: '珞喻路 610 号' },
  { id: 'station-3', name: '壳牌武汉关山大道站', brand: 'Shell', distanceKm: 3.4, openingHours: '06:00-23:00', price92: 8.28, price95: 8.86, latitude: 30.48, longitude: 114.42, address: '关山大道 120 号' },
  { id: 'station-4', name: '道达尔高新二路站', brand: '道达尔', distanceKm: 4.8, openingHours: '24h 营业', price92: 8.29, price95: 8.87, latitude: 30.45, longitude: 114.44, address: '高新二路 39 号' },
]
