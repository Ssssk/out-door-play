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
