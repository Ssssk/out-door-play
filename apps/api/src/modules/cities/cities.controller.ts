import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { RoutesService } from '../routes/routes.service'

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly discovery: RoutesService) {}
  @Get()
  @ApiOperation({ operationId: 'listEnabledCities' })
  list() { return this.discovery.listCities() }
}
