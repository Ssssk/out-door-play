import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DiscoveryCard from './DiscoveryCard.vue'

const base = {
  id: 'liangzihu',
  title: '梁子湖钓点',
  rank: 3,
  rankTag: '野钓热门榜',
  distanceKm: 6.2,
  lengthKm: 12,
  elevationM: null,
  depthM: 8,
  difficulty: '进阶级' as const,
  coverImageUrl: '/v1/uploads/routes/card-fishing-1.jpg',
}

describe('DiscoveryCard', () => {
  it('uses depth metrics for play/fishing records', async () => {
    const item = { ...base, scene: 'play' as const, subType: 'fishing' as const }
    const wrapper = mount(DiscoveryCard, { props: { item } })

    expect(wrapper.text()).toContain('距你 6.2km')
    expect(wrapper.text()).toContain('8M')
    expect(wrapper.text()).toContain('平均水深')
    expect(wrapper.get('[role="button"]').attributes('aria-label')).toContain('距你')
    expect(wrapper.get('.cover').attributes('src')).toContain('/v1/uploads/routes/card-fishing-1.jpg')

    await wrapper.get('[role="button"]').trigger('keyup', { key: 'Enter' })
    expect(wrapper.emitted('click')).toEqual([[item]])
  })

  it('keeps depth metrics for legacy fish responses (new package + old server)', () => {
    const item = { ...base, scene: 'fish' as const }
    const wrapper = mount(DiscoveryCard, { props: { item } })

    expect(wrapper.text()).toContain('8M')
    expect(wrapper.text()).toContain('平均水深')
    expect(wrapper.text()).toContain('鱼获难度')
  })

  it('uses route metrics for drive records', () => {
    const item = { ...base, scene: 'drive' as const, subType: null, elevationM: 220, depthM: null }
    const wrapper = mount(DiscoveryCard, { props: { item } })

    expect(wrapper.text()).toContain('220M')
    expect(wrapper.text()).toContain('路线落差')
    expect(wrapper.text()).toContain('路线长度')
  })

  it('shows destination metrics (门票/开放时间/建议停留) for checkin, not route metrics', async () => {
    const item = { ...base, scene: 'play' as const, subType: 'checkin' as const, elevationM: 220, depthM: null, priceLabel: '免费', bestTime: '全天', durationLabel: '1–2 小时' }
    const wrapper = mount(DiscoveryCard, { props: { item } })

    expect(wrapper.find('.metrics').exists()).toBe(true)
    expect(wrapper.text()).toContain('门票')
    expect(wrapper.text()).toContain('开放时间')
    expect(wrapper.text()).toContain('建议停留')
    expect(wrapper.text()).not.toContain('路线长度')
    expect(wrapper.text()).not.toContain('难度等级')
    await wrapper.get('[role="button"]').trigger('keyup', { key: 'Enter' })
    expect(wrapper.emitted('click')).toEqual([[item]])
  })

  it('shows destination metrics for wash (门票/开放时间/建议停留); 可洗车型仅在详情不在卡片', async () => {
    const item = { ...base, scene: 'wash' as const, subType: null, elevationM: 220, carType: 'SUV/轿车', depthM: null }
    const wrapper = mount(DiscoveryCard, { props: { item } })

    expect(wrapper.find('.metrics').exists()).toBe(true)
    expect(wrapper.text()).toContain('门票')
    expect(wrapper.text()).not.toContain('路线长度')
    expect(wrapper.text()).not.toContain('难度等级')
    expect(wrapper.text()).not.toContain('可洗车型')
  })

  it('shows destination metrics for camping, not route metrics', async () => {
    const item = { ...base, scene: 'play' as const, subType: 'camping' as const, elevationM: 220, depthM: null, priceLabel: '成人 60 元', bestTime: '3–11 月', durationLabel: '过夜' }
    const wrapper = mount(DiscoveryCard, { props: { item } })

    expect(wrapper.find('.metrics').exists()).toBe(true)
    expect(wrapper.text()).toContain('梁子湖钓点')
    expect(wrapper.text()).toContain('门票')
    expect(wrapper.text()).not.toContain('路线长度')
    expect(wrapper.text()).not.toContain('难度等级')
    await wrapper.get('[role="button"]').trigger('keyup', { key: 'Enter' })
    expect(wrapper.emitted('click')).toEqual([[item]])
  })
})
