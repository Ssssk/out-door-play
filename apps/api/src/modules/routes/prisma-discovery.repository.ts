import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import type { DiscoveryRepository, DiscoveryScene } from './discovery.repository'

const publicDiscoverySelect = {
  id: true,
  scene: true,
  title: true,
  rank: true,
  rankTag: true,
  distanceKm: true,
  lengthKm: true,
  elevationM: true,
  depthM: true,
  difficulty: true,
  coverImageUrl: true,
  durationLabel: true,
  bestTime: true,
  carType: true,
  startPoint: true,
  endPoint: true,
  entryPoint: true,
  mainArea: true,
  gear: true,
  shoreKm: true,
  description: true,
  tags: true,
  latitude: true,
  longitude: true,
  elevationPoints: true,
} as const

@Injectable()
export class PrismaDiscoveryRepository implements DiscoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  listCities() {
    return this.prisma.city.findMany({
      where: { enabled: true },
      select: { code: true, name: true, scenes: true },
      orderBy: { code: 'asc' },
    })
  }

  /**
   * 榜单标签：路线卡片左上角的「榜单名 Top N」由后台「热门榜单配置」的
   * coverRouteIds 顺序推导（第 1 条即 Top 1），未进榜单的路线不展示标签。
   */
  private async rankingLabels(ids: string[]) {
    if (!ids.length) return new Map<string, { rankTag: string; rank: number }>()
    const rankings = await this.prisma.ranking.findMany({
      where: { status: 'online' },
      select: { name: true, coverRouteIds: true },
      orderBy: [{ weight: 'desc' }, { id: 'asc' }],
    })
    const labels = new Map<string, { rankTag: string; rank: number }>()
    for (const ranking of rankings) {
      const coverIds = Array.isArray(ranking.coverRouteIds) ? (ranking.coverRouteIds as string[]) : []
      coverIds.forEach((routeId, index) => {
        if (!labels.has(routeId) && ids.includes(routeId)) labels.set(routeId, { rankTag: ranking.name, rank: index + 1 })
      })
    }
    return labels
  }

  async list(scene: DiscoveryScene, limit: number, cityCode?: string) {
    const records = await this.prisma.discovery.findMany({
      where: {
        scene,
        status: 'online',
        city: { enabled: true },
        ...(cityCode ? { cityCode } : {}),
      },
      select: publicDiscoverySelect,
      orderBy: [{ rank: 'asc' }, { distanceKm: 'asc' }, { id: 'asc' }],
      take: limit,
    })
    // 榜单标签优先取后台榜单绑定（榜单名 + 在榜单中的位次），未绑定则保留路线自带标签
    const labels = await this.rankingLabels(records.map((record) => record.id))
    return records.map((record) => {
      const label = labels.get(record.id)
      return label ? { ...record, rankTag: label.rankTag, rank: label.rank } : record
    })
  }

  find(id: string, scene: DiscoveryScene) {
    return this.prisma.discovery.findFirst({
      where: { id, scene, status: 'online', city: { enabled: true } },
      select: publicDiscoverySelect,
    })
  }
}
