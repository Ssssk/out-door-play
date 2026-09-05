import { Module } from '@nestjs/common'
import { IdentityController } from './api/identity.controller'
import { IdentityThrottleService } from './api/identity-throttle.service'
import { MobileAuthGuard } from './api/mobile-auth.guard'
import { IdentityService } from './application/identity.service'
import { DevIdentityProvider } from './infrastructure/dev-identity.provider'
import { WechatIdentityProvider } from './infrastructure/wechat-identity.provider'

@Module({
  controllers: [IdentityController],
  providers: [IdentityService, MobileAuthGuard, IdentityThrottleService, WechatIdentityProvider, DevIdentityProvider],
  exports: [IdentityService, MobileAuthGuard],
})
export class IdentityModule {}
