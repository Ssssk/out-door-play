import { Type } from 'class-transformer'
import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Matches, Max, Min } from 'class-validator'

/** 附近加油站默认每页条数（产品要求每页 5 条）；显式传入时仍受 MAX 约束 */
export const STATION_PAGE_SIZE = 5
export const STATION_PAGE_SIZE_MAX = 30

export class FuelPricesDto {
  @IsString() @Matches(/^\d{6}$/) cityCode!: string
  @IsOptional() @IsString() date?: string
}
export class FuelStationsDto {
  // 实时附近检索必须提供完整 GCJ-02 坐标。
  @IsLatitude() lat!: string
  @IsLongitude() lng!: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(STATION_PAGE_SIZE_MAX) pageSize?: number
}
