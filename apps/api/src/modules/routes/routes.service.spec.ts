import { describe, expect, it } from 'vitest'
import type { SceneFilter } from '../../common/scenes'
import type { DiscoveryRepository, DiscoveryScene, PublicDiscoveryRecord } from './discovery.repository'
import { RoutesService } from './routes.service'

const base: PublicDiscoveryRecord = {
  id: 'bafen-shanlu',
  scene: 'drive',
  subType: null,
  title: '八分山日落自驾观光线',
  rank: 9,
  rankTag: '赛道/跑山热门榜',
  distanceKm: 7.6,
  lengthKm: 5,
  elevationM: 220,
  depthM: null,
  difficulty: '入门级',
  coverImageUrl: '/route.jpg',
  durationLabel: '约 1.5h',
  bestTime: '日落前 1h',
  carType: '轿车/SUV',
  startPoint: '八分山北门',
  endPoint: '八分山观景台',
  priceLabel: null,
  entryPoint: null,
  mainArea: null,
  gear: null,
  shoreKm: null,
  description: '测试路线',
  tags: ['日落', 1],
  latitude: 30.3596,
  longitude: 114.3045,
  elevationPoints: [42, 'invalid', 220],
}

const driveRecord = { ...base }
const washRecord: PublicDiscoveryRecord = { ...base, id: 'xiche-dian', scene: 'wash', title: '周末洗车点', elevationM: 0 }
const fishRecord: PublicDiscoveryRecord = {
  ...base,
  id: 'liangzihu',
  scene: 'fish',
  title: '梁子湖翘嘴鲌野钓基地',
  elevationM: 8,
  depthM: 8,
  shoreKm: 12,
  entryPoint: '梁子湖东岸公共入口',
  mainArea: '芦苇湾深水区',
  gear: '路亚竿',
}
const playFishingRecord: PublicDiscoveryRecord = {
  ...fishRecord,
  id: 'mulanhu',
  scene: 'play',
  subType: 'fishing',
  title: '木兰湖库钓综合体',
}
const playCampingRecord: PublicDiscoveryRecord = {
  ...base,
  id: 'camping-1',
  scene: 'play',
  subType: 'camping',
  title: '青龙山露营地',
}

const records = [driveRecord, washRecord, fishRecord, playFishingRecord, playCampingRecord]

function resolve(input: SceneFilter | DiscoveryScene | DiscoveryScene[]): SceneFilter {
  if (typeof input === 'string') {
    return input === 'fish'
      ? { scenes: ['play'], subType: 'fishing', legacy: true }
      : { scenes: [input], subType: null, legacy: false }
  }
  if (Array.isArray(input)) {
    return {
      scenes: input.filter((scene): scene is 'drive' | 'play' | 'wash' => scene !== 'fish'),
      subType: null,
      legacy: input.includes('fish'),
    }
  }
  return input
}

function matches(item: PublicDiscoveryRecord, filter: SceneFilter): boolean {
  if (filter.legacy) return item.scene === 'fish' || (item.scene === 'play' && item.subType === 'fishing')
  if (!(filter.scenes as readonly string[]).includes(item.scene)) return false
  return !filter.subType || item.subType === filter.subType
}

const repository: DiscoveryRepository = {
  listCities: async () => [{ code: '420100', name: '武汉' }],
  list: async (filter, limit) => records.filter((item) => matches(item, resolve(filter))).slice(0, limit),
  find: async (id, filter) => records.find((item) => item.id === id && matches(item, resolve(filter))) ?? null,
}

const allScenesEnabled = { enabledScenes: async () => new Set(['drive', 'play', 'wash']) } as never

describe('RoutesService（CHG-SCENE-EXPANSION-001）', () => {
  const service = new RoutesService(repository, allScenesEnabled)

  it('returns enabled cities and scene-specific public cards', async () => {
    expect(await service.listCities()).toEqual([{ code: '420100', name: '武汉' }])
    expect(await service.list('drive', 10, '420100')).toEqual([
      expect.objectContaining({ id: 'bafen-shanlu', scene: 'drive', subType: null, elevationM: 220, depthM: null }),
    ])
    expect(await service.list('wash')).toEqual([
      expect.objectContaining({ id: 'xiche-dian', scene: 'wash' }),
    ])
  })

  it('GIVEN play+fishing WHEN 按子类型筛选 THEN 只返回该子类型', async () => {
    const cards = await service.list('play', 10, undefined, 'fishing')
    expect(cards).toEqual([expect.objectContaining({ id: 'mulanhu', subType: 'fishing' })])
  })

  it('GIVEN 兼容期 WHEN 旧包请求 scene=fish THEN 兼收未回填 fish 与已回填 play/fishing', async () => {
    const cards = await service.list('fish')
    expect(cards.map((card) => card.id).sort()).toEqual(['liangzihu', 'mulanhu'])
  })

  it('GIVEN 非法组合 WHEN 请求列表 THEN 返回 SCENE_SUBTYPE_INVALID 且不查询 Repository', async () => {
    await expect(service.list('wash', 10, undefined, 'fishing')).rejects.toMatchObject({
      response: { code: 'SCENE_SUBTYPE_INVALID' },
    })
    await expect(service.list('play', 10, undefined, 'unknown' as never)).rejects.toMatchObject({
      response: { code: 'SCENE_SUBTYPE_INVALID' },
    })
  })

  it('GIVEN 场景被运营隐藏 WHEN 直接请求列表 THEN 服务端返回空数组且详情仍可打开', async () => {
    const hidden = new RoutesService(repository, { enabledScenes: async () => new Set(['drive']) } as never)
    expect(await hidden.list('fish', 10, '420100')).toEqual([])
    expect(await hidden.list('play', 10)).toEqual([])
    expect(await hidden.spot('liangzihu')).toEqual(expect.objectContaining({ id: 'liangzihu', scene: 'fish' }))
  })

  it('详情端点按集合放行，不做显隐判断', async () => {
    expect(await service.route('bafen-shanlu')).toEqual(
      expect.objectContaining({ tags: ['日落'], elevationPoints: [42, 220], shoreKm: null }),
    )
    expect(await service.route('mulanhu')).toEqual(expect.objectContaining({ id: 'mulanhu', subType: 'fishing' }))
    expect(await service.route('xiche-dian')).toEqual(expect.objectContaining({ id: 'xiche-dian' }))
    expect(await service.spot('liangzihu')).toEqual(
      expect.objectContaining({ depthM: 8, shoreKm: 12, elevationPoints: [] }),
    )
    expect(await service.spot('mulanhu')).toEqual(
      expect.objectContaining({ depthM: 8, shoreKm: 12, elevationPoints: [] }),
    )
  })

  it('uses a stable public error when content is absent or belongs to another scene', async () => {
    await expect(service.route('liangzihu')).rejects.toMatchObject({
      response: { code: 'DISCOVERY_NOT_FOUND', message: '内容不存在或已下线' },
    })
  })
})
