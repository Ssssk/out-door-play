import { Injectable, UnauthorizedException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { PrismaService } from '../../database/prisma.service'
import {
  ADMIN_LOGIN_LOCK_MS,
  ADMIN_LOGIN_MAX_FAILURES,
  ADMIN_SESSION_ABSOLUTE_MS,
  ADMIN_SESSION_IDLE_MS,
  ADMIN_SESSION_TOUCH_MS,
  type AdminPermissionCode,
} from './admin-auth.constants'
import { consumePasswordCost, randomToken, safeHashEquals, sha256, verifyAdminPassword } from './admin-auth.crypto'
import type { AdminActor, AdminAuthContext } from './admin-auth.types'

interface ClientMetadata { ip?: string; userAgent?: string }

@Injectable()
export class AdminAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(usernameInput: string, password: string, metadata: ClientMetadata, now = new Date()) {
    const username = usernameInput.trim().toLowerCase()
    const admin = await this.prisma.adminUser.findUnique({
      where: { username },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    })

    if (!admin) {
      await consumePasswordCost(password)
      throw this.invalidCredentials()
    }

    if (admin.status !== 'active' || (admin.lockedUntil && admin.lockedUntil > now)) {
      await consumePasswordCost(password)
      throw this.invalidCredentials()
    }

    const validPassword = await verifyAdminPassword(password, admin.passwordHash)
    if (!validPassword) {
      const failedLoginCount = admin.failedLoginCount + 1
      await this.prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginCount: { increment: 1 },
          lockedUntil: failedLoginCount >= ADMIN_LOGIN_MAX_FAILURES ? new Date(now.getTime() + ADMIN_LOGIN_LOCK_MS) : null,
        },
      })
      throw this.invalidCredentials()
    }

    const token = randomToken()
    const csrfToken = randomToken()
    const absoluteExpiresAt = new Date(now.getTime() + ADMIN_SESSION_ABSOLUTE_MS)
    await this.prisma.$transaction([
      this.prisma.adminUser.update({ where: { id: admin.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now } }),
      this.prisma.adminSession.create({
        data: {
          id: randomUUID(),
          adminUserId: admin.id,
          tokenHash: sha256(token),
          csrfHash: sha256(csrfToken),
          idleExpiresAt: new Date(now.getTime() + ADMIN_SESSION_IDLE_MS),
          absoluteExpiresAt,
          lastSeenAt: now,
          ipHash: metadata.ip ? sha256(metadata.ip) : null,
          userAgentHash: metadata.userAgent ? sha256(metadata.userAgent) : null,
        },
      }),
    ])

    return { token, csrfToken, absoluteExpiresAt, actor: this.toActor(admin) }
  }

  async authenticate(token: string | undefined, now = new Date()): Promise<AdminAuthContext> {
    if (!token) throw this.invalidSession()
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: sha256(token) },
      include: { adminUser: { include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } } },
    })
    if (!session || session.revokedAt || session.idleExpiresAt <= now || session.absoluteExpiresAt <= now || session.adminUser.status !== 'active') {
      throw this.invalidSession()
    }

    if (now.getTime() - session.lastSeenAt.getTime() >= ADMIN_SESSION_TOUCH_MS) {
      const nextIdle = new Date(Math.min(now.getTime() + ADMIN_SESSION_IDLE_MS, session.absoluteExpiresAt.getTime()))
      await this.prisma.adminSession.update({ where: { id: session.id }, data: { lastSeenAt: now, idleExpiresAt: nextIdle } })
    }

    return { actor: this.toActor(session.adminUser), sessionId: session.id, csrfHash: session.csrfHash }
  }

  async rotateCsrf(context: AdminAuthContext) {
    const csrfToken = randomToken()
    await this.prisma.adminSession.update({ where: { id: context.sessionId }, data: { csrfHash: sha256(csrfToken) } })
    return { actor: context.actor, csrfToken }
  }

  async logout(sessionId: string, now = new Date()) {
    await this.prisma.adminSession.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: now } })
    return { loggedOut: true }
  }

  verifyCsrf(value: string | undefined, expectedHash: string): boolean {
    return Boolean(value && safeHashEquals(value, expectedHash))
  }

  async revokeAllSessions(adminUserId: string, now = new Date()) {
    return this.prisma.adminSession.updateMany({ where: { adminUserId, revokedAt: null }, data: { revokedAt: now } })
  }

  private toActor(admin: {
    id: string
    username: string
    displayName: string
    roles: Array<{ role: { code: string; permissions: Array<{ permission: { code: string } }> } }>
  }): AdminActor {
    const roles = admin.roles.map(({ role }) => role.code).sort()
    const permissions = [...new Set(admin.roles.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.code)))].sort() as AdminPermissionCode[]
    return { id: admin.id, username: admin.username, displayName: admin.displayName, roles, permissions }
  }

  private invalidCredentials() {
    return new UnauthorizedException({ message: '用户名或密码错误', code: 'ADMIN_AUTH_FAILED' })
  }

  private invalidSession() {
    return new UnauthorizedException({ message: '管理员会话无效或已过期', code: 'ADMIN_SESSION_INVALID' })
  }
}
