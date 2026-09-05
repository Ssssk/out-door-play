import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { DiscoveryIdDto, ListRoutesDto } from './routes.dto'
import { RoutesService } from './routes.service'

@ApiTags('routes')
@Controller()
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}
  @Get('routes')
  @ApiOperation({ operationId: 'listDiscoveries' })
  list(@Query() query: ListRoutesDto) { return this.routes.list(query.scene, query.limit, query.city) }

  @Get('routes/:id')
  @ApiOperation({ operationId: 'getRouteDetail' })
  route(@Param() input: DiscoveryIdDto) { return this.routes.route(input.id) }

  @Get('spots/:id')
  @ApiOperation({ operationId: 'getFishingSpotDetail' })
  spot(@Param() input: DiscoveryIdDto) { return this.routes.spot(input.id) }
}
