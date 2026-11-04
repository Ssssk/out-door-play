import { describe, expect, it } from 'vitest'
import { buildPriceChart, CHART_HEIGHT, CHART_WIDTH } from './priceChart'

describe('buildPriceChart', () => {
  it('无数据时返回空图', () => {
    expect(buildPriceChart([])).toEqual({ coords: [], lines: [], min: 0, max: 0 })
  })

  it('只有一期时点居中、不画线，并留出上下价格空间', () => {
    const chart = buildPriceChart([{ date: '2026-11-05', price: 8.85 }])
    expect(chart.coords).toHaveLength(1)
    expect(chart.lines).toHaveLength(0)
    expect(chart.coords[0].x).toBeCloseTo(CHART_WIDTH / 2)
    expect(chart.coords[0].y).toBeCloseTo(CHART_HEIGHT / 2)
    expect(chart.min).toBeCloseTo(8.35)
    expect(chart.max).toBeCloseTo(9.35)
  })

  it('多期时价格越高 y 越小（视觉上越高），线段连接相邻两点', () => {
    const chart = buildPriceChart([
      { date: '2026-09-12', price: 8.1 },
      { date: '2026-10-01', price: 8.4 },
      { date: '2026-11-05', price: 8.85 },
    ])
    expect(chart.coords.map((coord) => coord.x)).toEqual([40, 310, 580])
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
})
