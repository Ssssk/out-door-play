import { BadRequestException, Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { distanceInKm, roundDistanceKm } from '../../common/geo'
import { FUEL_GRADES, ProvinceFuelPriceProvider, regionFromCityCode } from './province-price.provider'
import { STATION_PAGE_SIZE, STATION_PAGE_SIZE_MAX } from './fuel.dto'
import type { GeoPoint } from '../../common/geo'
import type { ProvinceFuelPrice } from './province-price.provider'
import type { StationProvider } from './station-provider'
import { STATION_PROVIDER } from './station-provider'

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
  /** 城市兜底场景下用户坐标离该城市很远，距你无意义，置空由前端显示「-」 */
  distanceKm: number | null
  openingHours: string
  price92: number
  price95: number
}

@Injectable()
export class FuelService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STATION_PROVIDER) private readonly stationProvider: StationProvider,
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

  /**
   * 用户坐标检索附近加油站：读库优先，实时兜底。
   * 当坐标附近没有、但所选城市已同步过站点时，兜底返回该城市全部站点（fallback: 'city'），
   * 避免用户在非覆盖区 / 测试定位时永远看到空白。
   */
  async stations(point?: GeoPoint | null, page = 1, pageSize = STATION_PAGE_SIZE, cityCode?: string) {
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
        id: true, name: true, brand: true, address: true, cityCode: true,
        latitude: true, longitude: true, openingHours: true, price92: true, price95: true,
      },
    })

    const nearby = rows
      .map((row) => ({ ...row, distanceKm: distanceInKm(point, row) }))
      .filter((row) => row.distanceKm <= STATION_SEARCH_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm)

    if (nearby.length > 0) {
      // 挂牌价统一覆盖为省级指导价（同省同价）；拉取失败保留库内回落价
      const override = await this.provincePriceOverride(cityCode ?? nearby[0]?.cityCode)
      const items: StationItem[] = nearby.map((row) => ({
        id: row.id,
        name: row.name,
        brand: row.brand,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        distanceKm: roundDistanceKm(row.distanceKm),
        openingHours: row.openingHours,
        price92: override?.price92 ?? row.price92,
        price95: override?.price95 ?? row.price95,
      }))
      const paged = items.slice(start, start + size)
      return { items: paged, total: items.length, page: currentPage, pageSize: size, hasMore: start + size < items.length }
    }

    // 附近没有：若全库也为空（尚未同步过 / 同步失败），做一次实时兜底引导（仅 1 次额度）
    const totalRows = await this.prisma.fuelStation.count({ where: { enabled: true } })
    if (totalRows === 0) {
      const live = await this.stationProvider.fetchPage(point)
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

    // 全库有数据但用户坐标附近没有：兜底展示其「所选城市」的站点，避免永远空白。
    // 距离按用户真实坐标算会很大，故 distanceKm 置空，前端显示「-」并提示城市口径。
    if (cityCode) {
      const rows = await this.prisma.fuelStation.findMany({
        where: { enabled: true, cityCode },
        select: { id: true, name: true, brand: true, address: true, latitude: true, longitude: true, openingHours: true, price92: true, price95: true },
        orderBy: { name: 'asc' },
      })
      if (rows.length) {
        const override = await this.provincePriceOverride(cityCode)
        const items: StationItem[] = rows.map((row) => ({
          id: row.id,
          name: row.name,
          brand: row.brand,
          address: row.address,
          latitude: row.latitude,
          longitude: row.longitude,
          distanceKm: null,
          openingHours: row.openingHours,
          price92: override?.price92 ?? row.price92,
          price95: override?.price95 ?? row.price95,
        }))
        const paged = items.slice(start, start + size)
        return { items: paged, total: items.length, page: currentPage, pageSize: size, hasMore: start + size < items.length, fallback: 'city' as const }
      }
    }

    return { items: [], total: 0, page: currentPage, pageSize: size, hasMore: false }
  }

  private async fetchProvincePrice(cityCode: string): Promise<ProvinceFuelPrice | null> {
    const region = regionFromCityCode(cityCode)
    return region ? this.provincePrice.fetchByRegion(region) : null
  }

  /**
   * 站点挂牌价的省级指导价覆盖值（92/95）。
   * 库内 price92/95 只是同步落库时的回落值；省级源失败或无该省数据时返回 null，保留库内值。
   */
  private async provincePriceOverride(cityCode?: string | null): Promise<{ price92: number; price95: number } | null> {
    if (!cityCode) return null
    const province = await this.fetchProvincePrice(cityCode).catch(() => null)
    if (!province) return null
    const price92 = province.items.find((item) => item.grade === FUEL_GRADES.gasoline92)?.price
    const price95 = province.items.find((item) => item.grade === FUEL_GRADES.gasoline95)?.price
    return price92 && price95 ? { price92, price95 } : null
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
