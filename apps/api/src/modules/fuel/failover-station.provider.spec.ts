import { describe, expect, it, vi } from 'vitest'
import type { GeoPoint } from '../../common/geo'
import { FailoverStationProvider } from './failover-station.provider'

const center: GeoPoint = { latitude: 30.3, longitude: 114.5 }

function fakeProvider(name: string, results: Array<{ items: never[] } | null>) {
  let call = 0
  return {
    name,
    sampleCenters: vi.fn(() => [center]),
    fetchPage: vi.fn(async () => results[Math.min(call++, results.length - 1)]),
  }
}

function page(id: string) {
  return { items: [{ id } as never], count: 1 }
}

describe('FailoverStationProvider', () => {
  it('主源正常时直接使用主源且计数清零', async () => {
    const primary = fakeProvider('amap', [page('am-1')])
    const fallback = fakeProvider('tianditu', [])
    const provider = new FailoverStationProvider(primary as never, fallback as never)

    const result = await provider.fetchPage(center, { cityCode: '420100' })

    expect(result?.items[0].id).toBe('am-1')
    expect(fallback.fetchPage).not.toHaveBeenCalled()
    expect(provider.primaryHealthy).toBe(true)
  })

  it('主源连续 2 轮失败后熔断切备源，备源也失败时回头再试主源', async () => {
    const primary = fakeProvider('amap', [null, null, page('am-recovered')])
    const fallback = fakeProvider('tianditu', [page('tdt-1'), null])
    const provider = new FailoverStationProvider(primary as never, fallback as never)

    // 第 1 轮主源失败 → 备源兜底成功（1 次失败未达阈值 2，尚未熔断）
    expect((await provider.fetchPage(center, { cityCode: '420100' }))?.items[0].id).toBe('tdt-1')
    expect(provider.primaryHealthy).toBe(true)

    // 第 2 次主源又失败 → 计数达到阈值进入熔断；备源这轮也失败 → 返回 null
    expect(await provider.fetchPage(center, { cityCode: '420100' })).toBeNull()

    // 再来一次：熔断状态下直接走备源；备源失败 → 回头试主源并成功恢复，计数清零
    expect((await provider.fetchPage(center, { cityCode: '420100' }))?.items[0].id).toBe('am-recovered')
    expect(provider.primaryHealthy).toBe(true)
  })
})
