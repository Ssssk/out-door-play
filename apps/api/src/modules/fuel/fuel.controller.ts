import { Controller, Get, Post, Query, Headers } from '@nestjs/common'
import { UnauthorizedException } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { parseGeoPoint } from '../../common/geo'
import { FuelPricesDto, FuelStationsDto } from './fuel.dto'
import { FuelService } from './fuel.service'
import { StationSyncService, StationSyncSummary } from './station-sync.service'

@ApiTags('fuel')
@Controller('fuel')
export class FuelController {
  constructor(
    private readonly fuel: FuelService,
    private readonly stationSync: StationSyncService,
  ) {}
  @Get('prices') prices(@Query() query: FuelPricesDto) { return this.fuel.prices(query.cityCode) }
  @Get('stations') stations(@Query() query: FuelStationsDto) {
    return this.fuel.stations(parseGeoPoint(query.lat, query.lng), query.page, query.pageSize, query.cityCode)
  }
  /**
   * 手动触发一次加油站同步，便于发布后立即验证而无需等定时轮询。
   * 需带 `x-station-sync-token` 请求头，值等于部署环境变量 `STATION_SYNC_TRIGGER_TOKEN`；
   * 该变量未设置时端点始终返回 403，避免被未授权调用。
   */
  @Post('sync')
  async sync(@Headers('x-station-sync-token') token: string): Promise<StationSyncSummary> {
    const expected = process.env.STATION_SYNC_TRIGGER_TOKEN
    if (!expected || token !== expected) throw new UnauthorizedException('无效的同步触发令牌')
    return this.stationSync.sync()
  }
}
