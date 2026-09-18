import { Module } from '@nestjs/common'
import { TraceMiddleware } from './common/trace.middleware'
import { HealthModule } from './modules/health/health.module'
import { CitiesModule } from './modules/cities/cities.module'
import { RoutesModule } from './modules/routes/routes.module'
import { FuelModule } from './modules/fuel/fuel.module'
import { WeatherModule } from './modules/weather/weather.module'
import { UserModule } from './modules/user/user.module'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { AdminModule } from './modules/admin/admin.module'
import type { MiddlewareConsumer, NestModule } from '@nestjs/common'
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module'
import { IdentityModule } from './modules/identity/identity.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.development'] }),
    DatabaseModule,
    AdminAuthModule,
    IdentityModule,
    HealthModule,
    CitiesModule,
    RoutesModule,
    FuelModule,
    WeatherModule,
    UserModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) { consumer.apply(TraceMiddleware).forRoutes('{*path}') }
}
