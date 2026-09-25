import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'

export class RouteActionDto {
  @IsString() @MinLength(8) @MaxLength(64) actionId!: string
  @IsIn(['audit-pass', 'audit-reject', 'shelf-on', 'shelf-off']) action!: 'audit-pass' | 'audit-reject' | 'shelf-on' | 'shelf-off'
  @IsOptional() @IsString() @MaxLength(200) note?: string
}

export class UpdateRouteDto {
  @IsOptional() @IsString() @MaxLength(128) title?: string
  @IsOptional() @IsString() @MaxLength(32) difficulty?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) rankWeight?: number
}

export class UpdateRankingDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) weight?: number
  @IsOptional() @IsIn(['online', 'pending', 'offline']) status?: 'online' | 'pending' | 'offline'
}

export class ToggleCityDto { @IsBoolean() enabled!: boolean }

export class UpdateCityScenesDto {
  @IsArray() @IsIn(['drive', 'fish', 'fuel'], { each: true }) scenes!: string[]
}

export class SetCityOilDto {
  @IsOptional() @Type(() => Number) @Min(0) @Max(20) price92?: number
  @IsOptional() @Type(() => Number) @Min(0) @Max(20) price95?: number
  @IsOptional() @Type(() => Number) @Min(0) @Max(20) price0?: number
  @IsOptional() @IsString() @MaxLength(200) note?: string
}

export class UpdateQrConfigDto {
  /** 二维码图片 dataURL（运营端已校验 image/* 且 ≤ 2MB） */
  @IsOptional() @IsString() @MaxLength(3_000_000) fanGroup?: string
  @IsOptional() @IsString() @MaxLength(3_000_000) contact?: string
}

export class UpdateUserNoteDto { @IsOptional() @IsString() @MaxLength(255) adminNote?: string }
export class UpdateUserStatusDto { @IsIn(['normal', 'banned']) status!: 'normal' | 'banned' }
export class UpdateFeedStatusDto { @IsIn(['pending', 'published', 'offline']) status!: 'pending' | 'published' | 'offline' }

export class UpdateFuelStationDto {
  @IsOptional() @IsBoolean() enabled?: boolean
  @IsOptional() @IsString() @MaxLength(32) openingHours?: string
}

export class CreateReportDto {
  @IsString() @MinLength(2) @MaxLength(128) name!: string
  @IsIn(['route', 'user', 'fuel', 'ugc']) type!: 'route' | 'user' | 'fuel' | 'ugc'
  @IsString() @MaxLength(64) dateRange!: string
  @IsString() @MaxLength(32) dimension!: string
}

