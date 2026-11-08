import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator'
import { BUSINESS_SCENES, LEGACY_SCENES, PLAY_TYPES } from '../../common/scenes'
import type { PlayType, SceneQuery } from '../../common/scenes'

const SCENE_QUERY_VALUES = [...BUSINESS_SCENES, ...LEGACY_SCENES]

export class ListRoutesDto {
  @IsOptional() @Matches(/^\d{6}$/u) city?: string
  /** fish 为兼容期读值；写入接口不接受 fish */
  @IsOptional() @IsIn(SCENE_QUERY_VALUES) scene: SceneQuery = 'drive'
  @IsOptional() @IsIn([...PLAY_TYPES]) subType?: PlayType
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20) limit = 10
}

export class DiscoveryIdDto {
  @Matches(/^[a-z0-9-]{1,64}$/u)
  id!: string
}
