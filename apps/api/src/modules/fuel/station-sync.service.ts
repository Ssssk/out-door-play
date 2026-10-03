import { Injectable, Logger } from '@nestjs/common'
import { distanceInKm, roundDistanceKm } from '../../common/geo'
import { PrismaService } from '../../database/prisma.service'
import { TencentStationProvider } from './tencent-station.provider'
import type { GeoPoint } from '../../common/geo'
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type { TencentStation } from './tencent-station.provider'

/**
 * 附近加油站的**定时同步**：把腾讯地点搜索的 POI 拉到我们自己的库，用户请求只读库。
 *
 * 为什么不做成请求时实时查询：腾讯**个人开发者 `place/search` 仅 200 次/日**，
 * 且额度由账号下全部 key 共享——实测约 20 次就曾报 `121 每日调用量已达到上限`。
 * 实时查询在真实流量下必然打爆额度；定时同步每天只花几十次调用，且与用户量无关。
 *
 * 生产是单容器（`chumen-api-prod`），所以进程内定时器不会重复执行。
 */

/** 同步写入的行统一带这个前缀，便于识别来源与做安全清理 */
const SYNCED_ID_PREFIX = 'tx-'
/** 城市中心坐标（GCJ-02），仅用作「附近搜索」的采样中心 */
const CITY_CENTERS = new Map<string, readonly [number, number]>([
  ['110000', [39.9042, 116.4074]], // 北京
  ['310000', [31.2304, 121.4737]], // 上海
  ['320100', [32.0603, 118.7969]], // 南京
  ['330100', [30.2741, 120.1551]], // 杭州
  ['420100', [30.5928, 114.3055]], // 武汉
  ['430100', [28.2282, 112.9388]], // 长沙
  ['440100', [23.1291, 113.2644]], // 广州
  ['440300', [22.5431, 114.0579]], // 深圳
  ['500000', [29.563, 106.5516]], // 重庆
  ['510100', [30.5728, 104.0668]], // 成都
])
/**
 * 采样中心偏移（度）：以城市中心为原点做 3×3 采样，±0.08° ≈ ±9km。
 * 腾讯 nearby 的半径上限只有 1000 米，靠多中心采样才能覆盖主城区；
 * 每个中心只取一页（20 条），合计 **9 次调用/城市**。
 */
const CENTER_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [0.08, 0], [-0.08, 0], [0, 0.08], [0, -0.08],
  [0.08, 0.08], [0.08, -0.08], [-0.08, 0.08], [-0.08, -0.08],
]
/** 未配置 `STATION_SYNC_CITIES` 时只同步已开通的城市，避免无谓消耗额度 */
const DEFAULT_CITY_CODES = ['420100']
/**
 * 单次运行的调用预算：守住 200 次/日 的额度并留出余量。
 * 生产同步全部 10 个城市，每城 9 个采样中心 = 90 次调用，故默认需 ≥90；
 * 取 120 留 10 次余量，否则排在最末的重庆/成都永远因超预算被跳过、无法入库。
 */
const DEFAULT_CALL_BUDGET = 120
/** 启动后延迟再跑，避开启动高峰 */
const FIRST_RUN_DELAY_MS = 60 * 1000
const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000
/**
 * 该城市本次至少要取到这么多条，才允许清理未出现的站点。
 * 否则一次额度耗尽会把整城站点清空——这是不可接受的。
 */
const PRUNE_MIN_FETCHED = 20
/** 落库时的回落价；正常展示由省级指导价覆盖 */
const FALLBACK_PRICE = { price92: 8.31, price95: 8.89 }
/** 列宽上限，落库前截断，避免超长 POI 名称把写入打挂 */
const NAME_MAX = 128
const BRAND_MAX = 32
const ADDRESS_MAX = 255

export interface StationSyncSummary {
  /** 实际同步的城市数 */
  cities: number
  /** 实际消耗的腾讯调用次数 */
  calls: number
  /** 去重后取到的 POI 条数 */
  fetched: number
  upserted: number
  removed: number
  /** 本次未执行时的原因 */
  skipped?: string
}

