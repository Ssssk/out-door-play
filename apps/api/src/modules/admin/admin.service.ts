import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { AdminActor } from '../admin-auth/admin-auth.types'
import { PrismaService } from '../../database/prisma.service'
import type {
  CreateReportDto,
  RouteActionDto,
  UpdateFeedStatusDto,
  UpdateFuelStationDto,
  UpdateRankingDto,
  UpdateRouteDto,
  UpdateUserStatusDto,
} from './admin.dto'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [onShelfCount, pendingAuditCount, routeAggregate, userCount, bannedUsers, stationCount, feedPending] = await Promise.all([
      this.prisma.discovery.count({ where: { status: 'online' } }),
      this.prisma.discovery.count({ where: { status: 'pending' } }),
      this.prisma.discovery.aggregate({ _sum: { impressions: true, clicks: true } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'banned' } }),
      this.prisma.fuelStation.count({ where: { enabled: true } }),
      this.prisma.feed.count({ where: { status: 'pending' } }),
    ])
    const impressions = routeAggregate._sum.impressions || 0
    const clicks = routeAggregate._sum.clicks || 0
    return {
      routes: { onShelfCount, monthImpressions: impressions, ctr: impressions ? clicks / impressions : 0, pendingAuditCount },
      users: { total: userCount, banned: bannedUsers },
      fuel: { stations: stationCount },
      content: { pending: feedPending },
    }
  }

  async routes() {
    const records = await this.prisma.discovery.findMany({
      include: { city: { select: { name: true } }, _count: { select: { favorites: true } } },
      orderBy: [{ rankWeight: 'desc' }, { rank: 'desc' }],
    })
    return records.map((item, index) => ({
      ...item,
      listRank: index + 1,
      cityName: item.city.name,
      favoriteCount: item._count.favorites,
      tags: Array.isArray(item.tags) ? item.tags : [],
      city: undefined,
      _count: undefined,
    }))
  }

  async updateRoute(id: string, input: UpdateRouteDto) {
    await this.requireRoute(id)
    return this.prisma.discovery.update({ where: { id }, data: input })
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

  rankings() {
    return this.prisma.ranking.findMany({ include: { city: { select: { name: true } } }, orderBy: [{ weight: 'desc' }, { id: 'asc' }] })
  }

  async updateRanking(id: string, input: UpdateRankingDto) {
    const found = await this.prisma.ranking.findUnique({ where: { id } })
    if (!found) throw new NotFoundException('榜单不存在')
    return this.prisma.ranking.update({ where: { id }, data: input })
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
    }))
  }

  async toggleCity(code: string, enabled: boolean) {
    const found = await this.prisma.city.findUnique({ where: { code } })
    if (!found) throw new NotFoundException('城市不存在')
    return this.prisma.city.update({ where: { code }, data: { enabled } })
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
    return this.prisma.user.update({ where: { id }, data: { status: input.status } })
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
