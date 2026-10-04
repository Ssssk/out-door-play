import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BaiduWeatherProvider } from './baidu-weather.provider'

function payload(result: unknown, status = 0) {
  return { status, message: 'ok', result }
}

describe('BaiduWeatherProvider', () => {
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

  it('解析 result.now 为 WeatherObservation', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => payload({ now: { text: '小雨', temp: 17, wind_dir: '东北风', wind_class: '3级', rh: 88, update_time: '2026-10-01 09:00' } }),
    })
    const provider = new BaiduWeatherProvider()

    const obs = await provider.fetch('420100')

    expect(obs).not.toBeNull()
    expect(obs!.weather).toBe('小雨')
    expect(obs!.temperature).toBe(17)
    expect(obs!.windDirection).toBe('东北风')
    expect(obs!.windPower).toBe('3级')
    expect(obs!.humidity).toBe(88)
    expect(obs!.updateTime).toBe('2026-10-01 09:00')
  })

  it('status≠0 时降级为 null', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => payload({}, 302) })
    expect(await new BaiduWeatherProvider().fetch('420100')).toBeNull()
  })

  it('服务未开通返回 HTML 时(响应体无法 JSON 解析)降级为 null', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError('Unexpected token <') } })
    expect(await new BaiduWeatherProvider().fetch('420100')).toBeNull()
  })

  it('未配置 AK 时不发请求', async () => {
    delete process.env.BAIDU_MAP_AK
    expect(await new BaiduWeatherProvider().fetch('420100')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('配置 SK 时请求带上 sn 签名参数', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => payload({ now: { text: '晴', temp: 25 } }) })
    process.env.BAIDU_MAP_SK = 'test-sk'
    await new BaiduWeatherProvider().fetch('420100')
    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('sn=')
    expect(url).toContain('district_id=420100')
  })
})
