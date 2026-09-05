import { Module } from '@nestjs/common'
import { RoutesController } from './routes.controller'
import { RoutesService } from './routes.service'
import { DISCOVERY_REPOSITORY } from './discovery.repository'
import { PrismaDiscoveryRepository } from './prisma-discovery.repository'

@Module({
  controllers: [RoutesController],
  providers: [RoutesService, PrismaDiscoveryRepository, { provide: DISCOVERY_REPOSITORY, useExisting: PrismaDiscoveryRepository }],
  exports: [RoutesService],
})
export class RoutesModule {}
