import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentWeatherDto } from './weather.dto'
import { WeatherService } from './weather.service'

@ApiTags('weather')
@Controller()
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  @Get('weather/current')
  @ApiOperation({ operationId: 'getCurrentWeather' })
  async current(@Query() query: CurrentWeatherDto) { return this.weather.current(query.cityCode) }
}
