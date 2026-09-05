import { describe, expect, it, vi } from 'vitest'
import { PrismaDiscoveryRepository } from './prisma-discovery.repository'

describe('PrismaDiscoveryRepository', () => {
  it('filters public discoveries and applies deterministic Top N ordering', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const repository = new PrismaDiscoveryRepository({ discovery: { findMany } } as never)

    await repository.list('fish', 10, '420100')

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { scene: 'fish', status: 'online', city: { enabled: true }, cityCode: '420100' },
      orderBy: [{ rank: 'asc' }, { distanceKm: 'asc' }, { id: 'asc' }],
      take: 10,
    }))
  })

  it('never exposes offline details or content under disabled cities', async () => {
    const findFirst = vi.fn().mockResolvedValue(null)
    const repository = new PrismaDiscoveryRepository({ discovery: { findFirst } } as never)

    await repository.find('bafen-shanlu', 'drive')

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'bafen-shanlu', scene: 'drive', status: 'online', city: { enabled: true } },
    }))
  })
})
