import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

/**
 * 「查看完整路线」：驾车轨迹生成与缓存。
 *
 * 流程（2026-10 与产品确认的 V1 方案）：
 * 1. 优先读 `discoveries.route_polyline` 缓存（规划一次永久使用，不重复消耗配额）；
 * 2. 未命中时：高德地理编码把起点/终点文案转 GCJ-02 坐标（终点优先用库内
 *    `end_longitude/end_latitude`，文案仅兜底）→ 驾车路径规划（v3/direction/driving）；
 * 3. 拼接各步骤 polyline 为完整轨迹点串并落库。
 *
 * 注意：
 * - 坐标系全程 GCJ-02，与小程序 `<map>` 组件一致，无需转换；
 * - v3 规划的步骤间坐标存在「维度省略」约定：与上一点相同的经度或纬度用 `-` 占位；
 * - 失败（Key 缺失/网络/编码歧义）一律返回 null，由调用方降级，绝不抛错打断详情页。
 */

export interface RouteLinePoint {
  longitude: number
  latitude: number
}

export interface RouteLine {
  points: RouteLinePoint[]
  distanceKm: number | null
  durationMinutes: number | null
}

interface RouteRow {
  id: string
  cityCode: string
  startPoint: string | null
  endPoint: string | null
  endLongitude: number | null
  endLatitude: number | null
  latitude: number
  longitude: number
  routePolyline: unknown
}

const AMAP_BASE = 'https://restapi.amap.com'
const REQUEST_TIMEOUT_MS = 10_000

type RawRecord = Record<string, unknown>

function asRecord(value: unknown): RawRecord | null {
  return typeof value === 'object' && value !== null ? (value as RawRecord) : null
}
function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

@Injectable()
export class RouteLineService {
  private readonly logger = new Logger(RouteLineService.name)

  constructor(private readonly prisma: PrismaService) {}

  async getOrPlanLine(routeId: string): Promise<RouteLine | null> {
    const route = await this.prisma.discovery.findUnique({
      where: { id: routeId },
      select: {
        id: true, cityCode: true, startPoint: true, endPoint: true,
        endLongitude: true, endLatitude: true, latitude: true, longitude: true,
        routePolyline: true, status: true,
      },
    })
    if (!route || route.status !== 'online') return null

    const cached = this.fromCache(route.routePolyline)
    if (cached) return cached

    const planned = await this.plan(route)
    if (!planned) return null

    try {
      await this.prisma.discovery.update({
        where: { id: route.id },
        data: {
          routePolyline: planned.points.map((p) => [p.longitude, p.latitude]),
          routePlannedAt: new Date(),
        },
      })
    } catch (error) {
      // 缓存写失败不影响本次返回，下次会重新规划
      this.logger.warn(`轨迹缓存写入失败（${route.id}）：${error instanceof Error ? error.message : String(error)}`)
    }
    return planned
  }

  private fromCache(raw: unknown): RouteLine | null {
    if (!Array.isArray(raw) || raw.length < 2) return null
    const points: RouteLinePoint[] = []
    for (const item of raw) {
      if (!Array.isArray(item) || item.length < 2) continue
      const longitude = toNumber(item[0])
      const latitude = toNumber(item[1])
      if (longitude === null || latitude === null) continue
      points.push({ longitude, latitude })
    }
    if (points.length < 2) return null
    return { points, distanceKm: haversineKm(points), durationMinutes: null }
  }

