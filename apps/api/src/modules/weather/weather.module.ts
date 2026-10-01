import { Module } from '@nestjs/common'
import { TencentWeatherProvider } from './tencent-weather.provider'
import { WeatherController } from './weather.controller'
import { WeatherService } from './weather.service'

@Module({
  controllers: [WeatherController],
  providers: [WeatherService, TencentWeatherProvider],
})
export class WeatherModule {}
