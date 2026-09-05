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
      select: { code: true, name: true },
      orderBy: { code: 'asc' },
    })
  }

  list(scene: DiscoveryScene, limit: number, cityCode?: string) {
    return this.prisma.discovery.findMany({
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
  }

  find(id: string, scene: DiscoveryScene) {
    return this.prisma.discovery.findFirst({
      where: { id, scene, status: 'online', city: { enabled: true } },
      select: publicDiscoverySelect,
    })
  }
}
