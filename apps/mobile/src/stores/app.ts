import { defineStore } from 'pinia'
import type { City } from '@/types/domain'

export const useAppStore = defineStore('app', {
  state: () => ({
    city: { code: '420100', name: '武汉' } as City,
  }),
  actions: {
    selectCity(city: City) { this.city = city },
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
