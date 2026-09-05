import type { AdminPermissionCode } from './admin-auth.constants'

export interface AdminActor {
  id: string
  username: string
  displayName: string
  roles: string[]
  permissions: AdminPermissionCode[]
}

export interface AdminAuthContext {
  actor: AdminActor
  sessionId: string
  csrfHash: string
}

export interface AdminRequestContext {
  adminAuth?: AdminAuthContext
}
