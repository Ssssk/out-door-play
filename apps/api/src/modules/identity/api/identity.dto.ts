import { Transform } from 'class-transformer'
import { IsString, Length, Matches } from 'class-validator'

export class WechatLoginDto {
  @IsString()
  @Length(1, 256)
  code!: string
}

export class DevLoginDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 64)
  @Matches(/^[A-Za-z0-9_-]+$/u)
  handle!: string
}

export class RefreshMobileSessionDto {
  @IsString()
  @Length(32, 256)
  refreshToken!: string
}
