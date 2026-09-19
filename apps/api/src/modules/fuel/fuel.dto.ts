import { IsLatitude, IsLongitude, IsNumberString, IsOptional, IsString, Matches } from 'class-validator'

export class FuelPricesDto {
  @IsString() @Matches(/^\d{6}$/) cityCode!: string
  @IsOptional() @IsString() date?: string
}
export class FuelStationsDto {
  // 坐标可选：提供时按用户真实位置计算并排序距离，缺失时回落到库内预置距离
  @IsOptional() @IsLatitude() lat?: string
  @IsOptional() @IsLongitude() lng?: string
  @IsOptional() @IsNumberString() radius?: string
}
