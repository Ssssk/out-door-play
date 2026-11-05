/**
 * 历史油价走势图的坐标计算（纯函数，便于单测）。
 * 小程序不依赖 canvas / SVG：用固定 rpx 尺寸的容器 + 绝对定位的线段与圆点绘制折线，
 * rpx 会随屏幕等比缩放，因此这里算出的角度在各机型上保持一致。
 * 绘图区左侧预留纵轴价格标签，右侧只留边距；坐标轴刻度也在此一并算出。
 */

export interface PricePoint { date: string; price: number }
export interface ChartCoord extends PricePoint { x: number; y: number }
export interface ChartLine { left: number; top: number; width: number; angle: number }
/** 纵轴价格刻度：top 为网格线在绘图区内的 y 坐标 */
export interface YAxisTick { label: string; top: number }
/** 横轴日期刻度：left 为对应数据点的 x 坐标，align 决定标签如何避开边界 */
export interface XAxisTick { label: string; left: number; align: 'start' | 'center' | 'end' }
/** 点击数据点后展示的价格气泡 */
export interface ChartTooltip {
  left: number
  top: number
  date: string
  price: string
}
export interface PriceChart {
  coords: ChartCoord[]
  lines: ChartLine[]
  min: number
  max: number
  yTicks: YAxisTick[]
  xTicks: XAxisTick[]
}

export const CHART_WIDTH = 620
export const CHART_HEIGHT = 260
/** 数据点横向范围：[CHART_PLOT_LEFT, CHART_WIDTH - CHART_PLOT_RIGHT] */
export const CHART_PLOT_LEFT = 92
export const CHART_PLOT_RIGHT = 24
export const CHART_AXIS_LEFT = CHART_PLOT_LEFT - 8
export const CHART_AXIS_BOTTOM = CHART_HEIGHT - 36
const PAD_Y = 36
const Y_TICK_COUNT = 4
const X_TICK_COUNT = 3

/** points 需按调价日期升序传入（接口返回倒序，调用方先 reverse） */
export function buildPriceChart(points: PricePoint[]): PriceChart {
  if (points.length === 0) {
    return { coords: [], lines: [], min: 0, max: 0, yTicks: [], xTicks: [] }
  }
  const prices = points.map((point) => point.price)
  let min = Math.min(...prices)
  let max = Math.max(...prices)
  // 单点或各期价格全平时留出上下空间，避免除以 0 且点贴在容器边缘
  if (min === max) { min -= 0.5; max += 0.5 }
  const innerW = CHART_WIDTH - CHART_PLOT_LEFT - CHART_PLOT_RIGHT
  const innerH = CHART_HEIGHT - PAD_Y * 2
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0
  const coords: ChartCoord[] = points.map((point, index) => ({
    ...point,
    x: CHART_PLOT_LEFT + (points.length > 1 ? index * stepX : innerW / 2),
    y: PAD_Y + (1 - (point.price - min) / (max - min)) * innerH,
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
  // 纵轴按实际价格区间等分，最高/最低刻度与折线极值对齐
  const yTicks: YAxisTick[] = Array.from({ length: Y_TICK_COUNT }, (_, index) => {
    const ratio = index / (Y_TICK_COUNT - 1)
    return {
      label: (max - (max - min) * ratio).toFixed(2),
      top: PAD_Y + ratio * innerH,
    }
  })
  // 横轴最多显示三个日期：首期、中间期、末期，避免 12 期标签挤在一起
  const tickCount = Math.min(X_TICK_COUNT, coords.length)
  const xTicks: XAxisTick[] = Array.from({ length: tickCount }, (_, tick) => {
    const index = tickCount === 1
      ? Math.floor((coords.length - 1) / 2)
      : Math.round(tick * (coords.length - 1) / (tickCount - 1))
    const align: XAxisTick['align'] = tickCount === 1
      ? 'center'
      : tick === 0 ? 'start' : tick === tickCount - 1 ? 'end' : 'center'
    return { label: coords[index].date, left: coords[index].x, align }
  })
  return { coords, lines, min, max, yTicks, xTicks }
}

/** 点击节点后的价格气泡位置：贴边时向内收敛，靠近顶部时改挂到点的下方 */
export function buildChartTooltip(coord: ChartCoord, width = CHART_WIDTH): ChartTooltip {
  const halfBox = 80
  return {
    left: Math.min(Math.max(coord.x, halfBox), width - halfBox),
    top: coord.y < 76 ? coord.y + 18 : coord.y - 76,
    date: coord.date,
    price: coord.price.toFixed(2),
  }
}
