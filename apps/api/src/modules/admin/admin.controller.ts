import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { CurrentAdmin, CurrentRequestId, RequireAdminPermissions } from '../admin-auth/admin-auth.decorators'
import type { AdminActor } from '../admin-auth/admin-auth.types'
import {
  CreateReportDto,
  RouteActionDto,
  ToggleCityDto,
  UpdateFeedStatusDto,
  UpdateFuelPriceDto,
  UpdateFuelStationDto,
  UpdateRankingDto,
  UpdateRouteDto,
  UpdateUserStatusDto,
} from './admin.dto'

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @RequireAdminPermissions('route:read') @Get('stats') stats() { return this.admin.stats() }
  @RequireAdminPermissions('route:read') @Get('routes') routes() { return this.admin.routes() }
  @RequireAdminPermissions('route:edit') @Patch('routes/:id') updateRoute(@Param('id') id: string, @Body() input: UpdateRouteDto) { return this.admin.updateRoute(id, input) }
  @RequireAdminPermissions('route:read') @Post('routes/:id/actions') routeAction(@Param('id') id: string, @Body() input: RouteActionDto, @CurrentAdmin() actor: AdminActor, @CurrentRequestId() requestId: string) { return this.admin.routeAction(id, input, actor, requestId) }
  @RequireAdminPermissions('ranking:read') @Get('rankings') rankings() { return this.admin.rankings() }
  @RequireAdminPermissions('ranking:write') @Patch('rankings/:id') updateRanking(@Param('id') id: string, @Body() input: UpdateRankingDto) { return this.admin.updateRanking(id, input) }
  @RequireAdminPermissions('city:read') @Get('cities') cities() { return this.admin.cities() }
  @RequireAdminPermissions('city:write') @Patch('cities/:code') toggleCity(@Param('code') code: string, @Body() input: ToggleCityDto) { return this.admin.toggleCity(code, input.enabled) }
  @RequireAdminPermissions('user:read') @Get('users') users() { return this.admin.users() }
  @RequireAdminPermissions('user:ban') @Patch('users/:id/status') updateUserStatus(@Param('id') id: string, @Body() input: UpdateUserStatusDto) { return this.admin.updateUserStatus(id, input) }
  @RequireAdminPermissions('feed:read') @Get('feeds') feeds() { return this.admin.feeds() }
  @RequireAdminPermissions('feed:audit') @Patch('feeds/:id/status') updateFeedStatus(@Param('id') id: string, @Body() input: UpdateFeedStatusDto) { return this.admin.updateFeedStatus(id, input) }
  @RequireAdminPermissions('analytics:read') @Get('analytics') analytics() { return this.admin.analytics() }
  @RequireAdminPermissions('report:read') @Get('reports') reports() { return this.admin.reports() }
  @RequireAdminPermissions('report:write') @Post('reports') createReport(@Body() input: CreateReportDto, @CurrentAdmin() actor: AdminActor) { return this.admin.createReport(input, actor) }
  @RequireAdminPermissions('report:write') @Delete('reports/:id') deleteReport(@Param('id') id: string) { return this.admin.deleteReport(id) }
  @RequireAdminPermissions('fuel:read') @Get('fuel') fuel() { return this.admin.fuel() }
  @RequireAdminPermissions('fuel:write') @Patch('fuel/prices/:id') updateFuelPrice(@Param('id') id: string, @Body() input: UpdateFuelPriceDto) { return this.admin.updateFuelPrice(id, input) }
  @RequireAdminPermissions('fuel:write') @Patch('fuel/stations/:id') updateFuelStation(@Param('id') id: string, @Body() input: UpdateFuelStationDto) { return this.admin.updateFuelStation(id, input) }
}
