export interface GeoPoint {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_KM = 6371

/** 解析查询串里的坐标，缺失或非法时返回 null。 */
export function parseGeoPoint(lat?: string, lng?: string): GeoPoint | null {
  if (!lat || !lng) return null
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  return { latitude, longitude }
}

/** 两点间球面距离（公里）。 */
export function distanceInKm(from: GeoPoint, to: GeoPoint): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const halfLat = Math.sin(toRad(to.latitude - from.latitude) / 2)
  const halfLng = Math.sin(toRad(to.longitude - from.longitude) / 2)
  const value = halfLat * halfLat + halfLng * halfLng * Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude))
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(value)))
}

/** 距离保留 1 位小数，与公开接口口径一致。 */
export function roundDistanceKm(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * WGS-84 → GCJ-02（国测局火星坐标）偏移。
 *
 * 高德/腾讯坐标均为 GCJ-02；OpenStreetMap 原始坐标为 WGS-84。
 * 库里既有站点（腾讯）按 GCJ-02 存储，"距你"距离也是在该坐标系下计算，
 * 故 OSM 抓取的坐标必须转换到 GCJ-02 再入库，否则"距你"会整体偏移数百米。
 */
const GCJ_A = 6378245.0
const GCJ_EE = 0.00669342162296594

function outOfChina(latitude: number, longitude: number): boolean {
  return !(longitude > 73.66 && longitude < 135.05 && latitude > 3.86 && latitude < 53.55)
}

function transformLat(x: number, y: number): number {
  let ret = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3
  ret += ((20 * Math.sin(y * Math.PI) + 40 * Math.sin((y / 3) * Math.PI)) * 2) / 3
  ret += ((160 * Math.sin((y / 12) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30)) * 2) / 3
  return ret
}

function transformLng(x: number, y: number): number {
  let ret = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3
  ret += ((20 * Math.sin(x * Math.PI) + 40 * Math.sin((x / 3) * Math.PI)) * 2) / 3
  ret += ((150 * Math.sin((x / 12) * Math.PI) + 300 * Math.sin((x / 30) * Math.PI)) * 2) / 3
  return ret
}

/** 把 WGS-84 坐标转换为 GCJ-02；中国境外坐标原样返回（无需偏移）。 */
export function wgs84ToGcj02(point: GeoPoint): GeoPoint {
  if (outOfChina(point.latitude, point.longitude)) return point
  const dLat = transformLat(point.longitude - 105, point.latitude - 35)
  const dLng = transformLng(point.longitude - 105, point.latitude - 35)
  const radLat = (point.latitude / 180) * Math.PI
  const magic = 1 - GCJ_EE * Math.sin(radLat) * Math.sin(radLat)
  const sqrtMagic = Math.sqrt(magic)
  const adjustLat = (dLat * 180) / (((GCJ_A * (1 - GCJ_EE)) / sqrtMagic) * Math.PI)
  const adjustLng = (dLng * 180) / ((GCJ_A / sqrtMagic) * Math.cos(radLat) * Math.PI)
  return { latitude: point.latitude + adjustLat, longitude: point.longitude + adjustLng }
}

/**
 * BD-09（百度坐标系）→ GCJ-02。
 *
 * 百度接口返回的坐标均为 BD-09，必须转回库内统一的 GCJ-02 再入库，
 * 否则「距你」距离会整体偏移数百米~1 公里，与高德/腾讯/OSM 数据对不齐。
 */
const BD_X_PI = (Math.PI * 3000) / 180

export function bd09ToGcj02(point: GeoPoint): GeoPoint {
  const x = point.longitude - 0.0065
  const y = point.latitude - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * BD_X_PI)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * BD_X_PI)
  const longitude = z * Math.cos(theta)
  const latitude = z * Math.sin(theta)
  return { latitude, longitude }
}

/** GCJ-02 → BD-09（备用：若将来需要把 GCJ-02 坐标发给百度 `location` 接口）。 */
export function gcj02ToBd09(point: GeoPoint): GeoPoint {
  const x = point.longitude
  const y = point.latitude
  const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * BD_X_PI)
  const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * BD_X_PI)
  const longitude = z * Math.cos(theta) + 0.0065
  const latitude = z * Math.sin(theta) + 0.006
  return { latitude, longitude }
}
