import { Inject, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { normalizeScene, isFishingRecord, SCENE_SUBTYPE_INVALID, SceneSubTypeInvalidError } from '../../common/scenes'
import type { PlayType, SceneQuery, SceneFilter } from '../../common/scenes'
import { DISCOVERY_REPOSITORY } from './discovery.repository'
import type { DiscoveryRepository, PublicDiscoveryRecord } from './discovery.repository'
import { SceneTabsConfigService } from '../config/scene-tabs-config.service'

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name)

  constructor(
    @Inject(DISCOVERY_REPOSITORY) private readonly repository: DiscoveryRepository,
    private readonly sceneTabs: SceneTabsConfigService,
  ) {}

  listCities() {
    return this.repository.listCities()
  }

  async list(scene: SceneQuery, limit = 10, cityCode?: string, subType?: PlayType | null) {
    const filter = this.normalize(scene, subType)
    // 归一化后再做显隐判断：fish 映射为 play，隐藏「粗门玩玩」时旧包 scene=fish 同样返回 []
    if (!(await this.sceneTabs.enabledScenes()).has(filter.scenes[0]!)) {
      this.logger.log({ event: 'scene_tabs_list_denied', scene, resolvedScene: filter.scenes[0], subType: subType ?? null, cityCode: cityCode ?? null })
      return []
    }
    return (await this.repository.list(filter, limit, cityCode)).map((item) => this.toCard(item))
  }

  /** 详情端点永不引入分类显隐判断，只按集合放行（CHG-SCENE-EXPANSION-001 裁决 3） */
  route(id: string) {
    return this.detail(id, { scenes: ['drive', 'play', 'wash'], subType: null, legacy: false })
  }

  spot(id: string) {
    return this.detail(id, normalizeScene('fish'))
  }

  private normalize(scene: SceneQuery, subType?: PlayType | null): SceneFilter {
    try {
      return normalizeScene(scene, subType ?? null)
    } catch (error) {
      if (error instanceof SceneSubTypeInvalidError) {
        throw new UnprocessableEntityException({ code: SCENE_SUBTYPE_INVALID, message: error.message })
      }
      throw error
    }
  }

  private async detail(id: string, filter: SceneFilter) {
    const item = await this.repository.find(id, filter)
    if (!item) {
      throw new NotFoundException({ code: 'DISCOVERY_NOT_FOUND', message: '内容不存在或已下线' })
    }
    const fishing = isFishingRecord(item.scene, item.subType)
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
      shoreKm: fishing ? item.shoreKm : null,
      description: item.description,
      tags: this.stringArray(item.tags),
      latitude: item.latitude,
      longitude: item.longitude,
      elevationPoints: fishing ? [] : this.numberArray(item.elevationPoints),
    }
  }

  private toCard(item: PublicDiscoveryRecord) {
    const fishing = isFishingRecord(item.scene, item.subType)
    return {
      id: item.id,
      scene: item.scene,
      subType: item.subType,
      title: item.title,
      rank: item.rank,
      rankTag: item.rankTag,
      distanceKm: item.distanceKm,
      lengthKm: item.lengthKm,
      elevationM: fishing ? null : item.elevationM,
      depthM: fishing ? item.depthM : null,
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
