import { NotFoundException, UnauthorizedException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { UserService } from './user.service'

describe('UserService favorites', () => {
  it('GIVEN 账号在 Guard 后被封禁 WHEN 更新资料 THEN 条件更新拒绝写入', async () => {
    const prisma = { user: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) } }
    await expect(new UserService(prisma as never).update('u1', { nickname: 'new' })).rejects.toBeInstanceOf(UnauthorizedException)
    expect(prisma.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1', status: 'normal' } }))
  })

  it('GIVEN online Discovery WHEN 重复收藏 THEN 依赖复合主键跳过冲突并返回确定状态', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 })
    const transaction = { discovery: { findFirst: vi.fn().mockResolvedValue({ id: 'route-1' }) }, favorite: { createMany } }
    const prisma = { $transaction: vi.fn((callback) => callback(transaction)) }
    await expect(new UserService(prisma as never).addFavorite('u1', 'route-1')).resolves.toEqual({ discoveryId: 'route-1', favorited: true })
    expect(createMany).toHaveBeenCalledWith({ data: [{ userId: 'u1', discoveryId: 'route-1' }], skipDuplicates: true })
  })

  it('GIVEN offline Discovery WHEN 收藏 THEN 404 且不写 Favorite', async () => {
    const createMany = vi.fn()
    const transaction = { discovery: { findFirst: vi.fn().mockResolvedValue(null) }, favorite: { createMany } }
    const prisma = { $transaction: vi.fn((callback) => callback(transaction)) }
    await expect(new UserService(prisma as never).addFavorite('u1', 'offline-1')).rejects.toBeInstanceOf(NotFoundException)
    expect(createMany).not.toHaveBeenCalled()
  })

  it('GIVEN 收藏不存在 WHEN 取消 THEN 仍返回 favorited=false', async () => {
    const prisma = { favorite: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) } }
    await expect(new UserService(prisma as never).removeFavorite('u1', 'route-1')).resolves.toEqual({ discoveryId: 'route-1', favorited: false })
  })
})
