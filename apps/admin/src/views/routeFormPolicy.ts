import type { PlayType, Scene } from '../types/admin'

/**
 * 后台路线表单与提交 payload 的字段策略（CHG-SCENE-EXPANSION-001，2026-11-12 修订）。
 *
 * 露营 / 打卡是「目的地型」内容：只有终点，没有起点，也不记录难度 / 耗时 / 路线长 / 落差 / 车型。
 * 隐藏的字段不进入 payload，服务端也不写入占位值，避免运营没填过却在小程序端显示
 * 「入门级」「待补充」这类假数据。
 */
export interface RouteFormValues {
  title: string; scene: Scene; subType: PlayType | ''; cityCode: string
  difficulty: string; level: string; bestTime: string; durationLabel: string; description: string
  startLng: number | null; startLat: number | null
  lengthKm: number | null; elevationM: number | null; carType: string; startPoint: string; endPoint: string
  endLng: number | null; endLat: number | null
  shoreKm: number | null; depthM: number | null; entryPoint: string; mainArea: string; gear: string
}

export type RoutePayload = Record<string, unknown>

/** 钓鱼专属字段（水深 / 岸线 / 钓具）的判定依据，含历史 fish 记录 */
export function isFishingForm(scene: Scene, subType: PlayType | ''): boolean {
  return (scene === 'play' && subType === 'fishing') || scene === 'fish'
}

/** 目的地型：`wash`、`play + camping`、`play + checkin`；钓鱼与其它场景保持原有路线字段 */
export function isDestinationOnlyForm(scene: Scene, subType: PlayType | ''): boolean {
  return scene === 'wash' || (scene === 'play' && (subType === 'camping' || subType === 'checkin'))
}

export function createEmptyRouteForm(scene: Scene): RouteFormValues {
  return {
    title: '', scene, subType: scene === 'play' ? 'fishing' : '', cityCode: '',
    difficulty: '入门级', level: 'easy', bestTime: '', durationLabel: '', description: '',
    startLng: null, startLat: null,
    lengthKm: null, elevationM: null, carType: '', startPoint: '', endPoint: '', endLng: null, endLat: null,
    shoreKm: null, depthM: null, entryPoint: '', mainArea: '', gear: '',
  }
}

/** 按场景 / 子类型组装 payload：隐藏字段一律不提交（undefined 会被 JSON 序列化丢弃） */
export function buildRoutePayload(form: RouteFormValues): RoutePayload {
  const common: RoutePayload = {
    title: form.title.trim(),
    scene: form.scene,
    subType: form.scene === 'play' ? form.subType : undefined,
    cityCode: form.cityCode,
    description: form.description.trim(),
  }
  const routeAttributes: RoutePayload = {
    difficulty: form.difficulty || '入门级',
    level: form.level || undefined,
    bestTime: form.bestTime,
    durationLabel: form.durationLabel.trim(),
    latitude: form.startLat ?? undefined,
    longitude: form.startLng ?? undefined,
  }

  if (isFishingForm(form.scene, form.subType)) {
    return {
      ...common,
      ...routeAttributes,
      shoreKm: form.shoreKm ?? undefined,
      depthM: form.depthM ?? undefined,
      entryPoint: form.entryPoint.trim(),
      mainArea: form.mainArea.trim(),
      gear: form.gear.trim(),
    }
  }

  if (isDestinationOnlyForm(form.scene, form.subType)) {
    const payload: RoutePayload = { ...common, endPoint: form.endPoint.trim() }
    // 洗车保留「可洗车型」，其余目的地型（露营/打卡）不提交车型
    if (form.scene === 'wash' && form.carType.trim()) payload.carType = form.carType.trim()
    // 未填坐标时不提交任何坐标键，避免服务端收到 0/0 而导航到错误位置
    if (form.endLng !== null && form.endLat !== null) {
      payload.endLongitude = form.endLng
      payload.endLatitude = form.endLat
      // 没有起点：终点坐标同时作为导航坐标与「距你」距离基准
      payload.longitude = form.endLng
      payload.latitude = form.endLat
    }
    return payload
  }

  return {
    ...common,
    ...routeAttributes,
    lengthKm: form.lengthKm ?? undefined,
    elevationM: form.elevationM ?? undefined,
    carType: form.carType.trim(),
    startPoint: form.startPoint.trim(),
    endPoint: form.endPoint.trim(),
    endLongitude: form.endLng ?? undefined,
    endLatitude: form.endLat ?? undefined,
  }
}
