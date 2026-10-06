import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouteLineService } from './route-line.service'

const routeRow = {
  id: 'route-1',
  cityCode: '420100',
  startPoint: '格鲁伯梁园',
  endPoint: '梁子岛生态旅游区',
  endLongitude: null,
  endLatitude: null,
  latitude: 30.3,
  longitude: 114.5,
  routePolyline: null,
  status: 'online' as const,
}

function amapJson(payload: unknown) {
  return { ok: true, json: async () => payload, status: 200 } as unknown as Response
}

function stubFetch(urls: Record<string, unknown>) {
  const spy = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    for (const [fragment, payload] of Object.entries(urls)) {
      if (url.includes(fragment)) return amapJson(payload)
    }
    throw new Error(`unexpected url: ${url}`)
  })
  vi.stubGlobal('fetch', spy)
  return spy
}

beforeEach(() => { vi.stubEnv('AMAP_MAP_KEY', 'test-key') })

function makeService(writes: Array<Record<string, unknown>>) {
  const prisma = {
    discovery: {
      findUnique: vi.fn(async () => routeRow),
      update: vi.fn(async (args: { data: Record<string, unknown> }) => { writes.push(args.data); return routeRow }),
    },
  } as never
  return new RouteLineService(prisma)
}

afterEach(() => vi.unstubAllGlobals())

describe('RouteLineService', () => {
  it('合并各步骤 polyline，并处理 v3 的「-」维度省略与连续重复点', async () => {
    stubFetch({
      '/v3/geocode/geo': { status: '1', geocodes: [{ location: '114.400000,30.300000' }] },
      '/v3/direction/driving': {
        status: '1',
        route: {
          paths: [{
            distance: '20000',
            duration: '3000',
            steps: [
              { polyline: '114.40,30.30;114.41,30.31;114.42,30.32' },
              // 第二步首点经度省略（沿用上一步末点经度 114.42），构成新点 (114.42,30.33)
              { polyline: '-,30.33;114.44,30.34' },
            ],
          }],
        },
      },
    })
    const writes: Array<Record<string, unknown>> = []
    const line = await makeService(writes).getOrPlanLine('route-1')

    expect(line?.points).toEqual([
      { longitude: 114.4, latitude: 30.3 },
      { longitude: 114.41, latitude: 30.31 },
      { longitude: 114.42, latitude: 30.32 },
      { longitude: 114.42, latitude: 30.33 },
      { longitude: 114.44, latitude: 30.34 },
    ])
    expect(line?.distanceKm).toBe(20)
    expect(line?.durationMinutes).toBe(50)
    expect(writes[0]?.routePlannedAt).toBeInstanceOf(Date)
  })

  it('命中缓存时直接返回且不再调用高德', async () => {
    const fetchMock = stubFetch({})
    const service = new RouteLineService({
      discovery: {
        findUnique: vi.fn(async () => ({ ...routeRow, routePolyline: [[114.4, 30.3], [114.41, 30.31]] })),
        update: vi.fn(),
      },
    } as never)
    const line = await service.getOrPlanLine('route-1')
    expect(line?.points).toHaveLength(2)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('规划失败返回 null 而不是抛错', async () => {
    stubFetch({ '/v3/geocode/geo': { status: '1', geocodes: [{ location: '114.4,30.3' }] }, '/v3/direction/driving': { status: '0', infocode: '10021', info: 'CUQPS_HAS_EXCEEDED_THE_LIMIT' } })
    const line = await makeService([]).getOrPlanLine('route-1')
    expect(line).toBeNull()
  })
})
