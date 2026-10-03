import type { GeoPoint } from '@/common/location'
import { request, uploadFile } from '@/common/request'
import type { City, FavoriteItem, FishingSpot, FuelPrice, FuelPriceSource, FuelStationPage, RouteCard, RouteDetail, UserProfile, Weather } from '@/types/domain'

export const outdoorApi = {
  cities: () => request<City[]>('/cities'),
  weather: (cityCode: string) => request<Weather>(`/weather/current?cityCode=${encodeURIComponent(cityCode)}`),
  routes: (cityCode: string, scene: 'drive' | 'fish') =>
    request<RouteCard[]>(`/routes?city=${encodeURIComponent(cityCode)}&scene=${encodeURIComponent(scene)}&limit=10`),
  route: (id: string) => request<RouteDetail>(`/routes/${encodeURIComponent(id)}`),
  spot: (id: string) => request<FishingSpot>(`/spots/${encodeURIComponent(id)}`),
  // region 仅在 source 为 province 时返回，用于界面标注「XX省参考价」
  fuelPrices: (cityCode: string) =>
    request<{ items: FuelPrice[]; updatedAt: string; source: FuelPriceSource; region?: string }>(`/fuel/prices?cityCode=${cityCode}`),
  // 传入设备定位坐标时，服务端按真实位置计算距离、由近到远排序后分页返回；
  // cityCode 用于「附近无站点」时兜底返回该城市站点（避免永远空白）
  fuelStations: (point?: GeoPoint | null, page = 1, cityCode?: string) =>
    request<FuelStationPage>(`/fuel/stations?${point ? `lat=${point.latitude}&lng=${point.longitude}&` : ''}page=${page}${cityCode ? `&cityCode=${cityCode}` : ''}`, { timeout: 20000 }),
  me: () => request<UserProfile>('/user/me', { auth: 'required' }),
  // 运营后台「上传二维码」配置；未配置时返回空串，页面回退默认入口
  qrcodes: () => request<{ fanGroup: string; contact: string; fanGroupAt: string | null; contactAt: string | null }>('/config/qrcodes'),
  // 微信小程序 wx.request 不支持 PATCH（会直接 fail 成网络错误），故走服务端保留的 POST /user/me 兼容入口
  saveMe: (data: { nickname: string; avatarUrl?: string; phone?: string }) => request<UserProfile>('/user/me', { method: 'POST', data, auth: 'required' }),
  uploadAvatar: (filePath: string) => uploadFile<UserProfile>('/user/avatar', filePath),
  favorites: (scene: 'drive' | 'fish') => request<FavoriteItem[]>(`/user/favorites?scene=${scene}`, { auth: 'required' }),
  addFavorite: (discoveryId: string) => request<{ discoveryId: string; favorited: true }>('/user/favorites', { method: 'POST', data: { discoveryId }, auth: 'required' }),
  removeFavorite: (discoveryId: string) => request<{ discoveryId: string; favorited: false }>(`/user/favorites/${encodeURIComponent(discoveryId)}`, { method: 'DELETE', auth: 'required' }),
}
