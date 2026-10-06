import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { DiscoveryIdDto, ListRoutesDto } from './routes.dto'
import { RouteLineService } from './route-line.service'
import { RoutesService } from './routes.service'

@ApiTags('routes')
@Controller()
export class RoutesController {
  constructor(
    private readonly routes: RoutesService,
    private readonly routeLine: RouteLineService,
  ) {}
  @Get('routes')
  @ApiOperation({ operationId: 'listDiscoveries' })
  list(@Query() query: ListRoutesDto) { return this.routes.list(query.scene, query.limit, query.city) }

  @Get('routes/:id')
  @ApiOperation({ operationId: 'getRouteDetail' })
  route(@Param() input: DiscoveryIdDto) { return this.routes.route(input.id) }

  @Get('routes/:id/line')
  @ApiOperation({ operationId: 'getRouteLine' })
  async line(@Param() input: DiscoveryIdDto) {
    const line = await this.routeLine.getOrPlanLine(input.id)
    if (!line) throw new NotFoundException({ message: '暂无该路线的完整轨迹', code: 'ROUTE_LINE_UNAVAILABLE' })
    return line
  }

  @Get('spots/:id')
  @ApiOperation({ operationId: 'getFishingSpotDetail' })
  spot(@Param() input: DiscoveryIdDto) { return this.routes.spot(input.id) }
}
