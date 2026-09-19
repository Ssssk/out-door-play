import { Module } from '@nestjs/common'
import { FuelController } from './fuel.controller'
import { FuelService } from './fuel.service'
import { ProvinceFuelPriceProvider } from './province-price.provider'
import { TencentStationProvider } from './tencent-station.provider'
@Module({
  controllers: [FuelController],
  providers: [FuelService, ProvinceFuelPriceProvider, TencentStationProvider],
})
export class FuelModule {}
