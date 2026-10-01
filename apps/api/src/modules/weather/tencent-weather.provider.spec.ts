import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildSignature } from '../../common/tencent-signature'
import { TencentWeatherProvider } from './tencent-weather.provider'

const realtime = { weather: '小雨', temperature: 17, wind_direction: '东北风', wind_power: '3-4级', wind_power_v2: '3级', humidity: 88 }

function stubFetch(payload: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => payload })
}

describe('TencentWeatherProvider', () => {
  const originalKey = process.env.TENCENT_MAP_KEY
  const originalSecret = process.env.TENCENT_MAP_SECRET

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalKey === undefined) delete process.env.TENCENT_MAP_KEY
    else process.env.TENCENT_MAP_KEY = originalKey
    if (originalSecret === undefined) delete process.env.TENCENT_MAP_SECRET
    else process.env.TENCENT_MAP_SECRET = originalSecret
  })

  it('is disabled without a key and never calls the API', async () => {
    delete process.env.TENCENT_MAP_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(new TencentWeatherProvider().fetch('420100')).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('queries by adcode and prefers the single-valued wind power field', async () => {
    process.env.TENCENT_MAP_KEY = 'TEST-KEY'
    delete process.env.TENCENT_MAP_SECRET
    const fetchMock = stubFetch({ status: 0, message: 'query ok', result: { realtime: [{ adcode: 420100, update_time: '2026-10-01 09:00', infos: realtime }] } })
    vi.stubGlobal('fetch', fetchMock)

    await expect(new TencentWeatherProvider().fetch('420100')).resolves.toEqual({
      weather: '小雨', temperature: 17, windDirection: '东北风', windPower: '3级', humidity: 88, updateTime: '2026-10-01 09:00',
    })

    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('/ws/weather/v1?')
    expect(url).toContain('adcode=420100')
    expect(url).toContain('type=now')
    expect(url).toContain('key=TEST-KEY')
    // 未配置 SK 时不带签名
    expect(url).not.toContain('sig=')
  })

  it('signs the request when the key has SN verification enabled', async () => {
    process.env.TENCENT_MAP_KEY = 'TEST-KEY'
    process.env.TENCENT_MAP_SECRET = 'TEST-SK'
    const fetchMock = stubFetch({ status: 0, message: 'query ok', result: { realtime: [{ update_time: '', infos: realtime }] } })
    vi.stubGlobal('fetch', fetchMock)

    await new TencentWeatherProvider().fetch('420100')

    const url = String(fetchMock.mock.calls[0][0])
    // 签名基于未编码原始值、参数名升序，且路径与实际请求一致
    const expected = buildSignature('/ws/weather/v1', { key: 'TEST-KEY', adcode: '420100', type: 'now' }, 'TEST-SK')
    expect(url).toContain(`sig=${expected}`)
  })

  it('returns null when the service answers with a non-zero status', async () => {
    process.env.TENCENT_MAP_KEY = 'TEST-KEY'
    vi.stubGlobal('fetch', stubFetch({ status: 311, message: 'key格式错误' }))

    await expect(new TencentWeatherProvider().fetch('420100')).resolves.toBeNull()
  })

  it('returns null when the payload shape is unexpected', async () => {
    process.env.TENCENT_MAP_KEY = 'TEST-KEY'
    vi.stubGlobal('fetch', stubFetch({ status: 0, result: { realtime: [] } }))

    await expect(new TencentWeatherProvider().fetch('420100')).resolves.toBeNull()
  })

  it('returns null on network or timeout failures', async () => {
    process.env.TENCENT_MAP_KEY = 'TEST-KEY'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))

    await expect(new TencentWeatherProvider().fetch('420100')).resolves.toBeNull()
  })
})
