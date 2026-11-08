import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ sceneTabs: vi.fn() }))
vi.mock('@/api/outdoor', () => ({ outdoorApi: api }))

import { FALLBACK_SCENE_TABS, useSceneTabs } from './useSceneTabs'

const serverDefaults = {
  revision: 1,
  updatedAt: '2026-11-08T00:00:00.000Z',
  items: [
    { scene: 'drive', label: '粗门溜车', sort: 10 },
    { scene: 'play', label: '粗门玩玩', sort: 20 },
    { scene: 'wash', label: '粗门洗车', sort: 30 },
  ],
}

describe('useSceneTabs 两层默认', () => {
  beforeEach(() => {
    api.sceneTabs.mockReset()
  })

  it('GIVEN 服务端默认 3 项 WHEN 读取配置 THEN 3 项全启用且按 sort 稳定排序', async () => {
    api.sceneTabs.mockResolvedValue(serverDefaults)
    const state = useSceneTabs()
    const config = await state.refresh()

    expect(config.items.map((item) => item.scene)).toEqual(['drive', 'play', 'wash'])
    expect(state.enabledScenes.value).toEqual(['drive', 'play', 'wash'])
    expect(state.revision.value).toBe(1)
  })

  it('GIVEN 配置接口 404/5xx WHEN 刷新 THEN 降级到仅 drive，不保留上次成功配置', async () => {
    api.sceneTabs.mockResolvedValueOnce(serverDefaults)
    await useSceneTabs().refresh()
    expect(useSceneTabs().enabledScenes.value).toEqual(['drive', 'play', 'wash'])

    api.sceneTabs.mockRejectedValueOnce(new Error('offline'))
    const config = await useSceneTabs().refresh()

    expect(config).toEqual(FALLBACK_SCENE_TABS)
    expect(config.items.map((item) => item.scene)).toEqual(['drive'])
  })

  it('GIVEN 残留 fish 的旧配置 WHEN 读取 THEN 视为损坏并回退仅 drive', async () => {
    api.sceneTabs.mockResolvedValue({
      revision: 2,
      updatedAt: null,
      items: [
        { scene: 'drive', label: '粗门溜车', sort: 10 },
        { scene: 'fish', label: '粗门钓鱼', sort: 20 },
      ],
    })

    const config = await useSceneTabs().refresh()
    expect(config).toEqual(FALLBACK_SCENE_TABS)
  })

  it.each([
    ['未知场景', { scene: 'unknown', label: '未知', sort: 10 }],
    ['空名称', { scene: 'play', label: '  ', sort: 20 }],
    ['排序越界', { scene: 'play', label: '粗门玩玩', sort: 10000 }],
    ['重复场景', { scene: 'drive', label: '重复', sort: 30 }],
  ])('GIVEN 配置损坏（%s）WHEN 读取 THEN 回退仅 drive', async (_reason, broken) => {
    api.sceneTabs.mockResolvedValue({ revision: 3, updatedAt: null, items: [serverDefaults.items[0], broken] })

    const config = await useSceneTabs().refresh()
    expect(config.items.map((item) => item.scene)).toEqual(['drive'])
  })

  it('GIVEN 配置为空数组 WHEN 读取 THEN 回退仅 drive', async () => {
    api.sceneTabs.mockResolvedValue({ revision: 0, updatedAt: null, items: [] })
    const config = await useSceneTabs().refresh()
    expect(config).toEqual(FALLBACK_SCENE_TABS)
  })
})
