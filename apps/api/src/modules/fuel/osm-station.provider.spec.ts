import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OsmStationProvider } from './osm-station.provider'

const CENTER = { latitude: 24.3255, longitude: 109.4155 }

function overpassPayload(elements: unknown[]) {
  return { elements }
}

describe('OsmStationProvider', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let fetchCalls: { url: string; body: string }[]

  beforeEach(() => {
    fetchCalls = []
    fetchMock = vi.fn(async (url: string, init?: { body?: string }) => {
      fetchCalls.push({ url, body: init?.body ?? '' })
      return { ok: true, json: async () => overpassPayload([
        { type: 'node', id: 11, lat: 24.33, lon: 109.42, tags: { name: '中国石化柳州站', amenity: 'fuel' } },
        // 无名称的节点应被跳过
        { type: 'node', id: 12, lat: 24.30, lon: 109.40, tags: { amenity: 'fuel' } },
      ]) }
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('queries Overpass with a fuel bbox and converts WGS-84 to GCJ-02', async () => {
    const result = await new OsmStationProvider().fetchPage(CENTER)

    // 命中第一个镜像，且是 POST 表单
    expect(fetchCalls[0].url).toContain('overpass-api.de')
    expect(fetchCalls[0].body).toContain('data=')
    expect(fetchCalls[0].body).toContain('amenity')
    expect(fetchCalls[0].body).toContain('fuel')
    expect(result).not.toBeNull()
    expect(result?.items).toHaveLength(1)

    const station = result!.items[0]
    expect(station.id).toBe('osm-11')
    expect(station.name).toBe('中国石化柳州站')
    expect(station.brand).toBe('中石化')
    // WGS-84 已转换为库内统一的 GCJ-02（该区域偏移方向不定，只断言确实发生了偏移）
    expect(station.latitude).not.toBe(24.33)
    expect(station.longitude).not.toBe(109.42)
  })

  it('falls back to the next mirror when the first fails', async () => {
    let first = true
    fetchMock.mockImplementation(async (url: string, init?: { body?: string }) => {
      fetchCalls.push({ url, body: init?.body ?? '' })
      if (first) { first = false; throw new Error('connect ETIMEDOUT') }
      return { ok: true, json: async () => overpassPayload([
        { type: 'node', id: 21, lat: 24.33, lon: 109.42, tags: { name: '中石油站', amenity: 'fuel' } },
      ]) }
    })

    const result = await new OsmStationProvider().fetchPage(CENTER)

    expect(fetchCalls).toHaveLength(2)
    expect(fetchCalls[1].url).toContain('kumi.systems')
    expect(result?.items[0].id).toBe('osm-21')
  })

  it('returns null when every mirror fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    const result = await new OsmStationProvider().fetchPage(CENTER)
    expect(result).toBeNull()
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1)
  })

  it('sampleCenters returns a single center', () => {
    const centers = new OsmStationProvider().sampleCenters(CENTER)
    expect(centers).toEqual([CENTER])
  })
})
