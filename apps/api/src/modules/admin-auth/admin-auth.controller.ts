import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { ADMIN_SESSION_ABSOLUTE_MS, ADMIN_SESSION_COOKIE } from './admin-auth.constants'
import { PublicAdminEndpoint } from './admin-auth.decorators'
import { AdminLoginDto } from './admin-auth.dto'
import { AdminAuthService } from './admin-auth.service'
import type { AdminRequestContext } from './admin-auth.types'
import { LoginThrottleService } from './login-throttle.service'
import { isAdminOriginAllowed } from './admin-origin'

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService, private readonly throttle: LoginThrottleService) {}

  @PublicAdminEndpoint()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() input: AdminLoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    if (!isAdminOriginAllowed(request.header('origin'))) {
      throw new ForbiddenException({ message: '请求来源不受信任', code: 'ADMIN_CSRF_INVALID' })
    }
    const key = `${request.ip || 'unknown'}:${input.username.trim().toLowerCase()}`
    this.throttle.assertAllowed(key)
    try {
      const result = await this.auth.login(input.username, input.password, { ip: request.ip, userAgent: request.header('user-agent') })
      this.throttle.clear(key)
      this.setSessionCookie(response, result.token)
      return { actor: result.actor, csrfToken: result.csrfToken }
    } catch (error) {
      this.throttle.recordFailure(key)
      throw error
    }
  }

  @Get('session')
  session(@Req() request: Request & AdminRequestContext) {
    return this.auth.rotateCsrf(request.adminAuth!)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: Request & AdminRequestContext, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.adminAuth!.sessionId)
    response.clearCookie(ADMIN_SESSION_COOKIE, this.cookieOptions())
    return { loggedOut: true }
  }

  private setSessionCookie(response: Response, token: string) {
    response.cookie(ADMIN_SESSION_COOKIE, token, { ...this.cookieOptions(), maxAge: ADMIN_SESSION_ABSOLUTE_MS })
  }

  private cookieOptions() {
    return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/v1/admin' }
  }
}
