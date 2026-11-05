import { describe, expect, it } from 'vitest'
import {
  buildChartTooltip, buildPriceChart, CHART_AXIS_BOTTOM, CHART_HEIGHT, CHART_PLOT_LEFT, CHART_PLOT_RIGHT, CHART_WIDTH,
} from './priceChart'

const plotCenter = CHART_PLOT_LEFT + (CHART_WIDTH - CHART_PLOT_LEFT - CHART_PLOT_RIGHT) / 2

describe('buildPriceChart', () => {
  it('无数据时返回空图', () => {
    expect(buildPriceChart([])).toEqual({
      coords: [], lines: [], min: 0, max: 0, yTicks: [], xTicks: [],
    })
  })

  it('只有一期时点居中、不画线，并留出上下价格空间', () => {
    const chart = buildPriceChart([{ date: '2026-11-05', price: 8.85 }])
    expect(chart.coords).toHaveLength(1)
    expect(chart.lines).toHaveLength(0)
    expect(chart.coords[0].x).toBeCloseTo(plotCenter)
    expect(chart.coords[0].y).toBeCloseTo(CHART_HEIGHT / 2)
    expect(chart.min).toBeCloseTo(8.35)
    expect(chart.max).toBeCloseTo(9.35)
    expect(chart.xTicks).toHaveLength(1)
    expect(chart.xTicks[0]).toEqual({ label: '2026-11-05', left: plotCenter, align: 'center' })
  })

  it('多期时价格越高 y 越小（视觉上越高），线段连接相邻两点', () => {
    const chart = buildPriceChart([
      { date: '2026-09-12', price: 8.1 },
      { date: '2026-10-01', price: 8.4 },
      { date: '2026-11-05', price: 8.85 },
    ])
    expect(chart.coords.map((coord) => coord.x)).toEqual([CHART_PLOT_LEFT, plotCenter, CHART_WIDTH - CHART_PLOT_RIGHT])
    expect(chart.coords[0].y).toBeGreaterThan(chart.coords[1].y)
    expect(chart.coords[1].y).toBeGreaterThan(chart.coords[2].y)
    expect(chart.lines).toHaveLength(2)
    expect(chart.lines[0].left).toBe(chart.coords[0].x)
    expect(chart.lines[1].left).toBe(chart.coords[1].x)
    expect(chart.lines[0].angle).toBeLessThan(0)
  })

  it('各期价格全平时也能计算，点位于中线', () => {
    const chart = buildPriceChart([
      { date: '2026-09-12', price: 8.5 },
      { date: '2026-11-05', price: 8.5 },
    ])
    expect(chart.lines).toHaveLength(1)
    expect(chart.coords[0].y).toBeCloseTo(CHART_HEIGHT / 2)
    expect(chart.coords[1].y).toBeCloseTo(CHART_HEIGHT / 2)
  })

  it('纵轴按价格区间等分四条刻度，最高最低刻度贴合折线极值', () => {
    const chart = buildPriceChart([
      { date: '2026-05-09', price: 7.15 },
      { date: '2026-06-20', price: 8.0 },
      { date: '2026-08-04', price: 7.5 },
      { date: '2026-10-30', price: 8.85 },
    ])
    expect(chart.yTicks.map((tick) => tick.label)).toEqual(['8.85', '8.28', '7.72', '7.15'])
    expect(chart.yTicks[0].top).toBeCloseTo(36)
    expect(chart.yTicks[3].top).toBeCloseTo(CHART_AXIS_BOTTOM)
  })

  it('横轴只显示首期、中间期与末期，标签避开左右边界', () => {
    const chart = buildPriceChart([
      { date: '2026-05-09', price: 7.15 },
      { date: '2026-06-20', price: 8.0 },
      { date: '2026-08-04', price: 7.5 },
      { date: '2026-10-30', price: 8.85 },
    ])
    expect(chart.xTicks.map((tick) => tick.label)).toEqual(['2026-05-09', '2026-08-04', '2026-10-30'])
    expect(chart.xTicks.map((tick) => tick.align)).toEqual(['start', 'center', 'end'])
    expect(chart.xTicks[0].left).toBe(chart.coords[0].x)
    expect(chart.xTicks[2].left).toBe(chart.coords[3].x)
  })

  it('点击节点的气泡展示该期价格与日期，贴边时向内收敛', () => {
    const left = buildChartTooltip({ date: '2026-05-09', price: 8.85, x: 10, y: 120 })
    const right = buildChartTooltip({ date: '2026-10-30', price: 7.15, x: 610, y: 120 })
    expect(left).toEqual({ left: 80, top: 44, date: '2026-05-09', price: '8.85' })
    expect(right.left).toBe(CHART_WIDTH - 80)
    expect(right.price).toBe('7.15')
  })

  it('靠近顶部的节点把气泡挂到点的下方', () => {
    const tip = buildChartTooltip({ date: '2026-10-30', price: 8.85, x: 300, y: 36 })
    expect(tip.top).toBe(54)
    expect(tip.date).toBe('2026-10-30')
  })
})