  private async plan(route: RouteRow): Promise<RouteLine | null> {
    const key = (process.env.AMAP_MAP_KEY ?? '').trim()
    if (!key) {
      this.logger.warn('路径规划未启用：AMAP_MAP_KEY 为空')
      return null
    }

    const origin = await this.resolveOrigin(route, key)
    if (!origin) {
      this.logger.warn(`路径规划跳过（${route.id}）：起点坐标解析失败`)
      return null
    }
    const destination = await this.resolveDestination(route, key)
    if (!destination) {
      this.logger.warn(`路径规划跳过（${route.id}）：终点坐标解析失败`)
      return null
    }

    const url =
      `${AMAP_BASE}/v3/direction/driving?key=${encodeURIComponent(key)}` +
      `&origin=${origin.longitude},${origin.latitude}` +
      `&destination=${destination.longitude},${destination.latitude}` +
      `&extensions=base&strategy=0`
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = asRecord(await response.json())
      if (toText(payload?.status) !== '1') {
        throw new Error(`infocode ${toText(payload?.infocode)} ${toText(payload?.info)}`)
      }
      const amapRoute = asRecord(payload?.route)
      const paths = amapRoute && Array.isArray(amapRoute.paths) ? amapRoute.paths : []
      const path = asRecord(paths[0])
      const steps = Array.isArray(path?.steps) ? path.steps : []
      const points: RouteLinePoint[] = []
      for (const step of steps) {
        const polyline = toText(asRecord(step)?.polyline)
        if (polyline) appendPolyline(points, polyline)
      }
      if (points.length < 2) throw new Error('规划结果无有效轨迹点')

      const distanceM = toNumber(path?.distance)
      const durationS = toNumber(path?.duration)
      this.logger.log(`路径规划成功（${route.id}）：${points.length} 点，${distanceM ? Math.round(distanceM) : '?'}m`)
      return {
        points,
        distanceKm: distanceM !== null ? Math.round(distanceM / 100) / 10 : null,
        durationMinutes: durationS !== null ? Math.round(durationS / 60) : null,
      }
    } catch (error) {
      this.logger.warn(`高德路径规划失败（${route.id}）：${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  /** 起点：文案地理编码；失败回落路线主坐标 */
  private async resolveOrigin(route: RouteRow, key: string): Promise<RouteLinePoint | null> {
    if (route.startPoint) {
      const geocoded = await this.geocode(route.startPoint, route.cityCode, key)
      if (geocoded) return geocoded
    }
    return { longitude: route.longitude, latitude: route.latitude }
  }

  /** 终点：优先库内 GCJ-02 坐标，其次终点文案地理编码 */
  private async resolveDestination(route: RouteRow, key: string): Promise<RouteLinePoint | null> {
    if (route.endLongitude !== null && route.endLatitude !== null) {
      return { longitude: route.endLongitude, latitude: route.endLatitude }
    }
    if (route.endPoint) return this.geocode(route.endPoint, route.cityCode, key)
    return null
  }

  /** 高德地理编码：文案 → GCJ-02 坐标（限定城市降低歧义） */
  private async geocode(address: string, cityCode: string, key: string): Promise<RouteLinePoint | null> {
    const url =
      `${AMAP_BASE}/v3/geocode/geo?key=${encodeURIComponent(key)}` +
      `&address=${encodeURIComponent(address)}&city=${encodeURIComponent(cityCode)}`
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = asRecord(await response.json())
      if (toText(payload?.status) !== '1') {
        throw new Error(`infocode ${toText(payload?.infocode)} ${toText(payload?.info)}`)
      }
      const geocodes = Array.isArray(payload?.geocodes) ? payload.geocodes : []
      const location = toText(asRecord(geocodes[0])?.location)
      const [longitude, latitude] = location.split(',').map((part) => Number(part))
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) throw new Error('地理编码无坐标')
      return { longitude, latitude }
    } catch (error) {
      this.logger.warn(`高德地理编码失败（${address}）：${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }
}

/** v3 规划步骤拼接：坐标「维度省略」用 '-' 占位（与上一点相同的经度/纬度），连续重复点去重 */
function appendPolyline(points: RouteLinePoint[], polyline: string): void {
  for (const token of polyline.split(';')) {
    if (!token) continue
    const [rawLng, rawLat] = token.split(',')
    let longitude = Number(rawLng)
    let latitude = Number(rawLat)
    const previous = points.at(-1) ?? null
    if (rawLng === '-' && previous) longitude = previous.longitude
    if (rawLat === '-' && previous) latitude = previous.latitude
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) continue
    if (previous && previous.longitude === longitude && previous.latitude === latitude) continue
    points.push({ longitude, latitude })
  }
}

function haversineKm(points: RouteLinePoint[]): number {
  const R = 6371
  let total = 0
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1]
    const b = points[index]
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180
    const dLng = ((b.longitude - a.longitude) * Math.PI) / 180
    const half =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.latitude * Math.PI) / 180) * Math.cos((b.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    total += 2 * R * Math.asin(Math.sqrt(half))
  }
  return Math.round(total * 10) / 10
}
