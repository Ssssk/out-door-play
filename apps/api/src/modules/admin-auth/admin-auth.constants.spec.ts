import { describe, expect, it } from 'vitest'
import { ADMIN_PERMISSIONS, ROLE_PERMISSIONS } from './admin-auth.constants'

describe('admin role permission baseline', () => {
  it('keeps role boundaries explicit and least-privileged', () => {
    expect(ROLE_PERMISSIONS.super_admin).toEqual(ADMIN_PERMISSIONS)
    expect(ROLE_PERMISSIONS.operator).not.toContain('system:write')
    expect(ROLE_PERMISSIONS.content_reviewer).toEqual(['route:read', 'route:audit', 'feed:read', 'feed:audit'])
    expect(ROLE_PERMISSIONS.analyst.every((permission) => permission.endsWith(':read'))).toBe(true)
  })
})
