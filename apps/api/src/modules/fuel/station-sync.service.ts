import { Injectable, Logger, Inject } from '@nestjs/common'
import { distanceInKm, roundDistanceKm } from '../../common/geo'
import { PrismaService } from '../../database/prisma.service'
import type { GeoPoint } from '../../common/geo'
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type { SourceStation, StationProvider } from './station-provider'
import { STATION_PROVIDER } from './station-provider'

/**
 * 附近加油站的**定时同步**：把腾讯地点搜索的 POI 拉到我们自己的库，用户请求只读库。
 *
 * 为什么不做成请求时实时查询：腾讯**个人开发者 `place/search` 仅 200 次/日**，
 * 且额度由账号下全部 key 共享——实测约 20 次就曾报 `121 每日调用量已达到上限`。
 * 实时查询在真实流量下必然打爆额度；定时同步每天只花几十次调用，且与用户量无关。
 *
 * 生产是单容器（`chumen-api-prod`），所以进程内定时器不会重复执行。
 */

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
  ['450200', [24.3255, 109.4155]], // 柳州
])
/** 未配置 `STATION_SYNC_CITIES` 时同步的默认城市：武汉 + 柳州 */
const DEFAULT_CITY_CODES = ['420100', '450200']
/**
 * 单次运行的调用预算：OSM 免费无每日上限，这里仅作礼貌限速，
 * 避免对公共 Overpass 实例造成压力。腾讯作为兜底时每城 9 次，需 ≥99；
 * 取 120 留余量，否则排在末位的城市可能因超预算被跳过、无法入库。
 */
const DEFAULT_CALL_BUDGET = 120
/** 启动后延迟再跑，避开启动高峰 */
const FIRST_RUN_DELAY_MS = 30 * 1000
/**
 * 轮询间隔。数据源已切到免费的 OSM（无每日配额），6 小时一轮既友好又能
 * 在首次同步异常后较快自愈，不必苦等 24 小时。
 */
const DAILY_INTERVAL_MS = 6 * 60 * 60 * 1000
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
    @Inject(STATION_PROVIDER) private readonly provider: StationProvider,
  ) {}

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('加油站站点同步未开启：设置 STATION_SYNC_ENABLED=true 后启用')
      return
    }
    this.schedule(FIRST_RUN_DELAY_MS)
  }

  onModuleDestroy() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  /** 显式开启即运行，不再依赖具体数据源的 key（OSM 无需 key） */
  get enabled(): boolean {
    return process.env.STATION_SYNC_ENABLED?.trim().toLowerCase() === 'true'
  }

  /** 执行一次同步；可安全重复调用（同一时刻只会有一个在跑） */
  async sync(): Promise<StationSyncSummary> {
    const summary: StationSyncSummary = { cities: 0, calls: 0, fetched: 0, upserted: 0, removed: 0 }
    if (this.running) return { ...summary, skipped: '上一次同步尚未结束' }
    if (!this.enabled) return { ...summary, skipped: '加油站同步未开启（STATION_SYNC_ENABLED != true）' }

    this.running = true
    const budget = this.callBudget()
    this.logger.log(
      `[站点同步] 启动：provider=${this.provider.constructor.name}，` +
        `城市=[${this.cityCodes().join(', ')}]，预算=${budget} 次，间隔=${DAILY_INTERVAL_MS / 3_600_000}h`,
    )
    try {
      for (const cityCode of this.cityCodes()) {
        if (summary.calls >= budget) {
          this.logger.warn(`已达本轮调用预算（${budget} 次），剩余城市跳过`)
          break
        }
        summary.cities += 1
        this.logger.log(`[站点同步] ▶ 城市 ${cityCode} 开始采集`)
        const collected = await this.collectCity(cityCode, budget - summary.calls)
        summary.calls += collected.calls
        summary.fetched += collected.stations.length
        this.logger.log(`[站点同步] ◀ 城市 ${cityCode} 完成: 取到 ${collected.stations.length} 条, 调用 ${collected.calls} 次`)
        if (collected.stations.length === 0) {
          this.logger.warn(`[站点同步] 城市 ${cityCode} 取到 0 条（可能百度 provider 未启用/接口失败/IP白名单/SN不匹配）`)
          continue
        }

        summary.upserted += await this.persist(cityCode, collected.stations, collected.center)
        summary.removed += await this.prune(cityCode, collected.stations)
      }
    } finally {
      this.running = false
    }

    this.logger.log(
      `加油站站点同步完成(provider=${this.provider.constructor.name})：城市 ${summary.cities} 个、调用 ${summary.calls} 次、取到 ${summary.fetched} 条、` +
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

  /** 按数据源提供的采样中心逐个取页；某一中心请求失败就跳过，不再浪费调用 */
  private async collectCity(cityCode: string, remainingBudget: number) {
    const center = CITY_CENTERS.get(cityCode)
    const stations = new Map<string, SourceStation>()
    if (!center) return { stations: [] as SourceStation[], calls: 0, center: { latitude: 0, longitude: 0 } }

    const [latitude, longitude] = center
    let calls = 0
    for (const sample of this.provider.sampleCenters({ latitude, longitude })) {
      if (calls >= remainingBudget) break
      const page = await this.provider.fetchPage(sample, { cityCode })
      calls += 1
      if (!page) break
      // 多个中心会取到重叠的站点，按 POI id 去重
      for (const station of page.items) stations.set(station.id, station)
    }
    return { stations: [...stations.values()], calls, center: { latitude, longitude } }
  }

  private async persist(cityCode: string, stations: SourceStation[], center: GeoPoint): Promise<number> {
    for (const station of stations) {
      const data = {
        id: station.id,
        cityCode,
        name: station.name.slice(0, NAME_MAX),
        brand: station.brand.slice(0, BRAND_MAX),
        address: station.address.slice(0, ADDRESS_MAX),
        latitude: station.latitude,
        longitude: station.longitude,
        // 距离在读取时按用户真实坐标重算；这里存「到城市中心」的距离，供无定位时排序
        distanceKm: roundDistanceKm(distanceInKm(center, { latitude: station.latitude, longitude: station.longitude })),
        // 数据源不提供营业时间
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
  private async prune(cityCode: string, stations: SourceStation[]): Promise<number> {
    if (stations.length < PRUNE_MIN_FETCHED) {
      this.logger.warn(`${cityCode} 本次仅取到 ${stations.length} 条，跳过清理以免误删`)
      return 0
    }
    const keep = stations.map((station) => station.id)
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
