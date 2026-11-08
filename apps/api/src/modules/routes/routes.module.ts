import { Module } from '@nestjs/common'
import { ConfigModule as SystemConfigModule } from '../config/config.module'
import { RouteLineService } from './route-line.service'
import { RoutesController } from './routes.controller'
import { RoutesService } from './routes.service'
import { DISCOVERY_REPOSITORY } from './discovery.repository'
import { PrismaDiscoveryRepository } from './prisma-discovery.repository'

@Module({
  imports: [SystemConfigModule],
  controllers: [RoutesController],
  providers: [RoutesService, RouteLineService, PrismaDiscoveryRepository, { provide: DISCOVERY_REPOSITORY, useExisting: PrismaDiscoveryRepository }],
  exports: [RoutesService],
})
export class RoutesModule {}
