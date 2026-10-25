import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AmapStationProvider } from './amap-station.provider'

function poi(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    name: '中国石化加油站',
    location: '114.30,30.40',
    address: '地址',
    type: '汽车服务;加油站;中石化',
    pname: '湖北省',
    ...overrides,
  }
}

function amapPayload(pois: unknown[]) {
  return { status: '1', info: 'OK', count: pois.length, pois }
}

describe('AmapStationProvider', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    process.env.AMAP_MAP_KEY = 'test-key'
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.AMAP_MAP_KEY
  })

  it('加油站模式保留加油站、排除含「充电」的 POI', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => amapPayload([
      poi({ name: 'xx充电桩', id: 'c1' }),
      poi({ name: '中石油加油站', id: 'g2' }),
    ]) })
    const result = await new AmapStationProvider().fetchPage({ latitude: 30.4, longitude: 114.3 }, { cityCode: '420100', kind: 'fuel' })

    expect(result).not.toBeNull()
    expect(result!.count).toBe(1)
    expect(result!.items[0].id).toBe('am-g2')
  })

  it('充电站模式保留充电站、排除含「加油」的 POI，品牌记为「充电站」', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => amapPayload([
      poi({ name: '特来电充电站', id: 'e3' }),
      poi({ name: '中石化加油站', id: 'g4' }),
    ]) })
    const result = await new AmapStationProvider().fetchPage({ latitude: 30.4, longitude: 114.3 }, { cityCode: '420100', kind: 'ev' })

    expect(result).not.toBeNull()
    expect(result!.count).toBe(1)
    expect(result!.items[0].id).toBe('am-e3')
    expect(result!.items[0].brand).toBe('充电站')
    expect(decodeURIComponent(String(fetchMock.mock.calls[0][0]))).toContain('充电站')
  })
})
