import { IsLatitude, IsLongitude, IsNumberString, IsOptional, IsString, Matches } from 'class-validator'

export class FuelPricesDto {
  @IsString() @Matches(/^\d{6}$/) cityCode!: string
  @IsOptional() @IsString() date?: string
}
export class FuelStationsDto {
  @IsLatitude() lat!: string
  @IsLongitude() lng!: string
  @IsOptional() @IsNumberString() radius?: string
}
