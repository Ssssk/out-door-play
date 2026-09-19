import { Type } from 'class-transformer'
import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Matches, Max, Min } from 'class-validator'

/** 附近加油站每页条数上限（产品要求每页 30 条） */
export const STATION_PAGE_SIZE = 30
export const STATION_PAGE_SIZE_MAX = 30

export class FuelPricesDto {
  @IsString() @Matches(/^\d{6}$/) cityCode!: string
  @IsOptional() @IsString() date?: string
}
export class FuelStationsDto {
  // 坐标可选：提供时按用户真实位置计算距离并由近到远排序；缺失时回落到库内预置距离
  @IsOptional() @IsLatitude() lat?: string
  @IsOptional() @IsLongitude() lng?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(STATION_PAGE_SIZE_MAX) pageSize?: number
}
