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
  /** 不填默认入武汉（历史种子均挂武汉） */
  cityCode?: string
}

export const routeRecords: RouteRecord[] = [
  { id: 'bafen-shanlu', scene: 'drive', title: '八分山日落自驾观光线', rank: 9, rankTag: '赛道/跑山热门榜', distanceKm: 7.6, lengthKm: 5, elevationM: 220, difficulty: '入门级', coverImageUrl: '/static/routes/card-route-1.jpg', durationLabel: '约 1.5h', bestTime: '日落前 1h', carType: '轿车/SUV', startPoint: '武汉·八分山北门停车场', endPoint: '八分山观景台（夕阳观景点）', description: '沿山脊蜿蜒而上的轻量跑山路线，日落时分视野开阔，适合第一次尝试山路自驾的朋友。', tags: ['日落', '盘山公路'], latitude: 30.3596, longitude: 114.3045, elevationPoints: [42,65,120,186,220,174,88] },
  { id: 'sanlian-chuan', scene: 'drive', title: '大花山-青龙山-八分山三山连穿自驾线路', rank: 7, rankTag: '赛道/跑山热门榜', distanceKm: 8, lengthKm: 33, elevationM: 61, difficulty: '入门级', coverImageUrl: '/static/routes/card-route-2.jpg', durationLabel: '约 3h', bestTime: '上午 9 点', carType: 'SUV/摩托', startPoint: '大花山驿站', endPoint: '八分山观景台', description: '串联三座城市近郊山体，弯道节奏丰富，是周末半日自驾的经典路线。', tags: ['连穿', '山景'], latitude: 30.345, longitude: 114.319, elevationPoints: [40,58,71,63,82,70,61] },
  { id: 'qinglongshan', scene: 'drive', title: '青龙山森林氧吧自驾线路', rank: 10, rankTag: '赛道/跑山热门榜', distanceKm: 10.3, lengthKm: 18.5, elevationM: 145, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-3.jpg', durationLabel: '约 2h', bestTime: '清晨', carType: '全车型', startPoint: '青龙山森林公园', endPoint: '云雾观景台', description: '林荫覆盖率高、道路舒缓，适合家庭周末短途放松。', tags: ['森林', '轻松'], latitude: 30.301, longitude: 114.331, elevationPoints: [30,44,91,145,121,88,45] },
  { id: 'liangzihu', scene: 'fish', title: '梁子湖翘嘴鲌野钓基地', rank: 3, rankTag: '钓点/野钓热门榜', distanceKm: 6.2, lengthKm: 12, elevationM: 8, shoreKm: 12, depthM: 8, difficulty: '进阶级', coverImageUrl: '/static/fishing/card-fishing-1.jpg', durationLabel: '4-6h', bestTime: '清晨·傍晚', entryPoint: '梁子湖东岸公共入口', mainArea: '芦苇湾深水区', gear: '路亚竿·手竿', description: '水域开阔，翘嘴鲌活性高，东岸多个公共钓位可停车步行到达。请遵守禁钓期规定并带走垃圾。', tags: ['翘嘴鲌', '野钓', '湖库'], latitude: 30.174, longitude: 114.674 },
  { id: 'mulanhu', scene: 'fish', title: '木兰湖库钓综合体', rank: 5, rankTag: '钓点/野钓热门榜', distanceKm: 9.4, lengthKm: 18.5, elevationM: 15, shoreKm: 18.5, depthM: 15, difficulty: '挑战级', coverImageUrl: '/static/fishing/card-fishing-2.jpg', durationLabel: '6-8h', bestTime: '傍晚', entryPoint: '木兰湖西门', mainArea: '北岸深水区', gear: '长竿·矶竿', description: '库区岸线丰富，深浅交替，适合有经验的钓友。', tags: ['库钓', '深水'], latitude: 31.105, longitude: 114.407 },
  { id: 'houguanhu', scene: 'fish', title: '后官湖路亚钓场', rank: 8, rankTag: '钓点/野钓热门榜', distanceKm: 11, lengthKm: 6.5, elevationM: 4, shoreKm: 6.5, depthM: 4, difficulty: '入门级', coverImageUrl: '/static/fishing/card-fishing-3.jpg', durationLabel: '2-4h', bestTime: '清晨', entryPoint: '后官湖绿道入口', mainArea: '桥下缓流区', gear: '轻型路亚竿', description: '交通便利、岸边平缓，适合路亚新手练习。', tags: ['路亚', '新手'], latitude: 30.523, longitude: 114.122 },

  // —— 扩城种子路线：12 城 × 2 条，覆盖溜车场景（加油为实时 POI 无需种子）——
  { id: 'tianjin-jizhou-pan', scene: 'drive', cityCode: '120100', title: '蓟州盘山公路自驾线', rank: 4, rankTag: '赛道/跑山热门榜', distanceKm: 96, lengthKm: 28, elevationM: 560, difficulty: '进阶级', coverImageUrl: '/static/routes/card-route-1.jpg', durationLabel: '约 3h', bestTime: '上午', carType: 'SUV/摩托', startPoint: '蓟州城区客运站', endPoint: '盘山风景区上观台', description: '津蓟高速出城即达，连续发卡弯爬升视野渐开，山顶可俯瞰燕山余脉。', tags: ['盘山公路', '观景'], latitude: 40.15, longitude: 117.4, elevationPoints: [30, 120, 260, 400, 520, 560, 430] },
  { id: 'tianjin-haihe', scene: 'drive', cityCode: '120100', title: '海河沿岸夜景兜风线', rank: 6, rankTag: '赛道/跑山热门榜', distanceKm: 9, lengthKm: 12, elevationM: 5, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-2.jpg', durationLabel: '约 1h', bestTime: '日落后', carType: '全车型', startPoint: '津湾广场', endPoint: '天津之眼摩天轮', description: '沿海河点亮的城市夜景路线，桥梁灯光串联，适合晚间低速兜风。', tags: ['夜景', '城市兜风'], latitude: 39.1, longitude: 117.22, elevationPoints: [5, 4, 5, 4, 5, 5, 4] },
  { id: 'xian-fenshuiling', scene: 'drive', cityCode: '610100', title: '秦岭分水岭 G210 穿越线', rank: 2, rankTag: '赛道/跑山热门榜', distanceKm: 48, lengthKm: 65, elevationM: 2100, difficulty: '挑战级', coverImageUrl: '/static/routes/card-route-3.jpg', durationLabel: '约 5h', bestTime: '上午 8 点', carType: 'SUV/摩托', startPoint: '沣峪口', endPoint: '秦岭分水岭垭口', description: '210 国道经典爬升，从平原一路杀到长江黄河分水岭，弯道与海拔都在线。', tags: ['秦岭', '长坡爬升'], latitude: 33.95, longitude: 108.88, elevationPoints: [420, 760, 1100, 1500, 1800, 2020, 2100] },
  { id: 'xian-lishan', scene: 'drive', cityCode: '610100', title: '临潼骊山环山线', rank: 5, rankTag: '赛道/跑山热门榜', distanceKm: 28, lengthKm: 22, elevationM: 900, difficulty: '进阶级', coverImageUrl: '/static/routes/card-route-1.jpg', durationLabel: '约 2.5h', bestTime: '清晨', carType: '轿车/SUV', startPoint: '华清池广场', endPoint: '骊山烽火台', description: '环山公路依骊山而建，可远眺兵马俑方向平原，傍晚回落光线极佳。', tags: ['环山公路', '人文'], latitude: 34.38, longitude: 109.27, elevationPoints: [430, 560, 720, 880, 900, 760, 500] },
  { id: 'zhengzhou-songshan', scene: 'drive', cityCode: '410100', title: '嵩山旅游公路自驾线', rank: 4, rankTag: '赛道/跑山热门榜', distanceKm: 62, lengthKm: 30, elevationM: 780, difficulty: '进阶级', coverImageUrl: '/static/routes/card-route-2.jpg', durationLabel: '约 3h', bestTime: '上午', carType: 'SUV/摩托', startPoint: '登封少林大道', endPoint: '嵩阳书院观景台', description: '穿嵩山峡谷而上的盘山路线，沿途少林寺塔林与太室山交替入眼。', tags: ['盘山公路', '山景'], latitude: 34.49, longitude: 113.05, elevationPoints: [320, 450, 620, 780, 700, 560, 400] },
  { id: 'zhengzhou-huanghe', scene: 'drive', cityCode: '410100', title: '黄河大堤观光兜风线', rank: 7, rankTag: '赛道/跑山热门榜', distanceKm: 20, lengthKm: 26, elevationM: 20, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-3.jpg', durationLabel: '约 2h', bestTime: '傍晚', carType: '全车型', startPoint: '黄河国家湿地公园', endPoint: '桃花峪大桥', description: '沿黄河大堤平直铺开，车少路阔，看大河落日圆的周末散心首选。', tags: ['黄河', '轻松'], latitude: 34.92, longitude: 113.55, elevationPoints: [95, 92, 90, 88, 90, 92, 95] },
  { id: 'hefei-chaohu', scene: 'drive', cityCode: '340100', title: '环巢湖大道东段自驾线', rank: 3, rankTag: '赛道/跑山热门榜', distanceKm: 32, lengthKm: 40, elevationM: 15, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-1.jpg', durationLabel: '约 3h', bestTime: '日落前', carType: '全车型', startPoint: '滨湖湿地森林公园', endPoint: '中庙·姥山岛码头', description: '环湖大道贴湖而行，风大景阔，日落时分湖面泛金是最大看点。', tags: ['环湖', '日落'], latitude: 31.6, longitude: 117.42, elevationPoints: [12, 10, 9, 8, 9, 11, 15] },
  { id: 'hefei-zipengshan', scene: 'drive', cityCode: '340100', title: '紫蓬山森林盘山线', rank: 6, rankTag: '赛道/跑山热门榜', distanceKm: 24, lengthKm: 16, elevationM: 380, difficulty: '入门级', coverImageUrl: '/static/routes/card-route-2.jpg', durationLabel: '约 2h', bestTime: '清晨', carType: '轿车/SUV', startPoint: '紫蓬山北门', endPoint: '西庐寺观景平台', description: '合肥近郊最顺手的短途山路，坡度温和林荫浓密，适合新手练手。', tags: ['森林', '新手'], latitude: 31.72, longitude: 117.13, elevationPoints: [45, 120, 210, 300, 380, 320, 200] },
  { id: 'fuzhou-guling', scene: 'drive', cityCode: '350100', title: '鼓岭盘山避暑公路', rank: 3, rankTag: '赛道/跑山热门榜', distanceKm: 14, lengthKm: 13, elevationM: 780, difficulty: '入门级', coverImageUrl: '/static/routes/card-route-3.jpg', durationLabel: '约 1.5h', bestTime: '上午', carType: '全车型', startPoint: '鳝溪步道口', endPoint: '鼓岭柳杉王公园', description: '城区出发半小时上鼓岭，连续弯道配上老别墅群，夏日避暑标配。', tags: ['盘山公路', '避暑'], latitude: 26.06, longitude: 119.39, elevationPoints: [30, 180, 350, 520, 680, 780, 720] },
  { id: 'fuzhou-pingtan', scene: 'drive', cityCode: '350100', title: '平潭北部环岛兜风线', rank: 5, rankTag: '赛道/跑山热门榜', distanceKm: 82, lengthKm: 45, elevationM: 30, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-1.jpg', durationLabel: '约 4h', bestTime: '日落前 2h', carType: '全车型', startPoint: '平潭海峡公铁大桥', endPoint: '长江澳风车田', description: '海岛环岛路直望蔚蓝，风车田日落是终点奖赏，适合全天慢节奏。', tags: ['海岛', '环岛路'], latitude: 25.5, longitude: 119.79, elevationPoints: [10, 15, 25, 18, 12, 20, 30] },
  { id: 'xiamen-huandao', scene: 'drive', cityCode: '350200', title: '厦门环岛路滨海兜风线', rank: 2, rankTag: '赛道/跑山热门榜', distanceKm: 12, lengthKm: 18, elevationM: 8, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-2.jpg', durationLabel: '约 1.5h', bestTime: '日落前', carType: '全车型', startPoint: '厦大白城沙滩', endPoint: '五缘湾大桥', description: '一边是海一边是城，椰林与沙滩交替，厦门自驾的名片路线。', tags: ['滨海', '城市兜风'], latitude: 24.44, longitude: 118.17, elevationPoints: [6, 8, 5, 7, 6, 8, 8] },
  { id: 'xiamen-junyingcun', scene: 'drive', cityCode: '350200', title: '军营村高山乡村盘山线', rank: 7, rankTag: '赛道/跑山热门榜', distanceKm: 38, lengthKm: 24, elevationM: 1000, difficulty: '挑战级', coverImageUrl: '/static/routes/card-route-3.jpg', durationLabel: '约 3h', bestTime: '上午 9 点', carType: 'SUV/摩托', startPoint: '莲花镇', endPoint: '军营村观景台', description: '厦门屋脊方向的连续爬坡，云雾季如行驶在天空，弯道视野多变。', tags: ['高山', '盘山公路'], latitude: 24.66, longitude: 118.03, elevationPoints: [60, 260, 480, 700, 880, 1000, 940] },
  { id: 'qingdao-laoshan', scene: 'drive', cityCode: '370200', title: '崂山环海自驾线', rank: 2, rankTag: '赛道/跑山热门榜', distanceKm: 26, lengthKm: 30, elevationM: 380, difficulty: '进阶级', coverImageUrl: '/static/routes/card-route-1.jpg', durationLabel: '约 3h', bestTime: '上午', carType: '轿车/SUV', startPoint: '石老人海水浴场', endPoint: '仰口风景区', description: '一半海水一半山，环海公路贴着崂山巨石前行，转角即是开阔海湾。', tags: ['滨海', '山景'], latitude: 36.13, longitude: 120.62, elevationPoints: [10, 60, 180, 320, 380, 260, 90] },
  { id: 'qingdao-xihaian', scene: 'drive', cityCode: '370200', title: '西海岸滨海大道兜风线', rank: 6, rankTag: '赛道/跑山热门榜', distanceKm: 30, lengthKm: 34, elevationM: 25, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-2.jpg', durationLabel: '约 2.5h', bestTime: '日落前', carType: '全车型', startPoint: '金沙滩', endPoint: '城市阳台景区', description: '过胶州湾隧道即入直路海岸线，路况平整开阔，新手友好夜景观赏佳。', tags: ['滨海', '轻松'], latitude: 35.96, longitude: 120.2, elevationPoints: [8, 12, 20, 25, 18, 14, 10] },
  { id: 'kunming-dianchi', scene: 'drive', cityCode: '530100', title: '滇池环湖东路自驾线', rank: 3, rankTag: '赛道/跑山热门榜', distanceKm: 22, lengthKm: 28, elevationM: 1890, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-3.jpg', durationLabel: '约 2.5h', bestTime: '日落前', carType: '全车型', startPoint: '海埂大坝', endPoint: '晋宁南滇池湿地', description: '高原湖泊环湖路，冬季有红嘴鸥伴飞，四季温度都在舒适区。', tags: ['高原湖泊', '观鸟'], latitude: 24.83, longitude: 102.76, elevationPoints: [1888, 1886, 1885, 1887, 1889, 1890, 1888] },
  { id: 'kunming-xishan', scene: 'drive', cityCode: '530100', title: '西山猫猫箐盘山线', rank: 5, rankTag: '赛道/跑山热门榜', distanceKm: 16, lengthKm: 14, elevationM: 450, difficulty: '入门级', coverImageUrl: '/static/routes/card-route-1.jpg', durationLabel: '约 1.5h', bestTime: '清晨', carType: '轿车/SUV', startPoint: '滇池西山脚', endPoint: '猫猫箐村', description: '昆明人自己的跑山路，俯瞰滇池最佳机位，下山顺路吃农家菜。', tags: ['盘山公路', '近郊'], latitude: 24.96, longitude: 102.65, elevationPoints: [1890, 1980, 2100, 2230, 2340, 2310, 2200] },
  { id: 'nanchang-meiling', scene: 'drive', cityCode: '360100', title: '梅岭盘山穿越线', rank: 4, rankTag: '赛道/跑山热门榜', distanceKm: 18, lengthKm: 20, elevationM: 620, difficulty: '进阶级', coverImageUrl: '/static/routes/card-route-2.jpg', durationLabel: '约 2h', bestTime: '清晨', carType: 'SUV/摩托', startPoint: '湾里管理局', endPoint: '梅岭主峰洗药湖', description: '南昌后山的连续弯道线路，洗药湖高海拔小气候凉爽宜人。', tags: ['盘山公路', '连弯'], latitude: 28.79, longitude: 115.73, elevationPoints: [60, 180, 320, 460, 580, 620, 540] },
  { id: 'nanchang-poyang', scene: 'drive', cityCode: '360100', title: '鄱阳湖滨湖候鸟观光线', rank: 8, rankTag: '赛道/跑山热门榜', distanceKm: 55, lengthKm: 48, elevationM: 30, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-3.jpg', durationLabel: '约 4h', bestTime: '冬季白天', carType: '全车型', startPoint: '南矶山湿地', endPoint: '吴城候鸟小镇', description: '沿湖堤道路平直延伸，冬季万羽候鸟齐飞，是摄影师的自驾圣地。', tags: ['湿地', '候鸟'], latitude: 28.98, longitude: 116.25, elevationPoints: [22, 20, 18, 16, 18, 20, 22] },
  { id: 'nanning-damingshan', scene: 'drive', cityCode: '450100', title: '大明山盘山公路穿越线', rank: 2, rankTag: '赛道/跑山热门榜', distanceKm: 52, lengthKm: 32, elevationM: 1200, difficulty: '挑战级', coverImageUrl: '/static/routes/card-route-1.jpg', durationLabel: '约 4h', bestTime: '上午 9 点', carType: 'SUV/摩托', startPoint: '武鸣两江镇', endPoint: '大明山天坪服务区', description: '桂中南第一高峰的云海盘山路，数十道回头弯爬升，冬日偶见雾凇。', tags: ['盘山公路', '云海'], latitude: 23.49, longitude: 108.34, elevationPoints: [120, 320, 560, 820, 1060, 1200, 1160] },
  { id: 'nanning-qinghuan', scene: 'drive', cityCode: '450100', title: '青秀山-邕江沿岸兜风线', rank: 6, rankTag: '赛道/跑山热门榜', distanceKm: 10, lengthKm: 14, elevationM: 12, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-2.jpg', durationLabel: '约 1h', bestTime: '日落前', carType: '全车型', startPoint: '南宁大桥', endPoint: '江北大道葫芦鼎段', description: '绿城江畔的低速兜风路线，邕江晚霞与青秀山塔影一路相伴。', tags: ['沿江', '城市兜风'], latitude: 22.79, longitude: 108.39, elevationPoints: [75, 78, 76, 74, 76, 78, 75] },
  { id: 'liuzhou-huanjiang', scene: 'drive', cityCode: '450200', title: '柳州环江滨水大道夜景线', rank: 3, rankTag: '赛道/跑山热门榜', distanceKm: 8, lengthKm: 16, elevationM: 10, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-3.jpg', durationLabel: '约 1h', bestTime: '日落后', carType: '全车型', startPoint: '壶东大桥', endPoint: '鹧鸪江大桥', description: '百里柳江的精华段，两岸灯光与水面倒影相接，小龙虾收尾完美。', tags: ['夜景', '沿江'], latitude: 24.35, longitude: 109.45, elevationPoints: [85, 86, 84, 85, 86, 85, 84] },
  { id: 'liuzhou-xiangqiao', scene: 'drive', cityCode: '450200', title: '鹿寨香桥岩溶地质自驾线', rank: 5, rankTag: '赛道/跑山热门榜', distanceKm: 42, lengthKm: 30, elevationM: 240, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-1.jpg', durationLabel: '约 3h', bestTime: '上午', carType: '全车型', startPoint: '鹿寨县城', endPoint: '香桥岩溶国家地质公园', description: '喀斯特峰林间的乡野公路，天生桥与溶洞串联，路况好车流少。', tags: ['喀斯特', '地质'], latitude: 24.85, longitude: 109.75, elevationPoints: [110, 140, 180, 220, 240, 200, 150] },
  { id: 'guilin-shilihualang', scene: 'drive', cityCode: '450300', title: '阳朔十里画廊自驾线', rank: 1, rankTag: '赛道/跑山热门榜', distanceKm: 68, lengthKm: 12, elevationM: 160, difficulty: '轻松级', coverImageUrl: '/static/routes/card-route-2.jpg', durationLabel: '约 2h', bestTime: '清晨 8 点', carType: '全车型', startPoint: '阳朔工农桥', endPoint: '月亮山', description: '喀斯特峰林平地铺开，每公里一个取景框，清晨无游客时最美。', tags: ['喀斯特', '风光'], latitude: 24.74, longitude: 110.49, elevationPoints: [140, 148, 155, 160, 152, 145, 140] },
  { id: 'guilin-maoershan', scene: 'drive', cityCode: '450300', title: '猫儿山华南之巅盘山线', rank: 4, rankTag: '赛道/跑山热门榜', distanceKm: 72, lengthKm: 36, elevationM: 2140, difficulty: '挑战级', coverImageUrl: '/static/routes/card-route-3.jpg', durationLabel: '约 5h', bestTime: '上午 8 点', carType: 'SUV/摩托', startPoint: '兴安县城', endPoint: '猫儿山山顶服务区', description: '华南第一峰的连续爬坡，从竹林到铁杉林再到高山草甸，一站一景。', tags: ['高山', '长坡爬升'], latitude: 25.73, longitude: 110.42, elevationPoints: [210, 480, 860, 1260, 1650, 1960, 2140] },
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
