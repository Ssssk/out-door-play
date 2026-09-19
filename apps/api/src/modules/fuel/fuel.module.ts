import { Module } from '@nestjs/common'
import { FuelController } from './fuel.controller'
import { FuelService } from './fuel.service'
import { ProvinceFuelPriceProvider } from './province-price.provider'
import { StationSyncService } from './station-sync.service'
import { TencentStationProvider } from './tencent-station.provider'
@Module({
  controllers: [FuelController],
  providers: [FuelService, ProvinceFuelPriceProvider, TencentStationProvider, StationSyncService],
})
export class FuelModule {}
