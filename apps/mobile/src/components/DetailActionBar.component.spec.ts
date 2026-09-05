import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DetailActionBar from './DetailActionBar.vue'

describe('DetailActionBar', () => {
  it('renders server favorite state and emits each user action once', async () => {
    const wrapper = mount(DetailActionBar, {
      props: { favorite: true },
      global: { stubs: { 'wd-icon': true } },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0].classes()).toContain('favorite')

    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    await buttons[2].trigger('click')

    expect(wrapper.emitted('favorite')).toHaveLength(1)
    expect(wrapper.emitted('share')).toHaveLength(1)
    expect(wrapper.emitted('start')).toHaveLength(1)
  })

  it('does not mark the action as favorite when the server state is false', () => {
    const wrapper = mount(DetailActionBar, {
      props: { favorite: false },
      global: { stubs: { 'wd-icon': true } },
    })

    expect(wrapper.get('[aria-label="收藏"]').classes()).not.toContain('favorite')
  })
})
