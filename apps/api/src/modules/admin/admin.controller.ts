import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { CurrentAdmin, CurrentRequestId, RequireAdminPermissions } from '../admin-auth/admin-auth.decorators'
import type { AdminActor } from '../admin-auth/admin-auth.types'
import {
  CreateRouteDto,
  CreateReportDto,
  RouteActionDto,
  SetCityOilDto,
  ToggleCityDto,
  UpdateCityScenesDto,
  UpdateFeedStatusDto,
  UpdateFuelStationDto,
  UpdateQrConfigDto,
  UpsertRankingDto,
  UpdateRouteDto,
  UpdateUserNoteDto,
  UpdateUserStatusDto,
} from './admin.dto'

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @RequireAdminPermissions('route:read') @Get('stats') stats() { return this.admin.stats() }
  @RequireAdminPermissions('route:read') @Get('routes') routes() { return this.admin.routes() }
  @RequireAdminPermissions('route:edit') @Delete('routes/:id') deleteRoute(@Param('id') id: string) { return this.admin.deleteRoute(id) }
  @RequireAdminPermissions('route:edit') @Post('routes') createRoute(@Body() input: CreateRouteDto) { return this.admin.createRoute(input) }
  @RequireAdminPermissions('route:edit') @Post('routes/:id/cover') @UseInterceptors(FileInterceptor('file')) uploadRouteCover(@Param('id') id: string, @UploadedFile() file?: Express.Multer.File) { return this.admin.saveRouteCover(id, file) }
  @RequireAdminPermissions('route:edit') @Patch('routes/:id') updateRoute(@Param('id') id: string, @Body() input: UpdateRouteDto) { return this.admin.updateRoute(id, input) }
  @RequireAdminPermissions('route:read') @Post('routes/:id/actions') routeAction(@Param('id') id: string, @Body() input: RouteActionDto, @CurrentAdmin() actor: AdminActor, @CurrentRequestId() requestId: string) { return this.admin.routeAction(id, input, actor, requestId) }
  @RequireAdminPermissions('ranking:read') @Get('rankings') rankings() { return this.admin.rankings() }
  @RequireAdminPermissions('ranking:write') @Post('rankings') createRanking(@Body() input: UpsertRankingDto) { return this.admin.createRanking(input) }
  @RequireAdminPermissions('ranking:write') @Patch('rankings/:id') updateRanking(@Param('id') id: string, @Body() input: UpsertRankingDto) { return this.admin.updateRanking(id, input) }
  @RequireAdminPermissions('ranking:write') @Delete('rankings/:id') deleteRanking(@Param('id') id: string) { return this.admin.deleteRanking(id) }
  @RequireAdminPermissions('city:read') @Get('cities') cities() { return this.admin.cities() }
  @RequireAdminPermissions('city:write') @Patch('cities/:code') toggleCity(@Param('code') code: string, @Body() input: ToggleCityDto) { return this.admin.toggleCity(code, input.enabled) }
  @RequireAdminPermissions('city:write') @Patch('cities/:code/scenes') updateCityScenes(@Param('code') code: string, @Body() input: UpdateCityScenesDto) { return this.admin.updateCityScenes(code, input.scenes) }
  @RequireAdminPermissions('city:write') @Patch('cities/:code/oil') setCityOil(@Param('code') code: string, @Body() input: SetCityOilDto) { return this.admin.setCityOil(code, input) }
  @RequireAdminPermissions('city:write') @Post('cities/:code/oil/refresh') refreshCityOil(@Param('code') code: string) { return this.admin.refreshCityOil(code) }
  @RequireAdminPermissions('city:write') @Post('cities/refresh-oil') refreshAllCityOil() { return this.admin.refreshAllCityOil() }
  @RequireAdminPermissions('user:read') @Get('users') users() { return this.admin.users() }
  @RequireAdminPermissions('user:read') @Get('users/:id') userDetail(@Param('id') id: string) { return this.admin.userDetail(id) }
  @RequireAdminPermissions('user:ban') @Patch('users/:id/status') updateUserStatus(@Param('id') id: string, @Body() input: UpdateUserStatusDto) { return this.admin.updateUserStatus(id, input) }
  @RequireAdminPermissions('user:ban') @Patch('users/:id/note') updateUserNote(@Param('id') id: string, @Body() input: UpdateUserNoteDto) { return this.admin.updateUserNote(id, input) }
  @RequireAdminPermissions('config:read') @Get('config/qrcodes') qrcodes() { return this.admin.qrcodes() }
  @RequireAdminPermissions('config:write') @Put('config/qrcodes') updateQrcodes(@Body() input: UpdateQrConfigDto) { return this.admin.updateQrcodes(input) }
  @RequireAdminPermissions('feed:read') @Get('feeds') feeds() { return this.admin.feeds() }
  @RequireAdminPermissions('feed:audit') @Patch('feeds/:id/status') updateFeedStatus(@Param('id') id: string, @Body() input: UpdateFeedStatusDto) { return this.admin.updateFeedStatus(id, input) }
  @RequireAdminPermissions('analytics:read') @Get('analytics') analytics() { return this.admin.analytics() }
  @RequireAdminPermissions('report:read') @Get('reports') reports() { return this.admin.reports() }
  @RequireAdminPermissions('report:write') @Post('reports') createReport(@Body() input: CreateReportDto, @CurrentAdmin() actor: AdminActor) { return this.admin.createReport(input, actor) }
  @RequireAdminPermissions('report:write') @Delete('reports/:id') deleteReport(@Param('id') id: string) { return this.admin.deleteReport(id) }
  @RequireAdminPermissions('fuel:read') @Get('fuel') fuel() { return this.admin.fuel() }
  @RequireAdminPermissions('fuel:write') @Patch('fuel/stations/:id') updateFuelStation(@Param('id') id: string, @Body() input: UpdateFuelStationDto) { return this.admin.updateFuelStation(id, input) }
}
