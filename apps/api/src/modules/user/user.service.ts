import { BadRequestException, Injectable, Logger, NotFoundException, PayloadTooLargeException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PrismaService } from '../../database/prisma.service'
import { SceneTabsConfigService } from '../config/scene-tabs-config.service'
import { normalizeScene, isFishingRecord, isDestinationOnlyRecord, SCENE_SUBTYPE_INVALID, SceneSubTypeInvalidError } from '../../common/scenes'
import type { PlayType, SceneQuery } from '../../common/scenes'
import type { Prisma } from '../../generated/prisma/client'
import type { UpdateUserDto, UploadedImage } from './user.dto'

const AVATAR_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly sceneTabs: SceneTabsConfigService,
  ) {}

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
      phone: user.phone,
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

  async favorites(userId: string, scene: SceneQuery, subType?: PlayType | null) {
    let filter
    try {
      filter = normalizeScene(scene, subType ?? null)
    } catch (error) {
      if (error instanceof SceneSubTypeInvalidError) {
        throw new UnprocessableEntityException({ code: SCENE_SUBTYPE_INVALID, message: error.message })
      }
      throw error
    }
    // 归一化后再做显隐判断：兼容映射不得绕过「拒列表、留详情」
    if (!(await this.sceneTabs.enabledScenes()).has(filter.scenes[0]!)) {
      this.logger.log({ event: 'scene_tabs_list_denied', scene, resolvedScene: filter.scenes[0], resource: 'favorites' })
      return []
    }
    const discoveryWhere: Prisma.DiscoveryWhereInput = filter.legacy
      ? { OR: [{ scene: 'fish' }, { scene: 'play', subType: 'fishing' }] }
      : { scene: { in: filter.scenes }, ...(filter.subType ? { subType: filter.subType } : {}) }
    const records = await this.prisma.favorite.findMany({
      where: { userId, discovery: { status: 'online', ...discoveryWhere } },
      include: { discovery: true },
      orderBy: { createdAt: 'asc' },
    })
    return records.map(({ discovery: item }) => {
      const fishing = isFishingRecord(item.scene, item.subType)
      const destination = isDestinationOnlyRecord(item.scene, item.subType)
      const tags = Array.isArray(item.tags) ? item.tags : []
      return {
        id: item.id,
        type: fishing ? 'spot' : 'route',
        scene: item.scene,
        subType: item.subType,
        title: item.title,
        subtitle: fishing
          ? `${String(tags[0] || '')} · ${item.bestTime}`
          : destination
            ? `门票 ${item.priceLabel || '免费'} · ${item.bestTime || '全天'}`
            : `${item.lengthKm.toFixed(1)}km · 落差 ${item.elevationM}m · ${item.difficulty}`,
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
