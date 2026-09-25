import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { PrismaService } from '../../../database/prisma.service'
import { Prisma } from '../../../generated/prisma/client'
import { IdentityProvider, UserStatus } from '../../../generated/prisma/client'
import { issueMobileTokenPair, providerSubjectHash, tokenHash } from '../domain/identity.crypto'
import type { ExternalIdentity, MobilePrincipal } from '../domain/identity.types'
import { DevIdentityProvider } from '../infrastructure/dev-identity.provider'
import { WechatIdentityProvider } from '../infrastructure/wechat-identity.provider'
import { randomNickname } from '../../../data/nickname-pool'

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wechat: WechatIdentityProvider,
    private readonly dev: DevIdentityProvider,
  ) {}

  async loginWithWechat(code: string, now = new Date()) {
    const key = this.subjectKey()
    return this.createSession(await this.wechat.exchange(code), key, now)
  }

  async loginWithDevIdentity(handle: string, now = new Date()) {
    const identity = this.dev.exchange(handle)
    return this.createSession(identity, this.subjectKey(), now)
  }

  async authenticate(accessToken: string | undefined, now = new Date()): Promise<MobilePrincipal> {
    if (!accessToken) throw this.invalidSession()
    const session = await this.prisma.mobileSession.findUnique({
      where: { accessTokenHash: tokenHash(accessToken) },
      include: { user: true },
    })
    if (!session || session.revokedAt || session.accessExpiresAt <= now || session.refreshExpiresAt <= now || session.user.status !== UserStatus.normal) {
      if (session?.user.status === UserStatus.banned) await this.revokeAllSessions(session.userId, now)
      throw this.invalidSession()
    }
    return { userId: session.userId, sessionId: session.id }
  }

  async refresh(refreshToken: string, now = new Date()) {
    const refreshTokenHash = tokenHash(refreshToken)
    const session = await this.prisma.mobileSession.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    })
    if (!session || session.revokedAt || session.refreshExpiresAt <= now || session.user.status !== UserStatus.normal) {
      if (session?.user.status === UserStatus.banned) await this.revokeAllSessions(session.userId, now)
      throw this.invalidRefresh()
    }

    const pair = issueMobileTokenPair(now)
    const rotated = await this.prisma.mobileSession.updateMany({
      where: {
        id: session.id,
        refreshTokenHash,
        revokedAt: null,
        refreshExpiresAt: { gt: now },
        user: { status: UserStatus.normal },
      },
      data: {
        accessTokenHash: pair.accessTokenHash,
        refreshTokenHash: pair.refreshTokenHash,
        accessExpiresAt: pair.accessExpiresAt,
        refreshExpiresAt: pair.refreshExpiresAt,
      },
    })
    if (rotated.count !== 1) throw this.invalidRefresh()
    return this.sessionResponse(pair, await this.profile(session.userId))
  }

  async logout(sessionId: string, now = new Date()) {
    await this.prisma.mobileSession.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: now } })
    return { revoked: true }
  }

  private async createSession(identity: ExternalIdentity, key: string, now: Date) {
    const pair = issueMobileTokenPair(now)
    const provider = identity.provider === 'wechat' ? IdentityProvider.wechat : IdentityProvider.dev
    const subjectHash = providerSubjectHash(identity.provider, identity.subject, key)

    const userId = await this.prisma.$transaction(async (transaction) => {
      const preferredUser = identity.provider === 'dev'
        ? await transaction.user.findUnique({ where: { id: identity.subject }, select: { id: true } })
        : null
      const newUserId = randomUUID()
      const nickname = await this.pickDefaultNickname(transaction)
      const mapping = await transaction.userIdentity.upsert({
        where: { provider_providerSubjectHash: { provider, providerSubjectHash: subjectHash } },
        update: {},
        create: {
          id: randomUUID(),
          provider,
          providerSubjectHash: subjectHash,
          user: preferredUser
            ? { connect: { id: preferredUser.id } }
            : {
                create: {
                  id: newUserId,
                  avatarUrl: '/static/icons/avatar-mine.png',
                  nickname,
                  status: UserStatus.normal,
                },
              },
        },
        include: { user: true },
      })
      if (mapping.user.status !== UserStatus.normal) throw this.invalidSession()
      await transaction.mobileSession.create({
        data: {
          id: randomUUID(),
          userId: mapping.userId,
          accessTokenHash: pair.accessTokenHash,
          refreshTokenHash: pair.refreshTokenHash,
          accessExpiresAt: pair.accessExpiresAt,
          refreshExpiresAt: pair.refreshExpiresAt,
        },
      })
      return mapping.userId
    })

    return this.sessionResponse(pair, await this.profile(userId))
  }

  /**
   * 注册默认昵称：优先从数据库昵称池随机取一个未使用的潮名（玩车相关）；
   * 若数据库昵称池不可用/为空，则回落到代码内置的 1000 个同款潮名常量，保证一定有、且绝不回落到「户外玩家xxxx」。
   */
  private async pickDefaultNickname(transaction: Prisma.TransactionClient): Promise<string> {
    try {
      const picked = await transaction.$queryRawUnsafe<Array<{ id: string; name: string }>>(
        'SELECT id, name FROM nickname_pool WHERE used = 0 ORDER BY rand() LIMIT 1',
      )
      if (picked.length > 0) {
        await transaction.nicknamePool.update({ where: { id: picked[0].id }, data: { used: true } })
        return picked[0].name
      }
    } catch {
      // 数据库昵称池尚未初始化（未迁移/未 seed）时，使用代码内置常量，不影响注册主流程
    }
    return randomNickname()
  }

  private async profile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { favorites: true } } },
    })
    if (!user || user.status !== UserStatus.normal) throw this.invalidSession()
    return {
      avatarUrl: user.avatarUrl,
      nickname: user.nickname,
      phone: user.phone,
      stats: { mileage: user.mileage, favorites: user._count.favorites, checkins: user.checkins },
    }
  }

  private sessionResponse(pair: ReturnType<typeof issueMobileTokenPair>, profile: Awaited<ReturnType<IdentityService['profile']>>) {
    return {
      tokens: {
        accessToken: pair.accessToken,
        refreshToken: pair.refreshToken,
        accessExpiresAt: pair.accessExpiresAt.toISOString(),
        refreshExpiresAt: pair.refreshExpiresAt.toISOString(),
      },
      profile,
    }
  }

  private subjectKey(): string {
    const key = process.env.IDENTITY_SUBJECT_HMAC_KEY
    if (!key || key.length < 32) {
      throw new ServiceUnavailableException({ code: 'AUTH_PROVIDER_UNAVAILABLE', message: '登录服务尚未正确配置' })
    }
    return key
  }

  private async revokeAllSessions(userId: string, now: Date) {
    await this.prisma.mobileSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } })
  }

  private invalidSession() {
    return new UnauthorizedException({ code: 'AUTH_SESSION_INVALID', message: '登录状态无效或已过期' })
  }

  private invalidRefresh() {
    return new UnauthorizedException({ code: 'AUTH_REFRESH_INVALID', message: '登录状态已失效，请重新登录' })
  }
}
