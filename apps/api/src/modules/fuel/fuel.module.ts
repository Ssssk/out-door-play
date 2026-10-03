import { Module } from '@nestjs/common'
import { FuelController } from './fuel.controller'
import { FuelService } from './fuel.service'
import { ProvinceFuelPriceProvider } from './province-price.provider'
import { TencentStationProvider } from './tencent-station.provider'
import { OsmStationProvider } from './osm-station.provider'
import { StationSyncService } from './station-sync.service'
import { STATION_PROVIDER } from './station-provider'

const stationProvider = {
  provide: STATION_PROVIDER,
  useFactory: () => {
    // 默认走开源 OSM（免费、无每日配额）；配置为 tencent 时回落到腾讯地点搜索
    const mode = process.env.STATION_PROVIDER?.trim().toLowerCase()
    return mode === 'tencent' ? new TencentStationProvider() : new OsmStationProvider()
  },
}

@Module({
  controllers: [FuelController],
  providers: [
    FuelService,
    ProvinceFuelPriceProvider,
    TencentStationProvider,
    OsmStationProvider,
    stationProvider,
    StationSyncService,
  ],
})
export class FuelModule {}
