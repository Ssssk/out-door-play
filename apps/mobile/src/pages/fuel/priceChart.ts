/**
 * 历史油价走势图的坐标计算（纯函数，便于单测）。
 * 小程序不依赖 canvas / SVG：用固定 rpx 尺寸的容器 + 绝对定位的线段与圆点绘制折线，
 * rpx 会随屏幕等比缩放，因此这里算出的角度在各机型上保持一致。
 */

export interface PricePoint { date: string; price: number }
export interface ChartCoord extends PricePoint { x: number; y: number }
export interface ChartLine { left: number; top: number; width: number; angle: number }
export interface PriceChart {
  coords: ChartCoord[]
  lines: ChartLine[]
  min: number
  max: number
}

export const CHART_WIDTH = 620
export const CHART_HEIGHT = 260
const PAD = 40

/** points 需按调价日期升序传入（接口返回倒序，调用方先 reverse） */
export function buildPriceChart(points: PricePoint[]): PriceChart {
  if (points.length === 0) return { coords: [], lines: [], min: 0, max: 0 }
  const prices = points.map((point) => point.price)
  let min = Math.min(...prices)
  let max = Math.max(...prices)
  // 单点或各期价格全平时留出上下空间，避免除以 0 且点贴在容器边缘
  if (min === max) { min -= 0.5; max += 0.5 }
  const innerW = CHART_WIDTH - PAD * 2
  const innerH = CHART_HEIGHT - PAD * 2
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0
  const coords: ChartCoord[] = points.map((point, index) => ({
    ...point,
    x: PAD + (points.length > 1 ? index * stepX : innerW / 2),
    y: PAD + (1 - (point.price - min) / (max - min)) * innerH,
  }))
  const lines: ChartLine[] = coords.slice(1).map((current, index) => {
    const previous = coords[index]
    const dx = current.x - previous.x
    const dy = current.y - previous.y
    return {
      left: previous.x,
      top: previous.y,
      width: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy, dx) * 180 / Math.PI,
    }
  })
  return { coords, lines, min, max }
}
