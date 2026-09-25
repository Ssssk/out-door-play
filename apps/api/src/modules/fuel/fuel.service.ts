import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { TencentStationProvider } from './tencent-station.provider'
import { distanceInKm, roundDistanceKm } from '../../common/geo'
import { ProvinceFuelPriceProvider, regionFromCityCode } from './province-price.provider'
import { STATION_PAGE_SIZE, STATION_PAGE_SIZE_MAX } from './fuel.dto'
import type { GeoPoint } from '../../common/geo'
import type { ProvinceFuelPrice } from './province-price.provider'
import { PrismaService } from '../../database/prisma.service'

/** 油价数据来源：城市配置（后台维护，manual 手动 / auto 自动）/ 省级官方参考价 / 暂无 */
export type FuelPriceSource = 'city-manual' | 'city-auto' | 'province' | 'empty'

@Injectable()
export class FuelService {
  constructor(
    private readonly tencent: TencentStationProvider,
    private readonly provincePrice: ProvinceFuelPriceProvider,
    private readonly prisma: PrismaService,
  ) {}

  async prices(cityCode: string) {
    // 后台维护的城市级油价优先（manual 手动录入 / auto 自动获取），与小程序实时同源
    const city = await this.prisma.city.findUnique({
      where: { code: cityCode },
      select: { name: true, oilPrice92: true, oilPrice95: true, oilPrice0: true, oilSource: true, oilUpdatedAt: true },
    })
    if (city && (city.oilSource === 'manual' || city.oilSource === 'auto') && city.oilPrice92 != null) {
      const items = [
        { grade: '92#', price: city.oilPrice92, change: 0 },
        { grade: '95#', price: city.oilPrice95 ?? 0, change: 0 },
        { grade: '0#', price: city.oilPrice0 ?? 0, change: 0 },
      ].filter((item) => item.price > 0)
      return {
        items,
        updatedAt: city.oilUpdatedAt ? this.formatDay(city.oilUpdatedAt) : '',
        source: (city.oilSource === 'manual' ? 'city-manual' : 'city-auto') satisfies FuelPriceSource,
        region: city.name,
      }
    }
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

  /** 用户坐标实时查询腾讯 POI；不读取或写入站点台账。 */
  async stations(point?: GeoPoint | null, page = 1, pageSize = STATION_PAGE_SIZE) {
    if (!point) throw new BadRequestException({ code: 'FUEL_LOCATION_REQUIRED', message: '请先开启定位' })
    const currentPage = Math.max(1, Math.trunc(page) || 1)
    const size = Math.min(Math.max(1, Math.trunc(pageSize) || STATION_PAGE_SIZE), STATION_PAGE_SIZE_MAX)
    const start = (currentPage - 1) * size
    const end = Math.min(start + size, 200)
    const items = []
    let total = 0
    // 腾讯每页最多 20 条；按原始结果窗口切分后再过滤，保留客户端 30 条分页。
    for (let offset = Math.floor(start / 20) * 20; offset < end; offset += 20) {
      const result = await this.tencent.fetchPage(point, offset / 20 + 1, {
        offset: Math.max(start - offset, 0),
        limit: Math.min(end, offset + 20) - Math.max(start, offset),
      })
      if (!result) throw new ServiceUnavailableException({ code: 'FUEL_POI_UNAVAILABLE', message: '附近加油站查询暂不可用，请稍后重试' })
      total = Math.min(result.count, 200)
      // 腾讯越界页会重复末页，必须按 count 截止。
      if (start >= total) break
      items.push(...result.items)
      if (offset + 20 >= total) break
    }
    const stations = [...new Map(items.map((station) => [station.id, station])).values()].map((station) => ({
      id: 'tx-' + station.id,
      name: station.name,
      brand: station.brand,
      address: station.address,
      latitude: station.latitude,
      longitude: station.longitude,
      distanceKm: roundDistanceKm(distanceInKm(point, station)),
      openingHours: '',
      // POI 不提供站点报价；省级参考价由页面独立展示。
      price92: 0,
      price95: 0,
    }))
    stations.sort((a, b) => a.distanceKm - b.distanceKm || a.id.localeCompare(b.id))
    return { items: stations, total, page: currentPage, pageSize: size, hasMore: end < total }
  }

  private async fetchProvincePrice(cityCode: string): Promise<ProvinceFuelPrice | null> {
    const region = regionFromCityCode(cityCode)
    return region ? this.provincePrice.fetchByRegion(region) : null
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
