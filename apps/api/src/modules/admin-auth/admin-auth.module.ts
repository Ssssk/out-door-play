import { Module } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { AdminAuthController } from './admin-auth.controller'
import { AdminAuthGuard } from './admin-auth.guard'
import { AdminAuthService } from './admin-auth.service'
import { LoginThrottleService } from './login-throttle.service'
import { AdminAuditInterceptor } from './admin-audit.interceptor'

@Module({
  controllers: [AdminAuthController],
  providers: [
    AdminAuthService,
    LoginThrottleService,
    { provide: APP_GUARD, useClass: AdminAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: AdminAuditInterceptor },
  ],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
