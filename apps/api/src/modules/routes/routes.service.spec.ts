import { describe, expect, it } from 'vitest'
import type { DiscoveryRepository, PublicDiscoveryRecord } from './discovery.repository'
import { RoutesService } from './routes.service'

const driveRecord: PublicDiscoveryRecord = {
  id: 'bafen-shanlu',
  scene: 'drive',
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

const fishRecord: PublicDiscoveryRecord = {
  ...driveRecord,
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

const records = [driveRecord, fishRecord]
const repository: DiscoveryRepository = {
  listCities: async () => [{ code: '420100', name: '武汉' }],
  list: async (scene, limit, cityCode) =>
    cityCode === '000000' ? [] : records.filter((item) => item.scene === scene).slice(0, limit),
  find: async (id, scene) => records.find((item) => item.id === id && item.scene === scene) ?? null,
}

describe('RoutesService', () => {
  const service = new RoutesService(repository)

  it('returns enabled cities and scene-specific public cards', async () => {
    expect(await service.listCities()).toEqual([{ code: '420100', name: '武汉' }])
    expect(await service.list('drive', 10, '420100')).toEqual([
      expect.objectContaining({ id: 'bafen-shanlu', scene: 'drive', elevationM: 220, depthM: null }),
    ])
    expect(await service.list('fish')).toEqual([
      expect.objectContaining({ id: 'liangzihu', scene: 'fish', elevationM: null, depthM: 8 }),
    ])
  })

  it('returns sanitized scene-specific details', async () => {
    expect(await service.route('bafen-shanlu')).toEqual(
      expect.objectContaining({ tags: ['日落'], elevationPoints: [42, 220], shoreKm: null }),
    )
    expect(await service.spot('liangzihu')).toEqual(
      expect.objectContaining({ depthM: 8, shoreKm: 12, elevationPoints: [] }),
    )
  })

  it('uses a stable public error when content is absent or belongs to another scene', async () => {
    await expect(service.route('liangzihu')).rejects.toMatchObject({
      response: { code: 'DISCOVERY_NOT_FOUND', message: '内容不存在或已下线' },
    })
  })
})
