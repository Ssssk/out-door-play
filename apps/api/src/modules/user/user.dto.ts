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

  // 大陆手机号，选填；填写时必须是 11 位合法号段，避免脏数据进库
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @MaxLength(11)
  @Matches(/^1[3-9]\d{9}$/u, { message: '手机号格式不正确' })
  phone?: string
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
