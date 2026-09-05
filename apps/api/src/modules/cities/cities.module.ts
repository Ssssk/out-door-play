import { Module } from '@nestjs/common'
import { CitiesController } from './cities.controller'
import { RoutesModule } from '../routes/routes.module'

@Module({ imports: [RoutesModule], controllers: [CitiesController] })
export class CitiesModule {}
