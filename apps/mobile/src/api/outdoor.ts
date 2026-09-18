import { request } from '@/common/request'
import type { City, FavoriteItem, FishingSpot, FuelPrice, FuelStation, RouteCard, RouteDetail, UserProfile, Weather } from '@/types/domain'

export const outdoorApi = {
  cities: () => request<City[]>('/cities'),
  weather: (cityCode: string) => request<Weather>(`/weather/current?cityCode=${encodeURIComponent(cityCode)}`),
  routes: (cityCode: string, scene: 'drive' | 'fish') =>
    request<RouteCard[]>(`/routes?city=${encodeURIComponent(cityCode)}&scene=${encodeURIComponent(scene)}&limit=10`),
  route: (id: string) => request<RouteDetail>(`/routes/${encodeURIComponent(id)}`),
  spot: (id: string) => request<FishingSpot>(`/spots/${encodeURIComponent(id)}`),
  fuelPrices: (cityCode: string) => request<{ items: FuelPrice[]; updatedAt: string }>(`/fuel/prices?cityCode=${cityCode}`),
  fuelStations: () => request<FuelStation[]>('/fuel/stations?lat=30.5&lng=114.4&radius=10000'),
  me: () => request<UserProfile>('/user/me', { auth: 'required' }),
  saveMe: (data: { nickname: string; avatarUrl?: string }) => request<UserProfile>('/user/me', { method: 'PATCH', data, auth: 'required' }),
  favorites: (scene: 'drive' | 'fish') => request<FavoriteItem[]>(`/user/favorites?scene=${scene}`, { auth: 'required' }),
  addFavorite: (discoveryId: string) => request<{ discoveryId: string; favorited: true }>('/user/favorites', { method: 'POST', data: { discoveryId }, auth: 'required' }),
  removeFavorite: (discoveryId: string) => request<{ discoveryId: string; favorited: false }>(`/user/favorites/${encodeURIComponent(discoveryId)}`, { method: 'DELETE', auth: 'required' }),
}
