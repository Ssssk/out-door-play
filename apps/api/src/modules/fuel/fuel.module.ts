import { Module } from '@nestjs/common'
import { FuelController } from './fuel.controller'
import { FuelService } from './fuel.service'
import { OfficialFuelPriceProvider } from './official-price.provider'
@Module({ controllers: [FuelController], providers: [FuelService, OfficialFuelPriceProvider] })
export class FuelModule {}
