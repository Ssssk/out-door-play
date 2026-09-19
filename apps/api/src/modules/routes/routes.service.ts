import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DISCOVERY_REPOSITORY } from './discovery.repository'
import type { DiscoveryRepository, DiscoveryScene, PublicDiscoveryRecord } from './discovery.repository'

@Injectable()
export class RoutesService {
  constructor(@Inject(DISCOVERY_REPOSITORY) private readonly repository: DiscoveryRepository) {}

  listCities() {
    return this.repository.listCities()
  }

  async list(scene: DiscoveryScene, limit = 10, cityCode?: string) {
    return (await this.repository.list(scene, limit, cityCode)).map((item) => this.toCard(item))
  }

  route(id: string) {
    return this.detail(id, 'drive')
  }

  spot(id: string) {
    return this.detail(id, 'fish')
  }

  private async detail(id: string, scene: DiscoveryScene) {
    const item = await this.repository.find(id, scene)
    if (!item) {
      throw new NotFoundException({ code: 'DISCOVERY_NOT_FOUND', message: '内容不存在或已下线' })
    }
    return {
      ...this.toCard(item),
      durationLabel: item.durationLabel,
      bestTime: item.bestTime,
      carType: item.carType,
      startPoint: item.startPoint,
      endPoint: item.endPoint,
      entryPoint: item.entryPoint,
      mainArea: item.mainArea,
      gear: item.gear,
      shoreKm: item.scene === 'fish' ? item.shoreKm : null,
      description: item.description,
      tags: this.stringArray(item.tags),
      latitude: item.latitude,
      longitude: item.longitude,
      elevationPoints: item.scene === 'drive' ? this.numberArray(item.elevationPoints) : [],
    }
  }

  private toCard(item: PublicDiscoveryRecord) {
    return {
      id: item.id,
      scene: item.scene,
      title: item.title,
      rank: item.rank,
      rankTag: item.rankTag,
      distanceKm: item.distanceKm,
      lengthKm: item.lengthKm,
      elevationM: item.scene === 'drive' ? item.elevationM : null,
      depthM: item.scene === 'fish' ? item.depthM : null,
      difficulty: item.difficulty,
      coverImageUrl: item.coverImageUrl,
      // 客户端据此按设备定位实算「距你」距离
      latitude: item.latitude,
      longitude: item.longitude,
    }
  }

  private stringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  }

  private numberArray(value: unknown): number[] {
    return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item)) : []
  }
}
