import { describe, expect, it } from 'vitest'
import { buildRoutePayload, createEmptyRouteForm, isDestinationOnlyForm, isFishingForm } from './routeFormPolicy'

/** 露营表单隐藏的字段，一个都不能出现在提交 payload 里 */
const CAMPING_HIDDEN_FIELDS = [
  'difficulty', 'level', 'bestTime', 'durationLabel', 'lengthKm', 'elevationM',
  'carType', 'startPoint', 'shoreKm', 'depthM', 'entryPoint', 'mainArea', 'gear',
] as const

function campingForm() {
  return {
    ...createEmptyRouteForm('play'),
    subType: 'camping' as const,
    title: ' 木兰草原露营区 ',
    cityCode: '420100',
    description: ' 可搭帐篷 ',
    endPoint: ' 木兰草原 A 区 ',
    endLng: 114.123456,
    endLat: 30.654321,
    // 运营看不到这些字段，即使模型里残留旧值也不能被提交
    startPoint: '不应出现的起点', startLng: 1, startLat: 2,
    difficulty: '挑战级', carType: 'SUV', lengthKm: 99,
  }
}

describe('routeFormPolicy（露营字段口径修订 2026-11-12）', () => {
  it('GIVEN 子类型露营 WHEN 构造 payload THEN 只提交终点与终点坐标', () => {
    const payload = buildRoutePayload(campingForm())

    expect(payload).toMatchObject({
      title: '木兰草原露营区',
      scene: 'play',
      subType: 'camping',
      cityCode: '420100',
      description: '可搭帐篷',
      endPoint: '木兰草原 A 区',
      endLongitude: 114.123456,
      endLatitude: 30.654321,
      longitude: 114.123456,
      latitude: 30.654321,
    })
    for (const field of CAMPING_HIDDEN_FIELDS) expect(payload).not.toHaveProperty(field)
  })

  it('GIVEN 露营未填坐标 WHEN 构造 payload THEN 不提交 0 值坐标，避免导航到 (0,0)', () => {
    const payload = buildRoutePayload({ ...campingForm(), endLng: null, endLat: null })

    expect(payload).not.toHaveProperty('longitude')
    expect(payload).not.toHaveProperty('latitude')
    expect(payload).not.toHaveProperty('endLongitude')
    expect(payload).not.toHaveProperty('endLatitude')
  })

  it('GIVEN 场景与子类型 WHEN 判定字段形态 THEN 只有 play+camping 是目的地型', () => {
    expect(isDestinationOnlyForm('play', 'camping')).toBe(true)
    expect(isDestinationOnlyForm('play', 'fishing')).toBe(false)
    expect(isDestinationOnlyForm('play', 'checkin')).toBe(false)
    expect(isDestinationOnlyForm('drive', '')).toBe(false)
    expect(isDestinationOnlyForm('wash', '')).toBe(false)
    expect(isFishingForm('play', 'fishing')).toBe(true)
    expect(isFishingForm('fish', '')).toBe(true)
  })

  it('GIVEN 钓鱼 WHEN 构造 payload THEN 保留钓点专属字段与难度/耗时', () => {
    const form = { ...createEmptyRouteForm('play'), shoreKm: 12, depthM: 8, entryPoint: '梁子湖码头', startLng: 114.5, startLat: 30.5 }
    const payload = buildRoutePayload(form)

    expect(payload).toMatchObject({
      subType: 'fishing', shoreKm: 12, depthM: 8, entryPoint: '梁子湖码头',
      difficulty: '入门级', longitude: 114.5, latitude: 30.5,
    })
    expect(payload).not.toHaveProperty('endPoint')
  })

  it('GIVEN 溜车 WHEN 构造 payload THEN 保留起点/路线/车型等原有字段', () => {
    const form = {
      ...createEmptyRouteForm('drive'),
      title: '八分山日落线', cityCode: '420100',
      startLng: 114.3, startLat: 30.4, endLng: 114.4, endLat: 30.5,
      startPoint: '森林公园停车场', endPoint: '山顶观景台', carType: 'SUV', lengthKm: 18,
    }
    const payload = buildRoutePayload(form)

    expect(payload).toMatchObject({
      scene: 'drive', startPoint: '森林公园停车场', endPoint: '山顶观景台',
      carType: 'SUV', lengthKm: 18, longitude: 114.3, latitude: 30.4,
      endLongitude: 114.4, endLatitude: 30.5, difficulty: '入门级',
    })
    expect(payload.subType).toBeUndefined()
  })
})
