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
  { code: '120000', name: '天津' }, { code: '610100', name: '西安' }, { code: '410100', name: '郑州' },
  { code: '340100', name: '合肥' }, { code: '350100', name: '福州' }, { code: '350200', name: '厦门' },
  { code: '370200', name: '青岛' }, { code: '530100', name: '昆明' }, { code: '360100', name: '南昌' },
  { code: '450100', name: '南宁' }, { code: '450200', name: '柳州' }, { code: '450300', name: '桂林' },
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
 * 加油站台账（武汉，**演示数据**，用于验证「附近加油站」的按距离排序与分页）。
 * 挂牌价不在此处：正常由 `FuelService.stations()` 按省级指导价（零售价上限）在读取时覆盖，
 * 库内值仅作省级源不可用时的回落，由 `prisma/seed.ts` 统一注入。
 * `distanceKm` 只在拿不到设备定位、无法按真实坐标计算时用作排序依据。
 */
export const fuelStationRecords = [
  { id: 'station-1', name: '中石化光谷大道加油站', brand: '中石化', distanceKm: 1.2, openingHours: '24h 营业', latitude: 30.47, longitude: 114.41, address: '光谷大道 88 号' },
  { id: 'station-2', name: '中石油珞喻路加油气站', brand: '中石油', distanceKm: 2.6, openingHours: '24h 营业', latitude: 30.51, longitude: 114.39, address: '珞喻路 610 号' },
  { id: 'station-3', name: '壳牌武汉关山大道站', brand: 'Shell', distanceKm: 3.4, openingHours: '06:00-23:00', latitude: 30.48, longitude: 114.42, address: '关山大道 120 号' },
  { id: 'station-4', name: '道达尔高新二路站', brand: '道达尔', distanceKm: 4.8, openingHours: '24h 营业', latitude: 30.45, longitude: 114.44, address: '高新二路 39 号' },
  { id: 'station-5', name: '中石化雄楚大道加油站', brand: '中石化', distanceKm: 5.6, openingHours: '24h 营业', latitude: 30.5, longitude: 114.35, address: '雄楚大道 233 号' },
  { id: 'station-6', name: '中石油光谷一路加油站', brand: '中石油', distanceKm: 6.3, openingHours: '07:00-23:00', latitude: 30.46, longitude: 114.46, address: '光谷一路 15 号' },
  { id: 'station-7', name: '中海油关山二路站', brand: '中海油', distanceKm: 7.1, openingHours: '24h 营业', latitude: 30.49, longitude: 114.44, address: '关山二路 66 号' },
  { id: 'station-8', name: '中石化南湖大道加油站', brand: '中石化', distanceKm: 8, openingHours: '24h 营业', latitude: 30.5, longitude: 114.32, address: '南湖大道 501 号' },
  { id: 'station-9', name: '九峰便民加油站', brand: '民营', distanceKm: 8.9, openingHours: '06:30-22:30', latitude: 30.52, longitude: 114.47, address: '九峰街道 12 号' },
  { id: 'station-10', name: '中石油鲁磨路加油站', brand: '中石油', distanceKm: 9.6, openingHours: '24h 营业', latitude: 30.54, longitude: 114.38, address: '鲁磨路 118 号' },
  { id: 'station-11', name: '中石化徐东大街加油站', brand: '中石化', distanceKm: 10.8, openingHours: '24h 营业', latitude: 30.58, longitude: 114.35, address: '徐东大街 99 号' },
  { id: 'station-12', name: '壳牌中北路站', brand: 'Shell', distanceKm: 11.5, openingHours: '06:00-23:00', latitude: 30.56, longitude: 114.34, address: '中北路 168 号' },
  { id: 'station-13', name: '中石油友谊大道加油站', brand: '中石油', distanceKm: 12.3, openingHours: '24h 营业', latitude: 30.6, longitude: 114.33, address: '友谊大道 300 号' },
  { id: 'station-14', name: '中石化武珞路加油站', brand: '中石化', distanceKm: 13.1, openingHours: '24h 营业', latitude: 30.54, longitude: 114.31, address: '武珞路 456 号' },
  { id: 'station-15', name: '中海油白沙洲站', brand: '中海油', distanceKm: 14, openingHours: '24h 营业', latitude: 30.49, longitude: 114.29, address: '白沙洲大道 77 号' },
  { id: 'station-16', name: '中石化丁字桥加油站', brand: '中石化', distanceKm: 14.8, openingHours: '24h 营业', latitude: 30.53, longitude: 114.33, address: '丁字桥路 22 号' },
  { id: 'station-17', name: '南湖恒信加油站', brand: '民营', distanceKm: 15.6, openingHours: '07:00-22:00', latitude: 30.48, longitude: 114.31, address: '南湖路 210 号' },
  { id: 'station-18', name: '中石油四新大道加油站', brand: '中石油', distanceKm: 16.5, openingHours: '24h 营业', latitude: 30.54, longitude: 114.24, address: '四新大道 88 号' },
  { id: 'station-19', name: '中石化龙阳大道加油站', brand: '中石化', distanceKm: 17.3, openingHours: '24h 营业', latitude: 30.56, longitude: 114.21, address: '龙阳大道 500 号' },
  { id: 'station-20', name: '壳牌汉阳大道站', brand: 'Shell', distanceKm: 18.1, openingHours: '06:00-23:00', latitude: 30.55, longitude: 114.22, address: '汉阳大道 320 号' },
  { id: 'station-21', name: '中海油沌口站', brand: '中海油', distanceKm: 19, openingHours: '24h 营业', latitude: 30.5, longitude: 114.17, address: '沌口路 66 号' },
  { id: 'station-22', name: '中石化鹦鹉大道加油站', brand: '中石化', distanceKm: 19.8, openingHours: '24h 营业', latitude: 30.55, longitude: 114.26, address: '鹦鹉大道 130 号' },
  { id: 'station-23', name: '中石化解放大道加油站', brand: '中石化', distanceKm: 20.7, openingHours: '24h 营业', latitude: 30.59, longitude: 114.3, address: '解放大道 1000 号' },
  { id: 'station-24', name: '中石油建设大道加油站', brand: '中石油', distanceKm: 21.5, openingHours: '24h 营业', latitude: 30.61, longitude: 114.28, address: '建设大道 588 号' },
  { id: 'station-25', name: '壳牌香港路站', brand: 'Shell', distanceKm: 22.4, openingHours: '06:00-23:00', latitude: 30.6, longitude: 114.29, address: '香港路 220 号' },
  { id: 'station-26', name: '中石化常青路加油站', brand: '中石化', distanceKm: 23.2, openingHours: '24h 营业', latitude: 30.63, longitude: 114.25, address: '常青路 88 号' },
  { id: 'station-27', name: '中海油姑嫂树站', brand: '中海油', distanceKm: 24.1, openingHours: '24h 营业', latitude: 30.65, longitude: 114.27, address: '姑嫂树路 15 号' },
  { id: 'station-28', name: '中石油发展大道加油站', brand: '中石油', distanceKm: 24.9, openingHours: '24h 营业', latitude: 30.62, longitude: 114.23, address: '发展大道 400 号' },
  { id: 'station-29', name: '后湖兴业加油站', brand: '民营', distanceKm: 25.8, openingHours: '06:30-22:30', latitude: 30.66, longitude: 114.3, address: '后湖大道 199 号' },
  { id: 'station-30', name: '中石化和平大道加油站', brand: '中石化', distanceKm: 26.6, openingHours: '24h 营业', latitude: 30.63, longitude: 114.38, address: '和平大道 800 号' },
  { id: 'station-31', name: '中石油工业四路加油站', brand: '中石油', distanceKm: 27.5, openingHours: '24h 营业', latitude: 30.66, longitude: 114.42, address: '工业四路 33 号' },
  { id: 'station-32', name: '壳牌金银湖站', brand: 'Shell', distanceKm: 28.3, openingHours: '06:00-23:00', latitude: 30.68, longitude: 114.18, address: '金银湖路 77 号' },
  { id: 'station-33', name: '中石化吴家山加油站', brand: '中石化', distanceKm: 29.2, openingHours: '24h 营业', latitude: 30.66, longitude: 114.14, address: '吴家山 107 国道旁' },
  { id: 'station-34', name: '中海油藏龙岛站', brand: '中海油', distanceKm: 30, openingHours: '24h 营业', latitude: 30.42, longitude: 114.32, address: '藏龙岛开发区 12 号' },
  { id: 'station-35', name: '中石油纸坊大街加油站', brand: '中石油', distanceKm: 30.9, openingHours: '24h 营业', latitude: 30.38, longitude: 114.31, address: '纸坊大街 240 号' },
  { id: 'station-36', name: '中石化庙山加油站', brand: '中石化', distanceKm: 31.7, openingHours: '24h 营业', latitude: 30.41, longitude: 114.36, address: '庙山大道 55 号' },
]
