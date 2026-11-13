import { Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsISO8601, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested } from 'class-validator'
import { BUSINESS_SCENES, LEGACY_SCENES, PLAY_TYPES } from '../../common/scenes'
import type { BusinessScene, PlayType, SceneQuery } from '../../common/scenes'

const SCENE_QUERY_VALUES = [...BUSINESS_SCENES, ...LEGACY_SCENES]

/** 首页分类目录：单条分类项（场景固定 3 值，运营不能自造 scene） */
export class SceneTabDto {
  @IsIn([...BUSINESS_SCENES]) scene!: BusinessScene
  @IsString() @Length(1, 12) label!: string
  @IsBoolean() enabled!: boolean
  @IsInt() @Min(0) @Max(9999) sort!: number
}

/** expectedUpdatedAt 必填且允许 null（未配置时）；null 跳过格式校验，undefined 会触发 422 */
export class UpdateSceneTabsDto {
  @ValidateIf((_object: object, value: unknown) => value !== null)
  @IsISO8601({ strict: true })
  expectedUpdatedAt!: string | null

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => SceneTabDto)
  items!: SceneTabDto[]
}

export class RouteActionDto {
  @IsString() @MinLength(8) @MaxLength(64) actionId!: string
  @IsIn(['audit-pass', 'audit-reject', 'shelf-on', 'shelf-off']) action!: 'audit-pass' | 'audit-reject' | 'shelf-on' | 'shelf-off'
  @IsOptional() @IsString() @MaxLength(200) note?: string
}

export class UpdateRouteDto {
  @IsOptional() @IsString() @Length(6, 6) cityCode?: string
  @IsOptional() @IsString() @MaxLength(128) title?: string
  /** 编辑历史 fish 记录时允许传 fish，用例层不会把它写成新值 */
  @IsOptional() @IsIn(SCENE_QUERY_VALUES) scene?: SceneQuery
  @IsOptional() @IsIn([...PLAY_TYPES]) subType?: PlayType
  @IsOptional() @IsString() @MaxLength(32) difficulty?: string
  @IsOptional() @IsIn(['easy', 'normal', 'hard']) level?: 'easy' | 'normal' | 'hard'
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) rankWeight?: number
  @IsOptional() @IsString() @MaxLength(64) bestTime?: string
  @IsOptional() @IsString() @MaxLength(64) priceLabel?: string
  @IsOptional() @IsString() @MaxLength(32) durationLabel?: string
  @IsOptional() @IsString() @MaxLength(5000) description?: string
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1000) lengthKm?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) elevationM?: number
  @IsOptional() @IsString() @MaxLength(64) carType?: string
  @IsOptional() @IsString() @MaxLength(128) startPoint?: string
  @IsOptional() @IsString() @MaxLength(128) endPoint?: string
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) longitude?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) latitude?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) endLongitude?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) endLatitude?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1000) shoreKm?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1000) depthM?: number
  @IsOptional() @IsString() @MaxLength(128) entryPoint?: string
  @IsOptional() @IsString() @MaxLength(128) mainArea?: string
  @IsOptional() @IsString() @MaxLength(128) gear?: string
}

export class CreateRouteDto {
  @IsString() @MinLength(2) @MaxLength(128) title!: string
  @IsString() @Length(6, 6) cityCode!: string
  @IsIn([...BUSINESS_SCENES]) scene!: BusinessScene
  @IsOptional() @IsIn([...PLAY_TYPES]) subType?: PlayType
  /** 露营 / 打卡（目的地型）不展示难度字段，允许省略；其它场景由后台表单继续提交 */
  @IsOptional() @IsString() @MinLength(1) @MaxLength(32) difficulty?: string
  @IsOptional() @IsString() @MaxLength(64) rankTag?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) rankWeight?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) rank?: number
  @IsOptional() @IsString() @MaxLength(255) coverImageUrl?: string
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) distanceKm?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) lengthKm?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) elevationM?: number
  @IsOptional() @IsIn(['easy', 'normal', 'hard']) level?: 'easy' | 'normal' | 'hard'
  @IsOptional() @IsString() @MaxLength(32) durationLabel?: string
  @IsOptional() @IsString() @MaxLength(64) bestTime?: string
  @IsOptional() @IsString() @MaxLength(64) priceLabel?: string
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
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) endLongitude?: number
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) endLatitude?: number
}

/** 后台路线列表查询：服务端分页 + 关键词/场景/子类型过滤（不传分页参数时按默认第一页） */
export class RouteListQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100000) page?: number
  /** 单页条数上限 100，避免后台一次拉全表 */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number
  @IsOptional() @IsString() @MaxLength(64) keyword?: string
  @IsOptional() @IsIn(SCENE_QUERY_VALUES) scene?: SceneQuery
  @IsOptional() @IsIn([...PLAY_TYPES]) subType?: PlayType
}

export class UpdateRankingDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) weight?: number
  @IsOptional() @IsIn(['online', 'pending', 'offline']) status?: 'online' | 'pending' | 'offline'
}

export class ToggleCityDto { @IsBoolean() enabled!: boolean }

/** 新增城市（PRD 城市管理：adcode 6 位 + 名称 + 场景 + 启用） */
export class CreateCityDto {
  @IsString() @Length(6, 6) code!: string
  @IsString() @MinLength(1) @MaxLength(32) name!: string
  @IsOptional() @IsArray() @IsIn(SCENE_QUERY_VALUES, { each: true }) scenes?: string[]
  @IsOptional() @IsBoolean() enabled?: boolean
}

/** 编辑城市：名称/场景/启用均可调整 */
export class UpdateCityDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(32) name?: string
  @IsOptional() @IsArray() @IsIn(SCENE_QUERY_VALUES, { each: true }) scenes?: string[]
  @IsOptional() @IsBoolean() enabled?: boolean
}

export class UpdateCityScenesDto {
  @IsArray() @IsIn(SCENE_QUERY_VALUES, { each: true }) scenes!: string[]
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
  @IsIn(SCENE_QUERY_VALUES) scene!: SceneQuery
  @IsOptional() @IsString() @MinLength(6) @MaxLength(6) cityCode?: string
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) coverRouteIds!: string[]
}
