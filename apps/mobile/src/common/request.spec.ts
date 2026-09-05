import { afterEach, describe, expect, it, vi } from 'vitest'
import { installAuthSessionAdapter, resetAuthSessionAdapter } from './authSession'
import { ApiError, request } from './request'

afterEach(() => {
  resetAuthSessionAdapter()
  vi.unstubAllGlobals()
})

describe('authenticated request behavior', () => {
  it('refreshes and replays a GET once after 401', async () => {
    const refreshAccessToken = vi.fn().mockResolvedValue('new-access')
    installAuthSessionAdapter({
      prepareAccessToken: vi.fn().mockResolvedValue('old-access'),
      refreshAccessToken,
      clearSession: vi.fn(),
    })
    const requestMock = vi.fn()
      .mockImplementationOnce((options) => options.success({
        statusCode: 401,
        data: { code: 'AUTH_SESSION_INVALID', message: 'expired', data: null },
      }))
      .mockImplementationOnce((options) => options.success({
        statusCode: 200,
        data: { code: 0, message: 'ok', data: { id: 'profile' } },
      }))
    vi.stubGlobal('uni', { request: requestMock })

    await expect(request<{ id: string }>('/user/me', { auth: 'required' })).resolves.toEqual({ id: 'profile' })
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(requestMock).toHaveBeenCalledTimes(2)
    expect(requestMock.mock.calls[1][0].header.Authorization).toBe('Bearer new-access')
  })

  it('never replays a write after 401 and clears the session', async () => {
    const refreshAccessToken = vi.fn()
    const clearSession = vi.fn()
    installAuthSessionAdapter({
      prepareAccessToken: vi.fn().mockResolvedValue('old-access'),
      refreshAccessToken,
      clearSession,
    })
    const requestMock = vi.fn((options) => options.success({
      statusCode: 401,
      data: { code: 'AUTH_SESSION_INVALID', message: 'expired', data: null },
    }))
    vi.stubGlobal('uni', { request: requestMock })

    await expect(request('/user/me', { method: 'PATCH', data: { nickname: 'new' }, auth: 'required' }))
      .rejects.toBeInstanceOf(ApiError)
    expect(requestMock).toHaveBeenCalledTimes(1)
    expect(refreshAccessToken).not.toHaveBeenCalled()
    expect(clearSession).toHaveBeenCalledTimes(1)
  })
})
