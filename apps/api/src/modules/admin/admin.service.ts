import { BadRequestException, ForbiddenException, Injectable, NotFoundException, PayloadTooLargeException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { AdminActor } from '../admin-auth/admin-auth.types'
import { PrismaService } from '../../database/prisma.service'
import type {
  CreateCityDto,
  CreateRouteDto,
  CreateReportDto,
  RouteActionDto,
  SetCityOilDto,
  UpdateCityDto,
  UpdateFeedStatusDto,
  UpdateFuelStationDto,
  UpdateQrConfigDto,
  UpdateRouteDto,
  UpdateUserNoteDto,
  UpdateUserStatusDto,
  UpsertRankingDto,
} from './admin.dto'

const QR_CONFIG_KEY = 'qrcodes'

/** 油价来源口径（与 web-cities.md 对齐）：manual 手动录入 / auto 自动获取 / failed 获取失败 */
export type CityOilSource = 'manual' | 'auto' | 'failed'

const ROUTE_COVER_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_ROUTE_COVER_BYTES = 5 * 1024 * 1024

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000)
    const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000)
    // 今日 00:00 与昨日区间（本地时区），用于用户管理「今日/昨日新增」
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 3600 * 1000)
    const [onShelfCount, pendingAuditCount, routeAggregate, userCount, bannedUsers, dau, mau, todayNew, yesterdayNew, stationCount, feedPending] = await Promise.all([
      this.prisma.discovery.count({ where: { status: 'online' } }),
      this.prisma.discovery.count({ where: { status: 'pending' } }),
      this.prisma.discovery.aggregate({ _sum: { impressions: true, clicks: true } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'banned' } }),
      this.prisma.user.count({ where: { lastActiveAt: { gte: dayAgo } } }),
      this.prisma.user.count({ where: { lastActiveAt: { gte: monthAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfYesterday, lt: startOfToday } } }),
      this.prisma.fuelStation.count({ where: { enabled: true } }),
      this.prisma.feed.count({ where: { status: 'pending' } }),
    ])
    const impressions = routeAggregate._sum.impressions || 0
    const clicks = routeAggregate._sum.clicks || 0
    return {
      routes: { onShelfCount, monthImpressions: impressions, ctr: impressions ? clicks / impressions : 0, pendingAuditCount },
      users: { total: userCount, banned: bannedUsers, dau, mau, todayNew, yesterdayNew },
      fuel: { stations: stationCount },
      content: { pending: feedPending },
    }
  }

  async routes() {
    const [records, rankings] = await Promise.all([
      this.prisma.discovery.findMany({
        include: { city: { select: { name: true } }, _count: { select: { favorites: true } } },
        orderBy: [{ rankWeight: 'desc' }, { rank: 'desc' }],
      }),
      this.prisma.ranking.findMany({ select: { coverRouteIds: true } }),
    ])
    // 已绑榜单数 = 各榜单 coverRouteIds 引用该路线的次数（与榜单编辑器双向同步）
    const boundCount = new Map<string, number>()
    for (const ranking of rankings) {
      const ids = Array.isArray(ranking.coverRouteIds) ? (ranking.coverRouteIds as string[]) : []
      for (const id of ids) boundCount.set(id, (boundCount.get(id) || 0) + 1)
    }
    return records.map((item, index) => ({
      ...item,
      listRank: index + 1,
      cityName: item.city.name,
      favoriteCount: item._count.favorites,
      boundRankings: boundCount.get(item.id) || 0,
      tags: Array.isArray(item.tags) ? item.tags : [],
      city: undefined,
      _count: undefined,
    }))
  }

  /** 删除路线（PRD：若被榜单引用为封面路线则拦截并提示；物理删除无法恢复） */
  async deleteRoute(id: string) {
    await this.requireRoute(id)
    const usedBy = (await this.prisma.ranking.findMany({ select: { name: true, coverRouteIds: true } }))
      .filter((ranking) => Array.isArray(ranking.coverRouteIds) && (ranking.coverRouteIds as string[]).includes(id))
      .map((ranking) => ranking.name)
    if (usedBy.length) {
      throw new BadRequestException(`该路线被以下榜单引用为封面路线，请先到「热门榜单配置」移除：${usedBy.join('、')}`)
    }
    await this.prisma.discovery.delete({ where: { id } })
    return { id }
  }

  async createRoute(input: CreateRouteDto) {
    const city = await this.prisma.city.findUnique({ where: { code: input.cityCode } })
    if (!city) throw new NotFoundException('关联城市不存在，请先在城市与位置中维护该城市')

    const scene = input.scene
    const defaultCoverImageUrl = scene === 'fish' ? '/static/fishing/card-fishing-1.jpg' : '/static/routes/card-route-1.jpg'
    return this.prisma.discovery.create({
      data: {
        id: `route-${randomUUID()}`,
        cityCode: input.cityCode,
        scene,
        title: input.title.trim(),
        rank: input.rank ?? 0,
        rankTag: input.rankTag?.trim() || '',
        distanceKm: input.distanceKm ?? 0,
        lengthKm: input.lengthKm ?? input.distanceKm ?? 0,
        elevationM: input.elevationM ?? 0,
        difficulty: input.difficulty.trim(),
        coverImageUrl: input.coverImageUrl?.trim() || defaultCoverImageUrl,
        durationLabel: input.durationLabel?.trim() || '待补充',
        bestTime: input.bestTime?.trim() || '待补充',
        carType: input.carType?.trim() || null,
        startPoint: input.startPoint?.trim() || null,
        endPoint: input.endPoint?.trim() || null,
        entryPoint: input.entryPoint?.trim() || null,
        mainArea: input.mainArea?.trim() || null,
        gear: input.gear?.trim() || null,
        shoreKm: input.shoreKm ?? null,
        depthM: input.depthM ?? null,
        description: input.description?.trim() || '暂无描述',
        tags: input.tags ?? [],
        latitude: input.latitude ?? 0,
        longitude: input.longitude ?? 0,
        elevationPoints: input.elevationPoints ?? undefined,
        // PRD v1.0.0：新建路线直接上线（无待审核中间态，操作列仅编辑/删除）
        status: 'online',
        rankWeight: input.rankWeight ?? 50,
      },
    })
  }

  async updateRoute(id: string, input: UpdateRouteDto) {
    await this.requireRoute(id)
    if (input.cityCode) {
      const city = await this.prisma.city.findUnique({ where: { code: input.cityCode } })
      if (!city) throw new NotFoundException('关联城市不存在，请先在城市与位置中维护该城市')
    }
    return this.prisma.discovery.update({ where: { id }, data: input })
  }

  async saveRouteCover(id: string, file: Express.Multer.File | undefined) {
    await this.requireRoute(id)
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new BadRequestException({ code: 'ROUTE_COVER_FILE_REQUIRED', message: '请选择路线封面图片' })
    }
    const extension = ROUTE_COVER_MIME_EXTENSIONS[file.mimetype]
    if (!extension) {
      throw new BadRequestException({ code: 'ROUTE_COVER_TYPE_UNSUPPORTED', message: '路线封面仅支持 JPG / PNG / WebP 格式' })
    }
    if (file.size > MAX_ROUTE_COVER_BYTES) {
      throw new PayloadTooLargeException({ code: 'ROUTE_COVER_FILE_TOO_LARGE', message: '路线封面图片不能超过 5MB' })
    }
    const coverDir = join(process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'), 'routes')
    await mkdir(coverDir, { recursive: true })
    const filename = `${randomUUID()}.${extension}`
    await writeFile(join(coverDir, filename), file.buffer)
    const coverImageUrl = `/v1/uploads/routes/${filename}`
    return this.prisma.discovery.update({ where: { id }, data: { coverImageUrl } })
  }

  async routeAction(id: string, input: RouteActionDto, actor: AdminActor, requestId: string) {
    const existing = await this.prisma.auditLog.findUnique({ where: { actionId: input.actionId } })
    if (existing) return { route: await this.requireRoute(id), duplicate: true }

    const transitions = {
      'audit-pass': { from: 'pending', to: 'online' },
      'audit-reject': { from: 'pending', to: 'offline' },
      'shelf-on': { from: 'offline', to: 'online' },
      'shelf-off': { from: 'online', to: 'offline' },
    } as const
    const transition = transitions[input.action]
    const permission = input.action.startsWith('audit-') ? 'route:audit' : 'route:shelf'
    if (!actor.permissions.includes(permission)) throw new ForbiddenException('当前账号无权执行该路线动作')

    return this.prisma.$transaction(async (tx) => {
      const before = await tx.discovery.findUnique({ where: { id } })
      if (!before) throw new NotFoundException('路线不存在')
      if (before.status === transition.to) return { route: before, duplicate: true }
      if (before.status !== transition.from) throw new BadRequestException(`当前状态 ${before.status} 不允许执行 ${input.action}`)

      const changed = await tx.discovery.updateMany({ where: { id, status: transition.from }, data: { status: transition.to } })
      if (changed.count === 0) return { route: await tx.discovery.findUniqueOrThrow({ where: { id } }), duplicate: true }
      const route = await tx.discovery.findUniqueOrThrow({ where: { id } })
      await tx.auditLog.create({
        data: {
          actionId: input.actionId,
          discoveryId: id,
          adminUserId: actor.id,
          operator: actor.displayName,
          action: input.action,
          resourceType: 'discovery',
          resourceId: id,
          reason: input.note || null,
          requestId: requestId || null,
          beforeValue: { status: before.status },
          afterValue: { status: route.status, note: input.note || '' },
        },
      })
      return { route, duplicate: false }
    })
  }

  async rankings() {
    const records = await this.prisma.ranking.findMany({ include: { city: { select: { name: true } } }, orderBy: [{ weight: 'desc' }, { id: 'asc' }] })
    return records.map((ranking) => ({
      ...ranking,
      // seq 与 weight 共用同一字段（PRD v1.0.0 取消权重概念，榜单顺序即 seq）
      seq: ranking.weight,
      cityName: ranking.city?.name || '',
      coverRouteIds: Array.isArray(ranking.coverRouteIds) ? ranking.coverRouteIds : [],
    }))
  }

  /** 新建/编辑榜单共用校验：封面路线必须存在且同场景（指定城市时还要同城市，RULE-RANK-004） */
  private async validateCoverRoutes(scene: 'drive' | 'fish', cityCode: string | undefined, coverRouteIds: string[]) {
    const routes = await this.prisma.discovery.findMany({
      where: { id: { in: coverRouteIds } },
      select: { id: true, scene: true, cityCode: true, status: true, title: true },
    })
    if (routes.length !== coverRouteIds.length) throw new BadRequestException('封面路线中存在不存在的路线，请刷新后重试')
    const offline = routes.filter((route) => route.status === 'offline')
    if (offline.length) throw new BadRequestException(`以下路线已下架，不能作为封面：${offline.map((route) => route.title).join('、')}`)
    const wrongScene = routes.filter((route) => route.scene !== scene)
    if (wrongScene.length) throw new BadRequestException(`封面路线场景须与榜单一致（${scene === 'fish' ? '钓鱼' : '溜车'}）：${wrongScene.map((route) => route.title).join('、')}`)
    if (cityCode) {
      const wrongCity = routes.filter((route) => route.cityCode !== cityCode)
      if (wrongCity.length) throw new BadRequestException(`封面路线须与榜单城市一致：${wrongCity.map((route) => route.title).join('、')}`)
    }
  }

  async createRanking(input: UpsertRankingDto) {
    await this.validateCoverRoutes(input.scene, input.cityCode, input.coverRouteIds)
    if (input.cityCode) {
      const city = await this.prisma.city.findUnique({ where: { code: input.cityCode } })
      if (!city) throw new NotFoundException('榜单城市不存在')
    }
    const max = await this.prisma.ranking.aggregate({ _max: { weight: true } })
    return this.prisma.ranking.create({
      data: {
        id: `ranking-${randomUUID()}`,
        name: input.name.trim(),
        scene: input.scene,
        cityCode: input.cityCode || null,
        coverRouteIds: input.coverRouteIds,
        coverageCount: input.coverRouteIds.length,
        weight: (max._max.weight || 0) + 1,
        // PRD v1.0.0：榜单状态恒为 online（无 draft/offline 中间态）
        status: 'online',
      },
    })
  }

  async updateRanking(id: string, input: UpsertRankingDto) {
    const found = await this.prisma.ranking.findUnique({ where: { id } })
    if (!found) throw new NotFoundException('榜单不存在')
    await this.validateCoverRoutes(input.scene, input.cityCode, input.coverRouteIds)
    return this.prisma.ranking.update({
      where: { id },
      data: {
        name: input.name.trim(),
        scene: input.scene,
        cityCode: input.cityCode || null,
        coverRouteIds: input.coverRouteIds,
        coverageCount: input.coverRouteIds.length,
      },
    })
  }

  /** 删除榜单（PRD：二次确认后物理删除，路线的「已绑榜单数」同步减少） */
  async deleteRanking(id: string) {
    const found = await this.prisma.ranking.findUnique({ where: { id } })
    if (!found) throw new NotFoundException('榜单不存在')
    await this.prisma.ranking.delete({ where: { id } })
    return { id }
  }

  async cities() {
    const records = await this.prisma.city.findMany({
      include: {
        _count: { select: { discoveries: true, fuelStations: true } },
      },
      orderBy: { code: 'asc' },
    })
    return records.map((city) => ({
      code: city.code,
      name: city.name,
      enabled: city.enabled,
      scenes: Array.isArray(city.scenes) ? city.scenes : [],
      routeCount: city._count.discoveries,
      stationCount: city._count.fuelStations,
      oilPrice92: city.oilPrice92,
      oilPrice95: city.oilPrice95,
      oilPrice0: city.oilPrice0,
      oilSource: city.oilSource,
      oilUpdatedAt: city.oilUpdatedAt,
      oilError: city.oilError,
    }))
  }

  async toggleCity(code: string, enabled: boolean) {
    const found = await this.prisma.city.findUnique({ where: { code } })
    if (!found) throw new NotFoundException('城市不存在')
    return this.prisma.city.update({ where: { code }, data: { enabled } })
  }

  /** 新增城市（PRD 城市管理）：adcode 唯一，默认开通溜车+加油场景并启用 */
  async createCity(input: CreateCityDto) {
    const exists = await this.prisma.city.findUnique({ where: { code: input.code } })
    if (exists) throw new BadRequestException(`adcode ${input.code} 已存在城市「${exists.name}」`)
    return this.prisma.city.create({
      data: {
        code: input.code,
        name: input.name.trim(),
        scenes: input.scenes && input.scenes.length ? input.scenes : ['drive', 'fuel'],
        enabled: input.enabled ?? true,
      },
    })
  }

  /** 编辑城市：名称/场景/启用（场景关闭后 C 端对应场景数据不再返回） */
  async updateCity(code: string, input: UpdateCityDto) {
    const found = await this.prisma.city.findUnique({ where: { code } })
    if (!found) throw new NotFoundException('城市不存在')
    return this.prisma.city.update({
      where: { code },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.scenes !== undefined ? { scenes: input.scenes } : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      },
    })
  }

  /** 删除城市：存在路线/加油站/用户关联数据时拦截，防止误删运营数据 */
  async deleteCity(code: string) {
    const found = await this.prisma.city.findUnique({
      where: { code },
      include: { _count: { select: { discoveries: true, fuelStations: true, users: true } } },
    })
    if (!found) throw new NotFoundException('城市不存在')
    const { discoveries, fuelStations, users } = found._count
    if (discoveries > 0 || fuelStations > 0 || users > 0) {
      throw new BadRequestException(`该城市存在关联数据（路线 ${discoveries} 条、加油站 ${fuelStations} 个、用户 ${users} 位），无法删除；如需下线请改为「停用」`)
    }
    await this.prisma.city.delete({ where: { code } })
    return { code }
  }

  /** 场景开关：关闭后 C 端该城市对应场景数据不再返回 */
  async updateCityScenes(code: string, scenes: string[]) {
    const found = await this.prisma.city.findUnique({ where: { code } })
    if (!found) throw new NotFoundException('城市不存在')
    const allowed = ['drive', 'fish', 'fuel'] as const
    const filtered = allowed.filter((scene) => scenes.includes(scene))
    return this.prisma.city.update({ where: { code }, data: { scenes: filtered } })
  }

  /** 手动录入油价：运营优先，不会被自动获取覆盖（web-cities.md §3.1） */
  async setCityOil(code: string, input: SetCityOilDto) {
    const found = await this.prisma.city.findUnique({ where: { code } })
    if (!found) throw new NotFoundException('城市不存在')
    const price92 = input.price92 ?? found.oilPrice92
    const price95 = input.price95 ?? found.oilPrice95
    const price98 = input.price98 ?? found.oilPrice98
    const price0 = input.price0 ?? found.oilPrice0
    if (price92 == null && price95 == null && price98 == null && price0 == null) throw new BadRequestException('至少填写一档油价')
    return this.prisma.city.update({
      where: { code },
      data: {
        oilPrice92: price92,
        oilPrice95: price95,
        oilPrice98: price98,
        oilPrice0: price0,
        oilSource: 'manual',
        oilUpdatedAt: new Date(),
        oilError: null,
      },
    })
  }

  /**
   * 自动获取油价（第三方接口 mock）：约 70% 成功率，成功在现价基础上 ±0.05 抖动；
   * 失败保留原价格、标记 failed + 错误信息，运营可「重新获取」或「手动填写」恢复。
   */
  async refreshCityOil(code: string) {
    const found = await this.prisma.city.findUnique({ where: { code } })
    if (!found) throw new NotFoundException('城市不存在')
    if (!found.enabled) throw new BadRequestException('城市未启用，无法获取油价')
    await new Promise((resolve) => setTimeout(resolve, 400))

    const success = Math.random() < 0.7
    if (!success) {
      return this.prisma.city.update({
        where: { code },
        data: { oilSource: 'failed', oilError: '第三方油价接口超时，请稍后重试或手动填写' },
      })
    }
    const jitter = () => Math.round((Math.random() * 0.1 - 0.05) * 100) / 100
    const base92 = found.oilPrice92 ?? 7.6
    const base95 = found.oilPrice95 ?? 8.2
    const base98 = found.oilPrice98 ?? 9.2
    const base0 = found.oilPrice0 ?? 7.3
    return this.prisma.city.update({
      where: { code },
      data: {
        oilPrice92: Math.max(5, Math.round((base92 + jitter()) * 100) / 100),
        oilPrice95: Math.max(5, Math.round((base95 + jitter()) * 100) / 100),
        oilPrice98: Math.max(5, Math.round((base98 + jitter()) * 100) / 100),
        oilPrice0: Math.max(5, Math.round((base0 + jitter()) * 100) / 100),
        oilSource: 'auto',
        oilUpdatedAt: new Date(),
        oilError: null,
      },
    })
  }

  /** 批量刷新所有启用城市的油价 */
  async refreshAllCityOil() {
    const cities = await this.prisma.city.findMany({ where: { enabled: true }, select: { code: true } })
    const results = []
    for (const city of cities) {
      try {
        const updated = await this.refreshCityOil(city.code)
        results.push({ code: city.code, source: updated.oilSource })
      } catch {
        results.push({ code: city.code, source: 'failed' })
      }
    }
    return { total: cities.length, results }
  }

  /** 小程序「我的」页二维码配置（官方粉丝群 / 个人微信） */
  async qrcodes() {
    const record = await this.prisma.systemConfig.findUnique({ where: { key: QR_CONFIG_KEY } })
    const value = (record?.value || {}) as Record<string, unknown>
    return {
      fanGroup: typeof value.fanGroup === 'string' ? value.fanGroup : '',
      contact: typeof value.contact === 'string' ? value.contact : '',
      fanGroupAt: typeof value.fanGroupAt === 'string' ? value.fanGroupAt : null,
      contactAt: typeof value.contactAt === 'string' ? value.contactAt : null,
      savedAt: record?.updatedAt ?? null,
    }
  }

  async updateQrcodes(input: UpdateQrConfigDto) {
    const current = await this.qrcodes()
    const now = new Date().toISOString()
    const value = {
      fanGroup: input.fanGroup !== undefined ? input.fanGroup : current.fanGroup,
      contact: input.contact !== undefined ? input.contact : current.contact,
      fanGroupAt: input.fanGroup !== undefined ? now : current.fanGroupAt,
      contactAt: input.contact !== undefined ? now : current.contactAt,
    }
    await this.prisma.systemConfig.upsert({
      where: { key: QR_CONFIG_KEY },
      update: { value: value as object },
      create: { key: QR_CONFIG_KEY, value: value as object },
    })
    return { ...value, savedAt: now }
  }

  async users() {
    const users = await this.prisma.user.findMany({
      include: { city: { select: { name: true } }, _count: { select: { favorites: true, feeds: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return users.map((user) => ({
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: this.maskPhone(user.phone),
      cityName: user.city?.name || '—',
      status: user.status,
      favoriteCount: user._count.favorites,
      postCount: user._count.feeds,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    }))
  }

  async updateUserStatus(id: string, input: UpdateUserStatusDto) {
    const found = await this.prisma.user.findUnique({ where: { id } })
    if (!found) throw new NotFoundException('用户不存在')
    // 封禁联动：该用户已发布内容进入待下架审核队列（web-users.md AC-2）
    if (input.status === 'banned') {
      await this.prisma.feed.updateMany({ where: { authorId: id, status: 'published' }, data: { status: 'pending' } })
    }
    return this.prisma.user.update({ where: { id }, data: { status: input.status } })
  }

  /** 用户详情：完整手机号（权限由 controller 控）、收藏列表、发布内容、运营备注 */
  async userDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        city: { select: { name: true } },
        favorites: { include: { discovery: { select: { id: true, title: true, scene: true } } }, orderBy: { createdAt: 'desc' }, take: 50 },
        feeds: { orderBy: { createdAt: 'desc' }, take: 50 },
        identities: { select: { provider: true, createdAt: true } },
      },
    })
    if (!user) throw new NotFoundException('用户不存在')
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone || '—',
      cityName: user.city?.name || '—',
      status: user.status,
      adminNote: user.adminNote || '',
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      providers: user.identities.map((identity) => ({ provider: identity.provider, boundAt: identity.createdAt })),
      favorites: user.favorites.map((favorite) => ({
        discoveryId: favorite.discovery.id,
        title: favorite.discovery.title,
        scene: favorite.discovery.scene,
        createdAt: favorite.createdAt,
      })),
      feeds: user.feeds.map((feed) => ({
        id: feed.id,
        type: feed.type,
        content: feed.content,
        status: feed.status,
        reportCount: feed.reportCount,
        createdAt: feed.createdAt,
      })),
    }
  }

  async updateUserNote(id: string, input: UpdateUserNoteDto) {
    const found = await this.prisma.user.findUnique({ where: { id } })
    if (!found) throw new NotFoundException('用户不存在')
    return this.prisma.user.update({ where: { id }, data: { adminNote: input.adminNote || null } })
  }

  async feeds() {
    return this.prisma.feed.findMany({
      include: { author: { select: { nickname: true } }, discovery: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async updateFeedStatus(id: string, input: UpdateFeedStatusDto) {
    const found = await this.prisma.feed.findUnique({ where: { id } })
    if (!found) throw new NotFoundException('内容不存在')
    return this.prisma.feed.update({ where: { id }, data: { status: input.status } })
  }

  async analytics() {
    const [trend, routes] = await Promise.all([
      this.prisma.dailyMetric.findMany({ orderBy: { date: 'asc' } }),
      this.prisma.discovery.findMany({ where: { status: 'online' }, orderBy: { impressions: 'desc' }, take: 10 }),
    ])
    const impressions = trend.reduce((sum, item) => sum + item.impressions, 0)
    const clicks = trend.reduce((sum, item) => sum + item.clicks, 0)
    const favorites = trend.reduce((sum, item) => sum + item.favorites, 0)
    return {
      summary: { impressions, clicks, ctr: impressions ? clicks / impressions : 0, favoriteConversion: clicks ? favorites / clicks : 0 },
      trend,
      topRoutes: routes.map((route) => ({ id: route.id, title: route.title, scene: route.scene, impressions: route.impressions, clicks: route.clicks, ctr: route.impressions ? route.clicks / route.impressions : 0 })),
    }
  }

  reports() { return this.prisma.reportTask.findMany({ orderBy: { createdAt: 'desc' } }) }

  createReport(input: CreateReportDto, actor: AdminActor) {
    return this.prisma.reportTask.create({
      data: { id: `report-${randomUUID()}`, ...input, creator: actor.displayName, status: 'processing' },
    })
  }

  async deleteReport(id: string) {
    const found = await this.prisma.reportTask.findUnique({ where: { id } })
    if (!found) throw new NotFoundException('报表任务不存在')
    await this.prisma.reportTask.delete({ where: { id } })
    return { id }
  }

  /**
   * 加油站台账。**不返回挂牌价**：油价由省级官方源按省统一下发、
   * 在 `FuelService.stations()` 读取时覆盖，后台不再维护价格。
   */
  async fuel() {
    const stations = await this.prisma.fuelStation.findMany({
      select: {
        id: true, name: true, brand: true, cityCode: true, address: true,
        openingHours: true, enabled: true, distanceKm: true,
        city: { select: { name: true } },
      },
      orderBy: { distanceKm: 'asc' },
    })
    return { stations }
  }

  async updateFuelStation(id: string, input: UpdateFuelStationDto) {
    const found = await this.prisma.fuelStation.findUnique({ where: { id } })
    if (!found) throw new NotFoundException('加油站不存在')
    return this.prisma.fuelStation.update({ where: { id }, data: input })
  }

  private requireRoute(id: string) {
    return this.prisma.discovery.findUnique({ where: { id } }).then((route) => {
      if (!route) throw new NotFoundException('路线不存在')
      return route
    })
  }

  private maskPhone(phone: string | null) {
    if (!phone || phone.length < 7) return '—'
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }
}
