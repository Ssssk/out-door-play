import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { IdentityService } from '../application/identity.service'
import type { MobileAuthenticatedRequest } from '../domain/identity.types'
import { DevLoginDto, RefreshMobileSessionDto, WechatLoginDto } from './identity.dto'
import { IdentityThrottleService } from './identity-throttle.service'
import { MobileAuthGuard } from './mobile-auth.guard'

@ApiTags('mobile-identity')
@Controller('auth')
export class IdentityController {
  constructor(private readonly identity: IdentityService, private readonly throttle: IdentityThrottleService) {}

  @Post('wechat/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'loginWithWechat' })
  loginWithWechat(@Body() input: WechatLoginDto, @Req() request: Request) {
    this.throttle.consume(`${request.ip || 'unknown'}:wechat`)
    return this.identity.loginWithWechat(input.code)
  }

  @Post('dev/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'loginWithDevIdentity' })
  loginWithDevIdentity(@Body() input: DevLoginDto, @Req() request: Request) {
    this.throttle.consume(`${request.ip || 'unknown'}:dev`)
    return this.identity.loginWithDevIdentity(input.handle)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'refreshMobileSession' })
  refresh(@Body() input: RefreshMobileSessionDto, @Req() request: Request) {
    this.throttle.consume(`${request.ip || 'unknown'}:refresh`)
    return this.identity.refresh(input.refreshToken)
  }

  @ApiBearerAuth('mobileBearer')
  @UseGuards(MobileAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'logoutMobileSession' })
  logout(@Req() request: MobileAuthenticatedRequest) {
    return this.identity.logout(request.mobileAuth.sessionId)
  }
}
