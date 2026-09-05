import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn(), configure: vi.fn() }))
vi.mock('../api/client', () => ({ apiGet: mocks.apiGet, apiPost: mocks.apiPost, configureAuthTransport: mocks.configure }))

import { useAuthStore } from './auth'

const session = { actor: { id: 'a1', username: 'ops', displayName: '运营', roles: ['operator'], permissions: ['route:read'] }, csrfToken: 'csrf' }

describe('admin auth store', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })

  it('GIVEN cold start 401 WHEN initialize THEN marks anonymous without retry loop', async () => {
    mocks.apiGet.mockRejectedValueOnce(new Error('401'))
    const store = useAuthStore()
    await store.initialize()
    expect(store.initialized).toBe(true)
    expect(store.authenticated).toBe(false)
    expect(mocks.apiGet).toHaveBeenCalledOnce()
  })

  it('GIVEN valid login WHEN apply session THEN actor and CSRF remain in memory transport', async () => {
    mocks.apiPost.mockResolvedValueOnce(session)
    const store = useAuthStore()
    await store.login('ops', 'Correct-Horse-2026!')
    expect(store.actor?.username).toBe('ops')
    expect(store.hasPermission('route:read')).toBe(true)
    expect(mocks.configure).toHaveBeenCalledWith({ csrfToken: 'csrf' })
  })
})
