import { Module } from '@nestjs/common'
import { FuelController } from './fuel.controller'
import { FuelService } from './fuel.service'
import { ProvinceFuelPriceProvider } from './province-price.provider'
@Module({ controllers: [FuelController], providers: [FuelService, ProvinceFuelPriceProvider] })
export class FuelModule {}
