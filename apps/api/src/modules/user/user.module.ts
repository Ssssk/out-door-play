import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { IdentityModule } from '../identity/identity.module'
@Module({ imports: [IdentityModule], controllers: [UserController], providers: [UserService] })
export class UserModule {}
