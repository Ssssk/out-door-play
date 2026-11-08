import { Module } from '@nestjs/common'
import { ConfigModule as SystemConfigModule } from '../config/config.module'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'

@Module({ imports: [SystemConfigModule], controllers: [AdminController], providers: [AdminService] })
export class AdminModule {}
