import type { GeoPoint } from '../../common/geo'

/**
 * 加油站数据源统一抽象。
 *
 * 同步与「库空实时兜底」都只依赖这个接口，具体实现可插拔：
 * - `TencentStationProvider`：腾讯位置服务，受 200 次/日配额限制；
 * - `OsmStationProvider`：OpenStreetMap Overpass，免费、无每日配额。
 *
 * 通过 `STATION_PROVIDER` 环境变量选择，默认 `osm`。
 */
export interface SourceStation {
  /** 数据源内唯一 id（不同源加不同前缀避免冲突，如 `tx-` / `osm-`） */
  id: string
  name: string
  address: string
  /** 由名称/分类推导，识别不出记作「加油站」 */
  brand: string
  latitude: number
  longitude: number
  /** 省级名（用于取省级指导价）；拿不到时留空 */
  province?: string
}

export interface StationPage {
  items: SourceStation[]
  count: number
}

export interface StationProvider {
  /** 为某个城市中心生成若干采样中心点（腾讯因半径受限需多中心，OSM 单中心即可）。 */
  sampleCenters(center: GeoPoint): GeoPoint[]

  /**
   * 取某个中心点附近的加油站。
   * `pageIndex` / `window` 为可选分页参数（腾讯用得到，OSM 单次取全量可忽略）。
   * 失败时返回 null，调用方据此跳过该中心而非报错。
   */
  fetchPage(
    center: GeoPoint,
    opts?: { pageIndex?: number; window?: { offset: number; limit: number }; cityCode?: string },
  ): Promise<StationPage | null>
}

/** Nest 依赖注入令牌：运行时按 `STATION_PROVIDER` 选择具体实现。 */
export const STATION_PROVIDER = Symbol('STATION_PROVIDER')
