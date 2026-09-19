import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { distanceInKm, roundDistanceKm } from '../../common/geo'
import { ProvinceFuelPriceProvider, regionFromCityCode } from './province-price.provider'
import type { GeoPoint } from '../../common/geo'

/** 油价数据来源：库内城市油价 / 省级官方参考价 / 暂无 */
export type FuelPriceSource = 'city' | 'province' | 'empty'

@Injectable()
export class FuelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provincePrice: ProvinceFuelPriceProvider,
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

    // 城市未单独维护时，降级使用省级官方价（成品油按省定价，同省内各城市一致）。
    // 返回 region 以便界面标注「XX省参考价」，避免把省级价当成该城市价格。
    const region = regionFromCityCode(cityCode)
    const province = region ? await this.provincePrice.fetchByRegion(region) : null
    if (!province) {
      return { items: [], updatedAt: '', source: 'empty' satisfies FuelPriceSource }
    }
    return {
      items: province.items,
      updatedAt: this.formatDay(province.publishedAt),
      source: 'province' satisfies FuelPriceSource,
      region: province.regionLabel,
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

  /** 省级源只有调价日期，没有具体时刻，因此只展示到日，不补造时间 */
  private formatDay(value: Date) {
    const parts = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit',
    }).formatToParts(value)
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || ''
    return `${part('month')}-${part('day')}`
  }
}
