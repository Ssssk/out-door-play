import { Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Max, MaxLength, Min, MinLength } from 'class-validator'

export class RouteActionDto {
  @IsString() @MinLength(8) @MaxLength(64) actionId!: string
  @IsIn(['audit-pass', 'audit-reject', 'shelf-on', 'shelf-off']) action!: 'audit-pass' | 'audit-reject' | 'shelf-on' | 'shelf-off'
  @IsOptional() @IsString() @MaxLength(200) note?: string
}

export class UpdateRouteDto {
  @IsOptional() @IsString() @Length(6, 6) cityCode?: string
  @IsOptional() @IsString() @MaxLength(128) title?: string
  @IsOptional() @IsString() @MaxLength(32) difficulty?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) rankWeight?: number
  @IsOptional() @IsString() @MaxLength(64) bestTime?: string
  @IsOptional() @IsString() @MaxLength(32) durationLabel?: string
  @IsOptional() @IsString() @MaxLength(5000) description?: string
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1000) lengthKm?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) elevationM?: number
  @IsOptional() @IsString() @MaxLength(64) carType?: string
  @IsOptional() @IsString() @MaxLength(128) startPoint?: string
  @IsOptional() @IsString() @MaxLength(128) endPoint?: string
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1000) shoreKm?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1000) depthM?: number
  @IsOptional() @IsString() @MaxLength(128) entryPoint?: string
  @IsOptional() @IsString() @MaxLength(128) mainArea?: string
  @IsOptional() @IsString() @MaxLength(128) gear?: string
}

export class CreateRouteDto {
  @IsString() @MinLength(2) @MaxLength(128) title!: string
  @IsString() @Length(6, 6) cityCode!: string
  @IsIn(['drive', 'fish']) scene!: 'drive' | 'fish'
  @IsString() @MinLength(1) @MaxLength(32) difficulty!: string
  @IsOptional() @IsString() @MaxLength(64) rankTag?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) rankWeight?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) rank?: number
  @IsOptional() @IsString() @MaxLength(255) coverImageUrl?: string
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) distanceKm?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) lengthKm?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) elevationM?: number
  @IsOptional() @IsString() @MaxLength(32) durationLabel?: string
  @IsOptional() @IsString() @MaxLength(64) bestTime?: string
  @IsOptional() @IsString() @MaxLength(64) carType?: string
  @IsOptional() @IsString() @MaxLength(128) startPoint?: string
  @IsOptional() @IsString() @MaxLength(128) endPoint?: string
  @IsOptional() @IsString() @MaxLength(128) entryPoint?: string
  @IsOptional() @IsString() @MaxLength(128) mainArea?: string
  @IsOptional() @IsString() @MaxLength(128) gear?: string
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) shoreKm?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) depthM?: number
  @IsOptional() @IsString() @MaxLength(5000) description?: string
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) tags?: string[]
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) latitude?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) longitude?: number
  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsNumber({}, { each: true }) elevationPoints?: number[]
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
  /** 二维码图片 dataURL（运营端已校验 image/* 且 ≤ 10MB；base64 后约 ≤ 14MB） */
  @IsOptional() @IsString() @MaxLength(15_000_000) fanGroup?: string
  @IsOptional() @IsString() @MaxLength(15_000_000) contact?: string
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

/** 新建/编辑榜单：封面路线至少 1 条（web-rankings.md RULE-RANK-004） */
export class UpsertRankingDto {
  @IsString() @MinLength(1) @MaxLength(128) name!: string
  @IsIn(['drive', 'fish']) scene!: 'drive' | 'fish'
  @IsOptional() @IsString() @MinLength(6) @MaxLength(6) cityCode?: string
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) coverRouteIds!: string[]
}

