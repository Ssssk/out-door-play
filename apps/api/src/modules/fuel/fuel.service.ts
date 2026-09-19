import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { distanceInKm, roundDistanceKm } from '../../common/geo'
import { OfficialFuelPriceProvider } from './official-price.provider'
import type { GeoPoint } from '../../common/geo'

/** 油价数据来源：库内城市油价 / 官方（发改委价格监测中心）全国平均价 / 暂无 */
export type FuelPriceSource = 'city' | 'official' | 'empty'

@Injectable()
export class FuelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly officialPrice: OfficialFuelPriceProvider,
  ) {}

  async prices(cityCode: string) {
    const records = await this.prisma.fuelPrice.findMany({ where: { cityCode }, orderBy: { grade: 'asc' } })
    if (records.length > 0) {
      const publishedAt = records[0].publishedAt
      return {
        items: records.map(({ grade, price, change }) => ({ grade, price, change })),
        updatedAt: publishedAt ? this.formatDate(publishedAt) : '',
        source: 'city' satisfies FuelPriceSource,
      }
    }

    // 城市未单独收录时，降级使用官方全国平均价（口径为全国平均，按周发布）
    const official = await this.officialPrice.fetchLatest()
    if (!official) {
      return { items: [], updatedAt: '', source: 'empty' satisfies FuelPriceSource }
    }
    return {
      items: official.items,
      updatedAt: this.formatDate(official.publishedAt),
      source: 'official' satisfies FuelPriceSource,
    }
  }

  async stations(point?: GeoPoint | null) {
    const stations = await this.prisma.fuelStation.findMany({
      where: { enabled: true },
      orderBy: { distanceKm: 'asc' },
    })
    if (!point) return stations

    return stations
      .map((station) => ({
        ...station,
        distanceKm: roundDistanceKm(distanceInKm(point, { latitude: station.latitude, longitude: station.longitude })),
      }))
      .sort((left, right) => left.distanceKm - right.distanceKm)
  }

  private formatDate(value: Date) {
    const parts = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(value)
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || ''
    return `${part('month')}-${part('day')} ${part('hour')}:${part('minute')}`
  }
}
