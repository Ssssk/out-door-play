import { Module } from '@nestjs/common'
import { AmapWeatherProvider } from './amap-weather.provider'
import { BaiduWeatherProvider } from './baidu-weather.provider'
import { WeatherController } from './weather.controller'
import { WEATHER_PROVIDER, WeatherService } from './weather.service'

const weatherProvider = {
  provide: WEATHER_PROVIDER,
  useFactory: () => {
    // 默认走高德（服务器网络单独劫持 api.map.baidu.com，百度不可达且天气服务未开通）；
    // 未配置 AMAP_MAP_KEY 时回落百度（需百度 AK 且已开通「天气查询」）。
    if ((process.env.AMAP_MAP_KEY ?? '').trim().length > 0) return new AmapWeatherProvider()
    return new BaiduWeatherProvider()
  },
}

@Module({
  controllers: [WeatherController],
  providers: [WeatherService, AmapWeatherProvider, BaiduWeatherProvider, weatherProvider],
})
export class WeatherModule {}
