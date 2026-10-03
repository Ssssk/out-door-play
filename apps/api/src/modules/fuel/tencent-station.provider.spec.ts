import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSignature, deriveBrand, parseStations, TencentStationProvider } from './tencent-station.provider'

/** 按官方规则「手写」一遍签名串，用于独立核对实现的排序与拼接是否一致 */
function expectedSignature(params: Record<string, string>, secretKey: string): string {
  const pairs = Object.entries(params)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([name, value]) => `${name}=${value}`)
  return createHash('md5')
    .update(`/ws/place/v1/search?${pairs.join('&')}${secretKey}`, 'utf8')
    .digest('hex')
}

function poi(overrides: Record<string, unknown> = {}) {
  return {
    id: '123',
    title: '中国石化光谷大道加油站',
    address: '光谷大道 88 号',
    category: '汽车:加油站:中石化',
    location: { lat: 30.47, lng: 114.41 },
    ad_info: { province: '湖北省', city: '武汉市' },
    ...overrides,
  }
}

function payload(count: number, data: unknown[]) {
  return { status: 0, message: 'query ok', count, data }
}

const POINT = { latitude: 30.47, longitude: 114.41 }

describe('buildSignature', () => {
  beforeEach(() => {
    // 先确认 digest 接线正确（md5('abc') 是有名的固定值）
    expect(createHash('md5').update('abc').digest('hex')).toBe('900150983cd24fb0d6963f7d28e17f72')
  })

  it('sorts params by name and appends the SK without a separator', () => {
    const params = { key: 'K', boundary: 'nearby(30.47,114.41,1000)', page_index: '1' }
    expect(buildSignature('/ws/place/v1/search', params, 'SK')).toBe(expectedSignature(params, 'SK'))
  })

  it('does not depend on the insertion order of params', () => {
    const a = buildSignature('/ws/place/v1/search', { key: 'K', keyword: '加油站', page_size: '20' }, 'SK')
    const b = buildSignature('/ws/place/v1/search', { page_size: '20', keyword: '加油站', key: 'K' }, 'SK')
    expect(a).toBe(b)
  })

  it('signs the raw unencoded values while the request sends encoded ones', () => {
    // boundary 里的括号逗号若被编码，签名就对不上——这里锁定必须用原始值参与签名
    const params = { boundary: 'nearby(30.47,114.41,1000)', key: 'K' }
    const signature = buildSignature('/ws/place/v1/search', params, 'SK')

    expect(signature).toBe(expectedSignature(params, 'SK'))
    expect(signature).toMatch(/^[0-9a-f]{32}$/)
  })

  it('differs when the secret key differs', () => {
    const params = { key: 'K' }
    expect(buildSignature('/ws/place/v1/search', params, 'A')).not.toBe(buildSignature('/ws/place/v1/search', params, 'B'))
  })

  it('reproduces the example vector published in the official FAQ', () => {
    // 官方文档的示例（key 末段在文档里被脱敏成 *****，穷举确认为 RVBWM；SK 完整）：
    // md5('/ws/geocoder/v1?key=…&location=…SK') = 90da272bfa19122547298e2b0bcc0e50
    // 这条向量独立验证了拼接顺序、原始值参与签名与 md5 小写输出。
    const params = { key: '5Q5BZ-5EVWJ-SN5F3-K6QBZ-B3FAO-RVBWM', location: '28.7033487,115.8660847' }

    expect(buildSignature('/ws/geocoder/v1', params, 'SWvT26ypwq5Nwb5RvS8cLi6NSoH8HlJX'))
      .toBe('90da272bfa19122547298e2b0bcc0e50')
  })
})

describe('deriveBrand', () => {
  it('prefers the brand in the POI name', () => {
    expect(deriveBrand('中国石油珞喻路加油气站', '汽车:加油站')).toBe('中石油')
    expect(deriveBrand('中国石化光谷大道加油站', '汽车:加油站')).toBe('中石化')
    expect(deriveBrand('Shell 武汉关山大道站', '汽车:加油站')).toBe('Shell')
    expect(deriveBrand('道达尔高新二路加油站', '汽车:加油站')).toBe('道达尔')
  })

  it('falls back to the category segment', () => {
    expect(deriveBrand('某某加油站', '汽车:加油站:加油加气站')).toBe('加油加气站')
  })

  it('never exposes the generic category as a brand', () => {
    expect(deriveBrand('某某加油站', '汽车:加油站')).toBe('加油站')
    expect(deriveBrand('某某加油站', '汽车:加油站:其它加油站')).toBe('加油站')
    expect(deriveBrand('某某加油站', '')).toBe('加油站')
  })
})

