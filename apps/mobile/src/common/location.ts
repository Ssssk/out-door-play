/**
 * 定位与「距你」距离工具。
 *
 * 设备定位使用 GCJ-02（与后端/高德坐标系一致），失败或未授权时返回 null，
 * 此时调用方回落到接口或本地数据自带的 distanceKm。
 */

export interface GeoPoint {
  latitude: number
  longitude: number
}

/** 任意带坐标与兜底距离的条目（路线卡片、钓点、加油站等）。 */
export interface GeoLocated {
  latitude?: number | null
  longitude?: number | null
  distanceKm?: number | null
}

const EARTH_RADIUS_KM = 6371
const MAX_REASONABLE_KM = 20000

let cachedPoint: GeoPoint | null = null
let pendingRequest: Promise<GeoPoint | null> | null = null

function toFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function toPoint(latitude: unknown, longitude: unknown): GeoPoint | null {
  const lat = toFiniteNumber(latitude)
  const lng = toFiniteNumber(longitude)
  if (lat === null || lng === null) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { latitude: lat, longitude: lng }
}

function isValidPoint(point: GeoPoint | null | undefined): point is GeoPoint {
  return toPoint(point?.latitude, point?.longitude) !== null
}

/**
 * 读取设备定位。同一会话内只请求一次并复用结果（含并发去重），
 * 用户拒绝授权、超出可用范围或非小程序环境时返回 null。
 */
export function getCurrentLocation(refresh = false): Promise<GeoPoint | null> {
  if (cachedPoint && !refresh) return Promise.resolve(cachedPoint)
  if (pendingRequest) return pendingRequest

  const request = new Promise<GeoPoint | null>((resolve) => {
    try {
      uni.getLocation({
        type: 'gcj02',
        success: (result) => resolve(toPoint(result.latitude, result.longitude)),
        fail: () => resolve(null),
      })
    } catch {
      resolve(null)
    }
  }).then((point) => {
    cachedPoint = point
    pendingRequest = null
    return point
  })

  pendingRequest = request
  return request
}

/** 清空定位缓存，用于需要重新定位的场景。 */
export function clearLocationCache() {
  cachedPoint = null
  pendingRequest = null
}

/** 两点间的球面距离（公里）。 */
export function distanceInKm(from: GeoPoint, to: GeoPoint): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const halfLat = Math.sin(toRad(to.latitude - from.latitude) / 2)
  const halfLng = Math.sin(toRad(to.longitude - from.longitude) / 2)
  const value = halfLat * halfLat + halfLng * halfLng * Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude))
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(value)))
}

/**
 * 解析条目展示用的距离：优先用设备定位实算，其次回落到数据自带距离。
 * 两者都不可用时返回 null（界面显示「-」）。
 */
export function resolveDistanceKm(item: GeoLocated, point?: GeoPoint | null): number | null {
  const target = toPoint(item.latitude, item.longitude)
  // 后台创建的路线可能未填坐标（落库为 0,0），视同无坐标，不计算跨洋距离
  if (isValidPoint(point) && target && !(target.latitude === 0 && target.longitude === 0)) {
    const distance = distanceInKm(point, target)
    if (Number.isFinite(distance) && distance <= MAX_REASONABLE_KM) return distance
  }
  return toFiniteNumber(item.distanceKm)
}

/** 返回带真实距离的条目副本；无定位或距离未变化时原样返回。 */
export function withRealDistance<T extends GeoLocated>(item: T, point?: GeoPoint | null): T {
  const distance = resolveDistanceKm(item, point)
  if (distance === null || distance === item.distanceKm) return item
  return { ...item, distanceKm: distance }
}

/** 距离数值文案：保留 1 位小数，小于 1 公里显示 `<1`，不可用时显示 `-`。 */
export function formatDistanceKm(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '-'
  if (value < 1) return '<1'
  return value.toFixed(1)
}
