import { BadRequestException, Injectable } from '@nestjs/common'
import { TencentStationProvider } from './tencent-station.provider'
import { PrismaService } from '../../database/prisma.service'
import { distanceInKm, roundDistanceKm } from '../../common/geo'
import { ProvinceFuelPriceProvider, regionFromCityCode } from './province-price.provider'
import { STATION_PAGE_SIZE, STATION_PAGE_SIZE_MAX } from './fuel.dto'
import type { GeoPoint } from '../../common/geo'
import type { ProvinceFuelPrice } from './province-price.provider'

/** 油价数据来源：省级官方参考价（含 92/95/98/0 四档）/ 暂无 */
export type FuelPriceSource = 'province' | 'empty'

/**
 * 附近加油站的**读取**：优先读我们自己每天定时同步进库的 `fuel_stations`（见 `StationSyncService`），
 * 运行时零腾讯额度消耗。腾讯「地点搜索」个人开发者仅 200 次/日，实时查询必然打爆额度，
 * 故实时检索只作为「全库尚无任何站点」时的兜底引导，且单次失败也返回空而不报错。
 */

/** 用户「附近」检索半径（公里）：超过此距离的站点不再展示 */
const STATION_SEARCH_RADIUS_KM = 30
/** 读库用的经纬度包围盒半宽（度）：≈ ±25km，先粗筛再精确算距，避免全表扫描 */
const BOX_HALF_DEG = 0.3

export interface StationItem {
  id: string
  name: string
  brand: string
  address: string
  latitude: number
  longitude: number
  distanceKm: number
  openingHours: string
  price92: number
  price95: number
}

@Injectable()
export class FuelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tencent: TencentStationProvider,
    private readonly provincePrice: ProvinceFuelPriceProvider,
  ) {}

  async prices(cityCode: string) {
    // 油价统一走省级官方源（含 92/95/98/0 四档），运营不再在后台维护城市价格；
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

  /** 用户坐标检索附近加油站：读库优先，实时兜底。 */
  async stations(point?: GeoPoint | null, page = 1, pageSize = STATION_PAGE_SIZE) {
    if (!point) throw new BadRequestException({ code: 'FUEL_LOCATION_REQUIRED', message: '请先开启定位' })
    const currentPage = Math.max(1, Math.trunc(page) || 1)
    const size = Math.min(Math.max(1, Math.trunc(pageSize) || STATION_PAGE_SIZE), STATION_PAGE_SIZE_MAX)
    const start = (currentPage - 1) * size

    // 包围盒粗筛：只取用户附近一小块内的已启用站点
    const rows = await this.prisma.fuelStation.findMany({
      where: {
        enabled: true,
        latitude: { gte: point.latitude - BOX_HALF_DEG, lte: point.latitude + BOX_HALF_DEG },
        longitude: { gte: point.longitude - BOX_HALF_DEG, lte: point.longitude + BOX_HALF_DEG },
      },
      select: {
        id: true, name: true, brand: true, address: true,
        latitude: true, longitude: true, openingHours: true, price92: true, price95: true,
      },
    })

    const nearby = rows
      .map((row) => ({ ...row, distanceKm: distanceInKm(point, row) }))
      .filter((row) => row.distanceKm <= STATION_SEARCH_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm)

    if (nearby.length > 0) {
      const items: StationItem[] = nearby.map((row) => ({
        id: row.id,
        name: row.name,
        brand: row.brand,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        distanceKm: roundDistanceKm(row.distanceKm),
        openingHours: row.openingHours,
        price92: row.price92,
        price95: row.price95,
      }))
      const paged = items.slice(start, start + size)
      return { items: paged, total: items.length, page: currentPage, pageSize: size, hasMore: start + size < items.length }
    }

    // 附近没有：若全库也为空（尚未同步过 / 同步失败），做一次实时兜底引导（仅 1 次额度）
    const totalRows = await this.prisma.fuelStation.count({ where: { enabled: true } })
    if (totalRows === 0) {
      const live = await this.tencent.fetchPage(point)
      if (live && live.items.length) {
        const mapped = live.items
          .map((station) => ({
            id: 'tx-' + station.id,
            name: station.name,
            brand: station.brand,
            address: station.address,
            latitude: station.latitude,
            longitude: station.longitude,
            distanceKm: roundDistanceKm(distanceInKm(point, station)),
            openingHours: '',
            price92: 0,
            price95: 0,
          }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
        const paged = mapped.slice(start, start + size)
        return { items: paged, total: mapped.length, page: currentPage, pageSize: size, hasMore: start + size < mapped.length }
      }
      // 实时也失败（典型如配额黑窗期）：返回空，避免前端弹出「暂不可用」报错
      return { items: [], total: 0, page: currentPage, pageSize: size, hasMore: false }
    }

    return { items: [], total: 0, page: currentPage, pageSize: size, hasMore: false }
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
