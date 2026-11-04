import { describe, expect, it } from 'vitest'
import { buildAmapNavigationUrl } from './mapNavigation'

describe('buildAmapNavigationUrl', () => {
  const target = { latitude: 30.5, longitude: 114.3, name: '黄陂露营地' }

  it('无途经点时只规划到目的地', () => {
    const url = buildAmapNavigationUrl(target)
    expect(url.startsWith('https://uri.amap.com/navigation?')).toBe(true)
    expect(decodeURIComponent(url)).toContain('to=114.3,30.5,黄陂露营地')
    expect(url).not.toContain('waypoints')
  })

  it('途经点按顺序拼进 waypoints', () => {
    const url = buildAmapNavigationUrl(target, {
      waypoints: [
        { latitude: 30.6, longitude: 114.4, name: '出发地' },
        { latitude: 30.55, longitude: 114.35, name: '补给点' },
      ],
    })
    expect(decodeURIComponent(url)).toContain('waypoints=114.4,30.6,出发地;114.35,30.55,补给点')
  })

  it('名称里的逗号分号被剔除，避免打乱「经度,纬度,名称」分段', () => {
    const url = buildAmapNavigationUrl({ ...target, name: '休息区,A区' })
    expect(decodeURIComponent(url)).toContain('to=114.3,30.5,休息区A区')
  })
})
