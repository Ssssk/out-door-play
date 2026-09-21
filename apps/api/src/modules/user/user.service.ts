import { BadRequestException, Injectable, NotFoundException, PayloadTooLargeException, UnauthorizedException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PrismaService } from '../../database/prisma.service'
import type { UpdateUserDto, UploadedImage } from './user.dto'

const AVATAR_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { favorites: true } } },
    })
    if (!user || user.status !== 'normal') {
      throw new UnauthorizedException({ code: 'AUTH_SESSION_INVALID', message: '登录状态无效或已过期' })
    }
    return {
      avatarUrl: user.avatarUrl,
      nickname: user.nickname,
      stats: { mileage: user.mileage, favorites: user._count.favorites, checkins: user.checkins },
    }
  }

  async update(userId: string, input: UpdateUserDto) {
    const updated = await this.prisma.user.updateMany({ where: { id: userId, status: 'normal' }, data: input })
    if (updated.count !== 1) {
      throw new UnauthorizedException({ code: 'AUTH_SESSION_INVALID', message: '登录状态无效或已过期' })
    }
    return this.me(userId)
  }

  async saveAvatar(userId: string, file: UploadedImage | undefined) {
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new BadRequestException({ code: 'AVATAR_FILE_REQUIRED', message: '请选择头像图片' })
    }
    const extension = AVATAR_MIME_EXTENSIONS[file.mimetype]
    if (!extension) {
      throw new BadRequestException({ code: 'AVATAR_TYPE_UNSUPPORTED', message: '头像仅支持 JPG / PNG / WebP 格式' })
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw new PayloadTooLargeException({ code: 'AVATAR_FILE_TOO_LARGE', message: '头像图片不能超过 5MB' })
    }
    const avatarDir = join(process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'), 'avatars')
    await mkdir(avatarDir, { recursive: true })
    const filename = `${randomUUID()}.${extension}`
    await writeFile(join(avatarDir, filename), file.buffer)
    const avatarUrl = `/v1/uploads/avatars/${filename}`
    const updated = await this.prisma.user.updateMany({ where: { id: userId, status: 'normal' }, data: { avatarUrl } })
    if (updated.count !== 1) {
      throw new UnauthorizedException({ code: 'AUTH_SESSION_INVALID', message: '登录状态无效或已过期' })
    }
    return this.me(userId)
  }

  async favorites(userId: string, scene: 'drive' | 'fish') {
    const records = await this.prisma.favorite.findMany({
      where: { userId, discovery: { scene, status: 'online' } },
      include: { discovery: true },
      orderBy: { createdAt: 'asc' },
    })
    return records.map(({ discovery: item }) => {
      const tags = Array.isArray(item.tags) ? item.tags : []
      return {
        id: item.id, type: item.scene === 'fish' ? 'spot' : 'route', scene: item.scene, title: item.title,
        subtitle: item.scene === 'fish' ? `${String(tags[0] || '')} · ${item.bestTime}` : `${item.lengthKm.toFixed(1)}km · 落差 ${item.elevationM}m · ${item.difficulty}`,
        thumbUrl: item.coverImageUrl,
      }
    })
  }

  async addFavorite(userId: string, discoveryId: string) {
    await this.prisma.$transaction(async (transaction) => {
      const discovery = await transaction.discovery.findFirst({ where: { id: discoveryId, status: 'online' }, select: { id: true } })
      if (!discovery) {
        throw new NotFoundException({ code: 'FAVORITE_DISCOVERY_NOT_FOUND', message: '该内容不存在或暂不可收藏' })
      }
      await transaction.favorite.createMany({
        data: [{ userId, discoveryId }],
        skipDuplicates: true,
      })
    })
    return { discoveryId, favorited: true }
  }

  async removeFavorite(userId: string, discoveryId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, discoveryId } })
    return { discoveryId, favorited: false }
  }
}
