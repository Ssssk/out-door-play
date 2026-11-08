import { describe, expect, it } from 'vitest'
import {
  BUSINESS_SCENES, DEFAULT_SCENE_TABS, PLAY_TYPES, SCENE_SUBTYPE_INVALID,
  SceneSubTypeInvalidError, isFishingRecord, normalizeScene, writableSceneSubType,
} from './scenes'

describe('业务场景单一事实来源（CHG-SCENE-EXPANSION-001）', () => {
  it('白名单固定为 3 个顶层场景，fish 不在写入白名单内', () => {
    expect(BUSINESS_SCENES).toEqual(['drive', 'play', 'wash'])
    expect(PLAY_TYPES).toEqual(['fishing', 'camping', 'checkin'])
    expect(BUSINESS_SCENES).not.toContain('fish')
  })

  it('服务端默认 3 项全启用，且与本地故障兜底分离', () => {
    expect(DEFAULT_SCENE_TABS.map((item) => item.scene)).toEqual(['drive', 'play', 'wash'])
    expect(DEFAULT_SCENE_TABS.every((item) => item.enabled)).toBe(true)
  })

  it('fish 归一化为 play+fishing，并标记需要兼收历史行', () => {
    expect(normalizeScene('fish')).toEqual({ scenes: ['play'], subType: 'fishing', legacy: true })
    expect(normalizeScene('fish', 'fishing')).toEqual({ scenes: ['play'], subType: 'fishing', legacy: true })
  })

  it('play 子类型可选且必须是合法值；非 play 不允许子类型', () => {
    expect(normalizeScene('play', 'camping')).toEqual({ scenes: ['play'], subType: 'camping', legacy: false })
    expect(normalizeScene('play')).toEqual({ scenes: ['play'], subType: null, legacy: false })
    expect(normalizeScene('drive')).toEqual({ scenes: ['drive'], subType: null, legacy: false })
    expect(() => normalizeScene('wash', 'fishing')).toThrow(SceneSubTypeInvalidError)
    expect(() => normalizeScene('fish', 'camping')).toThrow(SceneSubTypeInvalidError)
  })

  it('写入校验拒绝 fish、非法子类型与缺失子类型', () => {
    expect(writableSceneSubType('play', 'fishing')).toBe('fishing')
    expect(writableSceneSubType('drive')).toBeNull()
    expect(writableSceneSubType('wash', null)).toBeNull()
    expect(() => writableSceneSubType('fish', 'fishing')).toThrow(SceneSubTypeInvalidError)
    expect(() => writableSceneSubType('play')).toThrow(SceneSubTypeInvalidError)
    expect(() => writableSceneSubType('play', 'other')).toThrow(SceneSubTypeInvalidError)
    expect(() => writableSceneSubType('drive', 'camping')).toThrow(SceneSubTypeInvalidError)
    try {
      writableSceneSubType('play')
    } catch (error) {
      expect((error as SceneSubTypeInvalidError).code).toBe(SCENE_SUBTYPE_INVALID)
    }
  })

  it('钓点字段判定按子类型，而非 scene', () => {
    expect(isFishingRecord('fish', null)).toBe(true)
    expect(isFishingRecord('play', 'fishing')).toBe(true)
    expect(isFishingRecord('play', 'camping')).toBe(false)
    expect(isFishingRecord('drive', null)).toBe(false)
    expect(isFishingRecord('wash', null)).toBe(false)
  })
})
