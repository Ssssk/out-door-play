import { Matches } from 'class-validator'

export class CurrentWeatherDto {
  @Matches(/^\d{6}$/u) cityCode!: string
}