describe('parseStations', () => {
  it('maps the POI fields used by the app', () => {
    const result = parseStations(payload(31, [poi()]))

    expect(result.count).toBe(31)
    expect(result.items).toEqual([
      {
        id: 'tx-123',
        name: '中国石化光谷大道加油站',
        address: '光谷大道 88 号',
        brand: '中石化',
        latitude: 30.47,
        longitude: 114.41,
        province: '湖北省',
      },
    ])
  })

  it('skips records without an id, name or coordinates', () => {
    const result = parseStations(payload(3, [
      poi({ id: '' }),
      poi({ title: '' }),
      poi({ location: { lat: 30.47 } }),
      poi({ id: '4', location: null }),
    ]))

    expect(result.items).toEqual([])
  })

  it('drops charging stations that Tencent returns under the fuel-station category', () => {
    // 实测首屏 5 条全是「汽车:加油站:充电站」，必须在解析层剔除
    const result = parseStations(payload(2, [
      poi({ id: 'c1', title: '比亚迪闪充站(武汉关南园一路)', category: '汽车:加油站:充电站' }),
      poi({ id: 'f1' }),
    ]))

    expect(result.items.map((item) => item.id)).toEqual(['tx-f1'])
  })

  it('drops charging piles that Tencent misclassifies as 其它加油站', () => {
    // 实测（2026-09-19）：腾讯把部分充电桩归到 191099「其它加油站」而不是 191014「充电站」，
    // 服务端 category<>191014 与「分类含充电」都拦不住——分类串里没有「充电」二字，
    // 只有名称带「充电桩」。漏掉这条判断，充电桩就会被写进库并出现在「附近加油站」里。
    const result = parseStations(payload(3, [
      poi({ id: 'c1', title: '团结名居桂圆3号充电桩', category: '汽车:加油站:其它加油站' }),
      poi({ id: 'c2', title: '瞰江坊1号充电桩', address: '四美塘路124号', category: '汽车:加油站:其它加油站' }),
      poi({ id: 'f1', title: '中国石化月亮湾加油站', category: '汽车:加油站:中石化' }),
    ]))

    expect(result.items.map((item) => item.id)).toEqual(['tx-f1'])
  })

  it('tolerates an unexpected payload shape', () => {
    expect(parseStations(null)).toEqual({ items: [], count: 0 })
    expect(parseStations({ status: 0 })).toEqual({ items: [], count: 0 })
    expect(parseStations({ status: 0, data: 'nope' })).toEqual({ items: [], count: 0 })
  })

  it('falls back to the parsed length when count is missing', () => {
    expect(parseStations({ status: 0, data: [poi()] }).count).toBe(1)
  })
})

describe('TencentStationProvider.fetchPage', () => {
  const original = { key: process.env.TENCENT_MAP_KEY, secret: process.env.TENCENT_MAP_SECRET }
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    process.env.TENCENT_MAP_KEY = 'TEST-KEY'
    delete process.env.TENCENT_MAP_SECRET
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (original.key === undefined) delete process.env.TENCENT_MAP_KEY
    else process.env.TENCENT_MAP_KEY = original.key
    if (original.secret === undefined) delete process.env.TENCENT_MAP_SECRET
    else process.env.TENCENT_MAP_SECRET = original.secret
  })

  it('short-circuits without a configured key', async () => {
    delete process.env.TENCENT_MAP_KEY
    const provider = new TencentStationProvider()

    await expect(provider.fetchPage(POINT)).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('queries with latitude first, the station filter and page 1 by default', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => payload(1, [poi()]) })
    const provider = new TencentStationProvider()

    const result = await provider.fetchPage(POINT)

    const url = String(fetchMock.mock.calls[0][0])
    const decoded = decodeURIComponent(url)
    // ⚠️ 腾讯的坐标顺序是「纬度在前」，传反了会静默查错区域
    expect(decoded).toContain('boundary=nearby(30.47,114.41,1000)')
    // 不能用 category=191000：腾讯会把充电站等子类一并返回
    expect(decoded).toContain('filter=category<>191014')
    expect(decoded).toContain('keyword=加油站')
    expect(url).toContain('page_size=20')
    expect(decoded).toContain('page_index=1')
    // 未配置 SK 时不带 sig
    expect(url).not.toContain('sig=')
    expect(result?.items).toHaveLength(1)
  })

  it('adds a signature when a secret key is configured', async () => {
    process.env.TENCENT_MAP_SECRET = 'TEST-SECRET'
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => payload(1, [poi()]) })
    const provider = new TencentStationProvider()

    await provider.fetchPage(POINT)

    const url = decodeURIComponent(String(fetchMock.mock.calls[0][0]))
    const sig = /sig=([0-9a-f]{32})/.exec(url)?.[1]
    expect(sig).toBeTruthy()
    // sig 基于「不含 sig 自身」的参数串计算
    const params = Object.fromEntries(new URL(url).searchParams)
    delete params.sig
    expect(sig).toBe(buildSignature('/ws/place/v1/search', params, 'TEST-SECRET'))
  })

  it('forwards the requested page index', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => payload(1, [poi()]) })
    const provider = new TencentStationProvider()

    await provider.fetchPage(POINT, { pageIndex: 3 })

    expect(decodeURIComponent(String(fetchMock.mock.calls[0][0]))).toContain('page_index=3')
  })

  it('slices the raw window before filtering charging POIs', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => payload(3, [
      poi({ id: 'charge', title: '充电桩' }), poi({ id: 'second' }), poi({ id: 'third' }),
    ]) })
    const result = await new TencentStationProvider().fetchPage(POINT, { pageIndex: 1, window: { offset: 1, limit: 1 } })
    expect(result?.items.map(s => s.id)).toEqual(['tx-second'])
    expect(result?.count).toBe(3)
  })

  it('treats a malformed successful response as failure', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 0 }) })
    await expect(new TencentStationProvider().fetchPage(POINT)).resolves.toBeNull()
  })

  it('returns null on a non-zero status', async () => {
    // 111 签名错误、121 额度耗尽都走这条路
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 121, message: '此key每日调用量已达到上限', count: 0, data: [] }) })
    const provider = new TencentStationProvider()

    await expect(provider.fetchPage(POINT)).resolves.toBeNull()
  })

  it('returns null when the request fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    const provider = new TencentStationProvider()

    await expect(provider.fetchPage(POINT)).resolves.toBeNull()
  })
})
