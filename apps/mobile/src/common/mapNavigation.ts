export interface NavigationTarget { latitude: number; longitude: number; name: string; address?: string }

export function openNavigation(target: NavigationTarget) {
  return new Promise<void>((resolve, reject) => {
    uni.openLocation({
      latitude: target.latitude, longitude: target.longitude, name: target.name,
      address: target.address || target.name, scale: 16, success: () => resolve(), fail: reject,
    })
  })
}
