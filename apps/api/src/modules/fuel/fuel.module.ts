import { Module } from '@nestjs/common'
import { FuelController } from './fuel.controller'
import { FuelService } from './fuel.service'
import { ProvinceFuelPriceProvider } from './province-price.provider'
import { OsmStationProvider } from './osm-station.provider'
import { BaiduStationProvider } from './baidu-station.provider'
import { StationSyncService } from './station-sync.service'
import { STATION_PROVIDER } from './station-provider'

const stationProvider = {
  provide: STATION_PROVIDER,
  useFactory: () => {
    // 默认走百度地图（国内可达、配额充足）；仅显式配置为 osm 时回落开源 OSM
    const mode = process.env.STATION_PROVIDER?.trim().toLowerCase()
    if (mode === 'osm') return new OsmStationProvider()
    return new BaiduStationProvider()
  },
}

@Module({
  controllers: [FuelController],
  providers: [
    FuelService,
    ProvinceFuelPriceProvider,
    OsmStationProvider,
    stationProvider,
    StationSyncService,
  ],
})
export class FuelModule {}
