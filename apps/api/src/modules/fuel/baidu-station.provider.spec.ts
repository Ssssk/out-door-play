import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BaiduStationProvider } from './baidu-station.provider'

/** 构造百度 place/v2/search 返回的单条 POI(坐标为 BD-09) */
function poi(overrides: Record<string, unknown> = {}) {
  return {
    uid: 'u1',
    name: '中国石化柳州东站加油站',
    address: '柳州市桂柳路 1 号',
    province: '广西壮族自治区',
    location: { lat: 24.3255, lng: 109.4155 },
    ...overrides,
  }
}

function payload(results: unknown[], status = 0) {
  return { status, message: 'ok', results }
}

describe('BaiduStationProvider', () => {
  const fetchMock = vi.fn()
  const savedEnv = { ...process.env }

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    process.env.BAIDU_MAP_AK = 'test-ak'
    delete process.env.BAIDU_MAP_SK
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env = { ...savedEnv }
  })

  it('解析结果并把 BD-09 坐标转为 GCJ-02', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => payload([poi()]) })
    const provider = new BaiduStationProvider()

    const result = await provider.fetchPage(
      { latitude: 24.33, longitude: 109.42 },
      { cityCode: '450200' },
    )

    expect(result).not.toBeNull()
    expect(result!.count).toBe(1)
    const station = result!.items[0]
    expect(station.id).toBe('bd-u1')
    expect(station.name).toContain('中国石化')
    // BD-09 → GCJ-02 会产生数百米级偏移,不能原样透传
    expect(station.latitude).not.toBe(24.3255)
    expect(Math.abs(station.latitude - 24.3255)).toBeLessThan(0.02)
    expect(Math.abs(station.longitude - 109.4155)).toBeLessThan(0.02)
  })

  it('按分页拉全城结果,直到不足一页为止', async () => {
    const fullPage = payload(Array.from({ length: 20 }, (_, i) => poi({ uid: `u${i}` })))
    const lastPage = payload([poi({ uid: 'tail' })])
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => fullPage })
      .mockResolvedValueOnce({ ok: true, json: async () => lastPage })
    const provider = new BaiduStationProvider()

    const result = await provider.fetchPage(
      { latitude: 24.33, longitude: 109.42 },
      { cityCode: '450200' },
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result!.count).toBe(21)
    expect(result!.items.at(-1)!.id).toBe('bd-tail')
  })

  it('百度返回非 0 状态时整城跳过', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => payload([], 302) })
    const provider = new BaiduStationProvider()

    const result = await provider.fetchPage(
      { latitude: 24.33, longitude: 109.42 },
      { cityCode: '450200' },
    )

    expect(result).toBeNull()
  })

  it('未配置 AK 或城市码未知时不发起请求', async () => {
    const provider = new BaiduStationProvider()

    delete process.env.BAIDU_MAP_AK
    expect(await provider.fetchPage({ latitude: 24, longitude: 109 }, { cityCode: '450200' })).toBeNull()

    process.env.BAIDU_MAP_AK = 'test-ak'
    expect(await provider.fetchPage({ latitude: 24, longitude: 109 }, { cityCode: '999999' })).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('配置 SK 时请求带上 sn 签名参数', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => payload([poi()]) })
    process.env.BAIDU_MAP_SK = 'test-sk'
    const provider = new BaiduStationProvider()

    await provider.fetchPage({ latitude: 24.33, longitude: 109.42 }, { cityCode: '450200' })

    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('sn=')
    expect(url).toContain('region=')
  })

  it('加油站模式只保留加油站，排除充电桩', async () => {
    const results = [
      poi({ name: 'xx充电桩', uid: 'c1' }),
      poi({ name: '中石油加油站', uid: 'g1' }),
    ]
    fetchMock.mockResolvedValue({ ok: true, json: async () => payload(results) })
    const provider = new BaiduStationProvider()

    const result = await provider.fetchPage({ latitude: 24.33, longitude: 109.42 }, { cityCode: '450200', kind: 'fuel' })

    expect(result!.count).toBe(1)
    expect(result!.items[0].id).toBe('bd-g1')
  })

  it('充电站模式只保留充电站，排除加油站并改用「充电站」品牌', async () => {
    const results = [
      poi({ name: '特来电充电站(柳州)', uid: 'ev1' }),
      poi({ name: '中国石化加油站', uid: 'gas1' }),
    ]
    fetchMock.mockResolvedValue({ ok: true, json: async () => payload(results) })
    const provider = new BaiduStationProvider()

    const result = await provider.fetchPage({ latitude: 24.33, longitude: 109.42 }, { cityCode: '450200', kind: 'ev' })

    expect(result!.count).toBe(1)
    expect(result!.items[0].id).toBe('bd-ev1')
    expect(result!.items[0].brand).toBe('充电站')
    const url = String(fetchMock.mock.calls[0][0])
    expect(decodeURIComponent(url)).toContain('充电站')
  })
})
