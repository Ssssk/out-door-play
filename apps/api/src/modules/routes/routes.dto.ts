import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator'

export class ListRoutesDto {
  @IsOptional() @Matches(/^\d{6}$/u) city?: string
  @IsOptional() @IsIn(['drive', 'fish']) scene: 'drive' | 'fish' = 'drive'
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20) limit = 10
}

export class DiscoveryIdDto {
  @Matches(/^[a-z0-9-]{1,64}$/u)
  id!: string
}
