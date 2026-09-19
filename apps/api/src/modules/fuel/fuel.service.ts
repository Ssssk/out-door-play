import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { distanceInKm, roundDistanceKm } from '../../common/geo'
import type { GeoPoint } from '../../common/geo'

@Injectable()
export class FuelService {
  constructor(private readonly prisma: PrismaService) {}

  async prices(cityCode: string) {
    const records = await this.prisma.fuelPrice.findMany({ where: { cityCode }, orderBy: { grade: 'asc' } })
    const publishedAt = records[0]?.publishedAt
    return {
      items: records.map(({ grade, price, change }) => ({ grade, price, change })),
      updatedAt: publishedAt ? this.formatDate(publishedAt) : '',
    }
  }

  async stations(point?: GeoPoint | null) {
    const stations = await this.prisma.fuelStation.findMany({
      where: { enabled: true },
      orderBy: { distanceKm: 'asc' },
    })
    if (!point) return stations

    return stations
      .map((station) => ({
        ...station,
        distanceKm: roundDistanceKm(distanceInKm(point, { latitude: station.latitude, longitude: station.longitude })),
      }))
      .sort((left, right) => left.distanceKm - right.distanceKm)
  }

  private formatDate(value: Date) {
    const parts = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(value)
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || ''
    return `${part('month')}-${part('day')} ${part('hour')}:${part('minute')}`
  }
}
