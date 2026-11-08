import { ConflictException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_ADMIN_SCENE_TABS, SceneTabsConfigService, validateSceneTabItems } from './scene-tabs-config.service'
import type { SceneTabItem } from './scene-tabs-config.service'

function validItems(): SceneTabItem[] {
  return [
    { scene: 'drive', label: '粗门溜车', enabled: true, sort: 10 },
    { scene: 'play', label: '粗门玩玩', enabled: true, sort: 20 },
    { scene: 'wash', label: '粗门洗车', enabled: true, sort: 30 },
  ]
}

const storedAt = new Date('2026-11-08T00:00:00.000Z')

function build(record: unknown) {
  const prisma = {
    systemConfig: {
      findUnique: vi.fn().mockResolvedValue(record),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue({}),
    },
  }
  return { prisma, service: new SceneTabsConfigService(prisma as never) }
}

const corruptedRecord = {
  value: {
    revision: 4,
    items: [
      { scene: 'drive', label: '粗门溜车', enabled: true, sort: 10 },
      { scene: 'fish', label: '粗门钓鱼', enabled: false, sort: 20 },
    ],
  },
  updatedAt: storedAt,
}

describe('validateSceneTabItems', () => {
  it('accepts the three business scenes', () => {
    expect(validateSceneTabItems(validItems())).toBeNull()
    expect(DEFAULT_ADMIN_SCENE_TABS.items.map((item) => item.scene)).toEqual(['drive', 'play', 'wash'])
  })

  it.each([
    ['兼容值 fish', [{ scene: 'fish', label: '粗门钓鱼', enabled: true, sort: 10 }]],
    ['重复场景', [...validItems(), { scene: 'drive', label: '重复', enabled: true, sort: 40 }]],
    ['全部禁用', validItems().map((item) => ({ ...item, enabled: false }))],
    ['超过 3 项', [...validItems(), { scene: 'unknown', label: '未知', enabled: true, sort: 40 }]],
    ['空数组', []],
  ])('rejects %s', (_reason, items) => {
    expect(validateSceneTabItems(items)).not.toBeNull()
  })
})

describe('SceneTabsConfigService', () => {
  it('GIVEN 服务端无配置 WHEN 公开读取 THEN 默认 3 项全启用', async () => {
    const { service } = build(null)
    const view = await service.publicView()
    expect(view.items.map((item) => item.scene)).toEqual(['drive', 'play', 'wash'])
    expect(await service.enabledScenes()).toEqual(new Set(['drive', 'play', 'wash']))
  })

  it('GIVEN 残留 fish 的旧配置 WHEN 读取 THEN 回退默认且不 500', async () => {
    const { service } = build(corruptedRecord)
    const view = await service.adminView()
    expect(view.items.map((item) => item.scene)).toEqual(['drive', 'play', 'wash'])
    expect(view.updatedAt).toBeNull()
  })

  it('GIVEN 损坏配置 WHEN 运营用 null token 保存 THEN 允许修复且不返回 409', async () => {
    const { prisma, service } = build(corruptedRecord)
    await expect(service.update(validItems(), null, 'tester')).resolves.toBeDefined()
    expect(prisma.systemConfig.updateMany).toHaveBeenCalledOnce()
    const args = prisma.systemConfig.updateMany.mock.calls[0]![0] as { where: { updatedAt: Date }; data: { value: { items: unknown[] } } }
    expect(args.where.updatedAt).toEqual(storedAt)
    expect(args.data.value.items).toHaveLength(3)
  })

  it('GIVEN 合法配置 WHEN 并发 token 过期 THEN 返回 409', async () => {
    const { service } = build({ value: { revision: 1, items: validItems() }, updatedAt: storedAt })
    await expect(service.update(validItems(), '2026-11-07T00:00:00.000Z')).rejects.toBeInstanceOf(ConflictException)
  })

  it('GIVEN 只启用 2 项 WHEN 公开读取 THEN 隐藏项不下发', async () => {
    const items = validItems().map((item) => ({ ...item, enabled: item.scene !== 'wash' }))
    const { service } = build({ value: { revision: 2, items }, updatedAt: storedAt })
    const view = await service.publicView()
    expect(view.items.map((item) => item.scene)).toEqual(['drive', 'play'])
  })
})
