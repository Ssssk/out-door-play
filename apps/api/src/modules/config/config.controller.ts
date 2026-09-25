import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../../database/prisma.service'

interface QrConfigValue {
  fanGroup?: unknown
  contact?: unknown
  fanGroupAt?: unknown
  contactAt?: unknown
}

/** 小程序端消费运营配置（如「我的」页二维码），与管理后台同一数据库、即时生效 */
@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('qrcodes')
  @ApiOperation({ operationId: 'getPublicQrcodes', summary: '小程序「我的」页扫码入口二维码' })
  async qrcodes() {
    const record = await this.prisma.systemConfig.findUnique({ where: { key: 'qrcodes' } })
    const value = (record?.value || {}) as QrConfigValue
    return {
      fanGroup: typeof value.fanGroup === 'string' ? value.fanGroup : '',
      contact: typeof value.contact === 'string' ? value.contact : '',
      fanGroupAt: typeof value.fanGroupAt === 'string' ? value.fanGroupAt : null,
      contactAt: typeof value.contactAt === 'string' ? value.contactAt : null,
    }
  }
}
