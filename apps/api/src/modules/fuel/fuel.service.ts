import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { distanceInKm, roundDistanceKm } from '../../common/geo'
import { FUEL_GRADES, gradePrice, ProvinceFuelPriceProvider, regionFromCityCode } from './province-price.provider'
import { STATION_PAGE_SIZE, STATION_PAGE_SIZE_MAX } from './fuel.dto'
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

  /**
   * 附近加油站：**按距离由近到远**排序后分页返回。
   *
   * 站点数据由 `StationSyncService` 定时从腾讯地点搜索同步落库（见该文件说明），
   * 这里只读自己的库，因此**不消耗腾讯额度**，与用户量无关。
   * 有设备定位时用真实坐标算距离，否则用同步时记录的「到城市中心」的距离。
   * 因为排序键依赖用户坐标，无法交给数据库，所以取出后在内存中排序再切片；
   * 站点量级较大时应改为数据库侧的空间索引分页。
   */
  async stations(point?: GeoPoint | null, page = 1, pageSize = STATION_PAGE_SIZE) {
    const currentPage = Math.max(1, Math.trunc(page) || 1)
    const size = Math.min(Math.max(1, Math.trunc(pageSize) || STATION_PAGE_SIZE), STATION_PAGE_SIZE_MAX)

    const stations = await this.prisma.fuelStation.findMany({ where: { enabled: true } })
    const located = (await this.withOfficialPrices(stations)).map((station) => ({
      ...station,
      distanceKm: point
        ? roundDistanceKm(distanceInKm(point, { latitude: station.latitude, longitude: station.longitude }))
        : station.distanceKm,
    }))

    // 距离相同则按 id 兜底，保证翻页之间顺序稳定、不漏不重
    located.sort((left, right) => left.distanceKm - right.distanceKm || left.id.localeCompare(right.id))

    const start = (currentPage - 1) * size
    const items = located.slice(start, start + size)
    return {
      items,
      total: located.length,
      page: currentPage,
      pageSize: size,
      // 前端据此决定是否继续上拉加载
      hasMore: start + items.length < located.length,
    }
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
