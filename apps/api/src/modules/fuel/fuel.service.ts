import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { distanceInKm, roundDistanceKm } from '../../common/geo'
import { FUEL_GRADES, gradePrice, ProvinceFuelPriceProvider, regionFromCityCode } from './province-price.provider'
import type { GeoPoint } from '../../common/geo'
import type { ProvinceFuelPrice } from './province-price.provider'

/** 油价数据来源：省级官方参考价 / 暂无（成品油按省定价，无城市级数据源） */
export type FuelPriceSource = 'province' | 'empty'

@Injectable()
export class FuelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provincePrice: ProvinceFuelPriceProvider,
  ) {}

  async prices(cityCode: string) {
    // 返回 region 以便界面标注「XX省参考价」，避免把省级价当成该城市的价
    const province = await this.fetchProvincePrice(cityCode)
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
    const priced = await this.withOfficialPrices(stations)
    if (!point) return priced

    return priced
      .map((station) => ({
        ...station,
        distanceKm: roundDistanceKm(distanceInKm(point, { latitude: station.latitude, longitude: station.longitude })),
      }))
      .sort((left, right) => left.distanceKm - right.distanceKm)
  }

  private async fetchProvincePrice(cityCode: string): Promise<ProvinceFuelPrice | null> {
    const region = regionFromCityCode(cityCode)
    return region ? this.provincePrice.fetchByRegion(region) : null
  }

  /**
   * 站点挂牌价在**读取时**按省级指导价（零售价上限）覆盖。
   * 站点价写死在库里会随调价周期变旧，而指导价由省级源每周更新；
   * 省级源不可用时才回落到库内值，避免站点列表出现空白单价。
   */
  private async withOfficialPrices<T extends { cityCode: string; price92: number; price95: number }>(stations: T[]) {
    // 同一省份只查一次
    const cityCodes = [...new Set(stations.map((station) => station.cityCode))]
    const byCity = new Map(
      await Promise.all(cityCodes.map(async (code) => [code, await this.fetchProvincePrice(code)] as const)),
    )

    return stations.map((station) => {
      const province = byCity.get(station.cityCode) ?? null
      return Object.assign({}, station, {
        price92: gradePrice(province, FUEL_GRADES.gasoline92) ?? station.price92,
        price95: gradePrice(province, FUEL_GRADES.gasoline95) ?? station.price95,
      })
    })
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