@Injectable()
export class StationSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StationSyncService.name)
  private timer: ReturnType<typeof setTimeout> | null = null
  private running = false

  constructor(
    private readonly prisma: PrismaService,
    private readonly tencent: TencentStationProvider,
  ) {}

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('腾讯站点同步未开启：设置 STATION_SYNC_ENABLED=true 与 TENCENT_MAP_KEY 后启用')
      return
    }
    this.schedule(FIRST_RUN_DELAY_MS)
  }

  onModuleDestroy() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  /** 需要同时满足「显式开启」与「配了 key」，避免本地开发误消耗额度 */
  get enabled(): boolean {
    return process.env.STATION_SYNC_ENABLED?.trim().toLowerCase() === 'true' && this.tencent.enabled
  }

  /** 执行一次同步；可安全重复调用（同一时刻只会有一个在跑） */
  async sync(): Promise<StationSyncSummary> {
    const summary: StationSyncSummary = { cities: 0, calls: 0, fetched: 0, upserted: 0, removed: 0 }
    if (this.running) return { ...summary, skipped: '上一次同步尚未结束' }
    if (!this.tencent.enabled) return { ...summary, skipped: '未配置 TENCENT_MAP_KEY' }

    this.running = true
    const budget = this.callBudget()
    try {
      for (const cityCode of this.cityCodes()) {
        if (summary.calls >= budget) {
          this.logger.warn(`已达本轮调用预算（${budget} 次），剩余城市跳过`)
          break
        }
        summary.cities += 1
        const collected = await this.collectCity(cityCode, budget - summary.calls)
        summary.calls += collected.calls
        summary.fetched += collected.stations.length
        if (collected.stations.length === 0) continue

        summary.upserted += await this.persist(cityCode, collected.stations, collected.center)
        summary.removed += await this.prune(cityCode, collected.stations)
      }
    } finally {
      this.running = false
    }

    this.logger.log(
      `腾讯站点同步完成：城市 ${summary.cities} 个、调用 ${summary.calls} 次、取到 ${summary.fetched} 条、` +
        `写入 ${summary.upserted} 条、清理 ${summary.removed} 条`,
    )
    return summary
  }

  private schedule(delayMs: number) {
    this.timer = setTimeout(() => {
      void this.sync()
        .catch((error: unknown) => this.logger.error(`站点同步异常：${(error as Error).message}`))
        .finally(() => this.schedule(DAILY_INTERVAL_MS))
    }, delayMs)
    // 定时器不应阻止进程退出
    if (typeof this.timer === 'object' && 'unref' in this.timer) this.timer.unref()
  }

  /** 逐个采样中心取一页；某一中心请求失败（多为额度耗尽）就立刻停下，不再浪费调用 */
  private async collectCity(cityCode: string, remainingBudget: number) {
    const center = CITY_CENTERS.get(cityCode)
    const stations = new Map<string, TencentStation>()
    if (!center) return { stations: [] as TencentStation[], calls: 0, center: { latitude: 0, longitude: 0 } }

    const [latitude, longitude] = center
    let calls = 0
    for (const [offsetLat, offsetLng] of CENTER_OFFSETS) {
      if (calls >= remainingBudget) break
      const page = await this.tencent.fetchPage({ latitude: latitude + offsetLat, longitude: longitude + offsetLng })
      calls += 1
      if (!page) break
      // 多个中心会取到重叠的站点，按 POI id 去重
      for (const station of page.items) stations.set(station.id, station)
    }
    return { stations: [...stations.values()], calls, center: { latitude, longitude } }
  }

  private async persist(cityCode: string, stations: TencentStation[], center: GeoPoint): Promise<number> {
    for (const station of stations) {
      const data = {
        id: `${SYNCED_ID_PREFIX}${station.id}`,
        cityCode,
        name: station.name.slice(0, NAME_MAX),
        brand: station.brand.slice(0, BRAND_MAX),
        address: station.address.slice(0, ADDRESS_MAX),
        latitude: station.latitude,
        longitude: station.longitude,
        // 距离在读取时按用户真实坐标重算；这里存「到城市中心」的距离，供无定位时排序
        distanceKm: roundDistanceKm(distanceInKm(center, { latitude: station.latitude, longitude: station.longitude })),
        // 腾讯不提供营业时间
        openingHours: '',
        // 挂牌价正常由省级指导价覆盖，这里只是回落值
        ...FALLBACK_PRICE,
        enabled: true,
      }
      await this.prisma.fuelStation.upsert({ where: { id: data.id }, update: data, create: data })
    }
    return stations.length
  }

  /**
   * 清掉该城市里本次没取到的站点（含早前的手工演示数据）。
   * 这是一次同步「接管」该城市站点台账的语义，但**只在取到的量足够时才清理**，
   * 否则一次额度耗尽或接口异常就会把整城站点清空。
   */
  private async prune(cityCode: string, stations: TencentStation[]): Promise<number> {
    if (stations.length < PRUNE_MIN_FETCHED) {
      this.logger.warn(`${cityCode} 本次仅取到 ${stations.length} 条，跳过清理以免误删`)
      return 0
    }
    const keep = stations.map((station) => `${SYNCED_ID_PREFIX}${station.id}`)
    const result = await this.prisma.fuelStation.deleteMany({ where: { cityCode, id: { notIn: keep } } })
    return result.count
  }

  private cityCodes(): string[] {
    const configured = process.env.STATION_SYNC_CITIES?.split(',').map((code) => code.trim()).filter(Boolean) ?? []
    const codes = configured.length > 0 ? configured : DEFAULT_CITY_CODES
    return codes.filter((code) => CITY_CENTERS.has(code))
  }

  private callBudget(): number {
    const configured = Number(process.env.STATION_SYNC_CALL_BUDGET)
    return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_CALL_BUDGET
  }
}
