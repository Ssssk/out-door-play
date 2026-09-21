import { Transform } from 'class-transformer'
import { IsIn, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator'
export class UpdateUserDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  nickname!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^(https:\/\/|\/static\/|\/v1\/uploads\/)/u)
  avatarUrl?: string
}

export interface UploadedImage {
  buffer: Buffer
  mimetype: string
  size: number
  originalname: string
}

export class FavoriteQueryDto {
  @IsIn(['drive', 'fish'])
  scene!: 'drive' | 'fish'
}

export class AddFavoriteDto {
  @IsString()
  @Length(1, 64)
  discoveryId!: string
}

export class FavoriteParamDto {
  @IsString()
  @Length(1, 64)
  discoveryId!: string
}
