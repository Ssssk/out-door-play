import { defineStore } from 'pinia'
import type { GeoPoint } from '@/common/location'
import type { City } from '@/types/domain'

export const useAppStore = defineStore('app', {
  state: () => ({
    city: { code: '420100', name: '武汉' } as City,
    /** 设备定位（GCJ-02），用于计算「距你」真实距离；未授权或获取失败时为 null */
    location: null as GeoPoint | null,
  }),
  actions: {
    selectCity(city: City) { this.city = city },
    setLocation(point: GeoPoint | null) { this.location = point },
  },
  persist: {
    key: 'CHUMEN_APP',
    storage: {
      getItem: (key) => uni.getStorageSync(key) || null,
      setItem: (key, value) => uni.setStorageSync(key, value),
    },
    paths: ['city'],
  },
})
