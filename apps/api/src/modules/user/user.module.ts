import { Module } from '@nestjs/common'
import { ConfigModule as SystemConfigModule } from '../config/config.module'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { IdentityModule } from '../identity/identity.module'
@Module({ imports: [IdentityModule, SystemConfigModule], controllers: [UserController], providers: [UserService] })
export class UserModule {}
