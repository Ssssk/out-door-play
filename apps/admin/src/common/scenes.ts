// 后台场景标签单一来源（与服务端 apps/api/src/common/scenes.ts 对齐）。
// 榜单配置只认 3 个业务场景；legacy fish 仅作存量读值标签，不可新建。

export const BUSINESS_SCENES = ['drive', 'play', 'wash'] as const
export type BusinessScene = (typeof BUSINESS_SCENES)[number]

export const SCENE_LABELS: Record<string, string> = {
  drive: '粗门溜车',
  play: '粗门玩玩',
  wash: '粗门洗车',
  // 存量 legacy 钓鱼榜单迁移前的兼容标签
  fish: '钓鱼（旧）',
}

/** 场景中文标签；未知值原样返回（兼容迁移前存量数据） */
export function sceneLabel(value: string): string {
  return SCENE_LABELS[value] ?? value
}
