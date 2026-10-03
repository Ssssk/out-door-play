import { Module } from '@nestjs/common'
import { FuelController } from './fuel.controller'
import { FuelService } from './fuel.service'
import { ProvinceFuelPriceProvider } from './province-price.provider'
import { TencentStationProvider } from './tencent-station.provider'
import { StationSyncService } from './station-sync.service'
@Module({
  controllers: [FuelController],
  providers: [FuelService, ProvinceFuelPriceProvider, TencentStationProvider, StationSyncService],
})
export class FuelModule {}
