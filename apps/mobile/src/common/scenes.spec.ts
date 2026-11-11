import { describe, expect, it } from 'vitest'
import { BUSINESS_SCENES, PLAY_TYPES, isDestinationOnlyRecord, isFishingRecord } from './scenes'

describe('小程序场景字段口径', () => {
  it('GIVEN play+camping WHEN 判定字段形态 THEN 为目的地型', () => {
    expect(isDestinationOnlyRecord('play', 'camping')).toBe(true)
  })

  it('GIVEN 其它场景/子类型 WHEN 判定字段形态 THEN 不是目的地型', () => {
    expect(isDestinationOnlyRecord('play', 'fishing')).toBe(false)
    expect(isDestinationOnlyRecord('play', 'checkin')).toBe(false)
    expect(isDestinationOnlyRecord('play', null)).toBe(false)
    expect(isDestinationOnlyRecord('drive', null)).toBe(false)
    expect(isDestinationOnlyRecord('wash', null)).toBe(false)
    expect(isDestinationOnlyRecord('fish', null)).toBe(false)
  })

  it('目的地型与钓点型互斥，且白名单与服务端一致', () => {
    expect(BUSINESS_SCENES).toEqual(['drive', 'play', 'wash'])
    expect(PLAY_TYPES).toEqual(['fishing', 'camping', 'checkin'])
    expect(isFishingRecord('play', 'camping')).toBe(false)
    expect(isDestinationOnlyRecord('play', 'fishing')).toBe(false)
  })
})
