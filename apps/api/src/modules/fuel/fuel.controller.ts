import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { parseGeoPoint } from '../../common/geo'
import { FuelPricesDto, FuelStationsDto } from './fuel.dto'
import { FuelService } from './fuel.service'

@ApiTags('fuel')
@Controller('fuel')
export class FuelController {
  constructor(private readonly fuel: FuelService) {}
  @Get('prices') prices(@Query() query: FuelPricesDto) { return this.fuel.prices(query.cityCode) }
  @Get('stations') stations(@Query() query: FuelStationsDto) {
    return this.fuel.stations(parseGeoPoint(query.lat, query.lng), query.page, query.pageSize)
  }
}
