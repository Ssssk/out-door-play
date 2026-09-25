export const ADMIN_SESSION_COOKIE = 'admin_session'
export const ADMIN_SESSION_IDLE_MS = 2 * 60 * 60 * 1_000
export const ADMIN_SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1_000
export const ADMIN_SESSION_TOUCH_MS = 5 * 60 * 1_000
export const ADMIN_LOGIN_MAX_FAILURES = 5
export const ADMIN_LOGIN_LOCK_MS = 15 * 60 * 1_000

export const ADMIN_PERMISSIONS = [
  'route:read', 'route:edit', 'route:audit', 'route:shelf',
  'ranking:read', 'ranking:write', 'city:read', 'city:write',
  'fuel:read', 'fuel:write', 'user:read', 'user:ban',
  'feed:read', 'feed:audit', 'analytics:read', 'report:read',
  'report:write', 'system:write', 'config:read', 'config:write',
] as const

export type AdminPermissionCode = typeof ADMIN_PERMISSIONS[number]

export const ROLE_PERMISSIONS: Record<string, readonly AdminPermissionCode[]> = {
  analyst: ['route:read', 'ranking:read', 'city:read', 'fuel:read', 'user:read', 'feed:read', 'analytics:read', 'report:read', 'config:read'],
  content_reviewer: ['route:read', 'route:audit', 'feed:read', 'feed:audit'],
  operator: ADMIN_PERMISSIONS.filter((permission) => permission !== 'system:write'),
  super_admin: ADMIN_PERMISSIONS,
}
