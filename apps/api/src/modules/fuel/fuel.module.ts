import { Module } from '@nestjs/common'
import { FuelController } from './fuel.controller'
import { FuelService } from './fuel.service'
import { ProvinceFuelPriceProvider } from './province-price.provider'
import { OsmStationProvider } from './osm-station.provider'
import { BaiduStationProvider } from './baidu-station.provider'
import { AmapStationProvider } from './amap-station.provider'
import { TiandituStationProvider } from './tianditu-station.provider'
import { StationSyncService } from './station-sync.service'
import { STATION_PROVIDER } from './station-provider'

const stationProvider = {
  provide: STATION_PROVIDER,
  useFactory: () => {
    // 默认走高德：部署服务器网络单独劫持 api.map.baidu.com（E1002 网关拒绝），
    // 百度同步全灭而 restapi.amap.com 实测可达（2026-10）。
    // 天地图（tianditu）为备选源：高德日配额吃紧时切换（需注入 TIANDITU_MAP_KEY）。
    const mode = process.env.STATION_PROVIDER?.trim().toLowerCase()
    if (mode === 'osm') return new OsmStationProvider()
    if (mode === 'baidu') return new BaiduStationProvider()
    if (mode === 'tianditu') return new TiandituStationProvider()
    return new AmapStationProvider()
  },
}

@Module({
  controllers: [FuelController],
  providers: [
    FuelService,
    ProvinceFuelPriceProvider,
    OsmStationProvider,
    TiandituStationProvider,
    stationProvider,
    StationSyncService,
  ],
})
export class FuelModule {}
