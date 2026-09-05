import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { MobileAuthGuard } from '../identity/api/mobile-auth.guard'
import type { MobileAuthenticatedRequest } from '../identity/domain/identity.types'
import { AddFavoriteDto, FavoriteParamDto, FavoriteQueryDto, UpdateUserDto } from './user.dto'
import { UserService } from './user.service'

@ApiTags('user')
@ApiBearerAuth('mobileBearer')
@UseGuards(MobileAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly users: UserService) {}
  @Get('me')
  @ApiOperation({ operationId: 'getCurrentUserProfile' })
  me(@Req() request: MobileAuthenticatedRequest) { return this.users.me(request.mobileAuth.userId) }

  @Patch('me')
  @ApiOperation({ operationId: 'updateCurrentUserProfile' })
  update(@Req() request: MobileAuthenticatedRequest, @Body() input: UpdateUserDto) { return this.users.update(request.mobileAuth.userId, input) }

  @Post('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'updateCurrentUserProfileLegacy', deprecated: true })
  updateLegacy(@Req() request: MobileAuthenticatedRequest, @Body() input: UpdateUserDto) { return this.users.update(request.mobileAuth.userId, input) }

  @Get('favorites')
  @ApiOperation({ operationId: 'listCurrentUserFavorites' })
  favorites(@Req() request: MobileAuthenticatedRequest, @Query() query: FavoriteQueryDto) { return this.users.favorites(request.mobileAuth.userId, query.scene) }

  @Post('favorites')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'addCurrentUserFavorite' })
  addFavorite(@Req() request: MobileAuthenticatedRequest, @Body() input: AddFavoriteDto) { return this.users.addFavorite(request.mobileAuth.userId, input.discoveryId) }

  @Delete('favorites/:discoveryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'removeCurrentUserFavorite' })
  removeFavorite(@Req() request: MobileAuthenticatedRequest, @Param() input: FavoriteParamDto) { return this.users.removeFavorite(request.mobileAuth.userId, input.discoveryId) }
}
