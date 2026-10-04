import { Module } from '@nestjs/common'
import { FuelController } from './fuel.controller'
import { FuelService } from './fuel.service'
import { ProvinceFuelPriceProvider } from './province-price.provider'
import { OsmStationProvider } from './osm-station.provider'
import { BaiduStationProvider } from './baidu-station.provider'
import { AmapStationProvider } from './amap-station.provider'
import { StationSyncService } from './station-sync.service'
import { STATION_PROVIDER } from './station-provider'

const stationProvider = {
  provide: STATION_PROVIDER,
  useFactory: () => {
    // 默认走高德：部署服务器网络单独劫持 api.map.baidu.com（E1002 网关拒绝），
    // 百度同步全灭而 restapi.amap.com 实测可达（2026-10）。显式 baidu/osm 时走对应源。
    const mode = process.env.STATION_PROVIDER?.trim().toLowerCase()
    if (mode === 'osm') return new OsmStationProvider()
    if (mode === 'baidu') return new BaiduStationProvider()
    return new AmapStationProvider()
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
