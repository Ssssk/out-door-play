import { Module } from '@nestjs/common'
import { BaiduWeatherProvider } from './baidu-weather.provider'
import { WeatherController } from './weather.controller'
import { WeatherService } from './weather.service'

@Module({
  controllers: [WeatherController],
  providers: [WeatherService, BaiduWeatherProvider],
})
export class WeatherModule {}
