import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DiscoveryCard from './DiscoveryCard.vue'

describe('DiscoveryCard', () => {
  it('labels distance as reference data and uses depth for fishing metrics', async () => {
    const item = {
      id: 'liangzihu',
      scene: 'fish' as const,
      title: '梁子湖钓点',
      rank: 3,
      rankTag: '野钓热门榜',
      distanceKm: 6.2,
      lengthKm: 12,
      elevationM: null,
      depthM: 8,
      difficulty: '进阶级' as const,
      coverImageUrl: '/cover.jpg',
    }
    const wrapper = mount(DiscoveryCard, { props: { item } })

    expect(wrapper.text()).toContain('距你 6.2km')
    expect(wrapper.text()).toContain('8M')
    expect(wrapper.text()).toContain('平均水深')
    expect(wrapper.get('[role="button"]').attributes('aria-label')).toContain('距你')

    await wrapper.get('[role="button"]').trigger('keyup', { key: 'Enter' })
    expect(wrapper.emitted('click')).toEqual([[item]])
  })
})
