import { Type } from 'class-transformer'
import { IsIn, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Matches, Max, Min } from 'class-validator'
import { FUEL_GRADES } from './province-price.provider'
import type { StationKind } from './station-provider'

/** 附近加油站默认每页条数（产品要求每页 5 条）；显式传入时仍受 MAX 约束 */
export const STATION_PAGE_SIZE = 5
export const STATION_PAGE_SIZE_MAX = 30

/** 历史油价默认返回期数：成品油约每 10 个工作日调价一次，24 期 ≈ 一年 */
export const FUEL_HISTORY_LIMIT = 24
export const FUEL_HISTORY_LIMIT_MAX = 60

export class FuelPricesDto {
  @IsString() @Matches(/^\d{6}$/) cityCode!: string
  @IsOptional() @IsString() date?: string
}

/** 历史油价：按城市推导省份，按油号返回每次调价快照 */
export class FuelPriceHistoryDto {
  @IsString() @Matches(/^\d{6}$/) cityCode!: string
  @IsIn(Object.values(FUEL_GRADES)) grade!: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(FUEL_HISTORY_LIMIT_MAX) limit?: number
}
export class FuelStationsDto {
  // 实时附近检索必须提供完整 GCJ-02 坐标。
  @IsLatitude() lat!: string
  @IsLongitude() lng!: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(STATION_PAGE_SIZE_MAX) pageSize?: number
  // 坐标附近无站点时的兜底城市：返回该城市已同步站点（非空时不消耗腾讯额度）
  @IsOptional() @IsString() @Matches(/^\d{6}$/) cityCode?: string
  // 站点类型：'fuel' 加油站（默认）/ 'ev' 充电站；老客户端不传则按加油站处理（向后兼容）
  @IsOptional() @IsIn(['fuel', 'ev']) kind?: StationKind
}
