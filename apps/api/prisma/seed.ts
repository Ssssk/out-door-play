import { config } from 'dotenv'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import {
  FeedStatus,
  FeedType,
  PrismaClient,
  RankingStatus,
  ReportStatus,
  ReportType,
  RouteStatus,
  UserStatus,
} from '../src/generated/prisma/client'
import { cityRecords, fuelPriceRecords, fuelStationRecords, routeRecords } from '../src/data/seed'

config({ path: ['.env', '.env.development'], quiet: true })

const databaseUrl = new URL(process.env.DATABASE_URL || '')
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: decodeURIComponent(databaseUrl.pathname.slice(1)),
    allowPublicKeyRetrieval: process.env.DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL === 'true',
    connectionLimit: 5,
  }),
})

async function main() {
  const disabledCities = new Set(['330100'])
  const fishingCities = new Set(['420100', '440100', '430100', '500000'])
  for (const city of cityRecords) {
    const data = {
      ...city,
      enabled: !disabledCities.has(city.code),
      scenes: fishingCities.has(city.code) ? ['drive', 'fish', 'fuel'] : ['drive', 'fuel'],
    }
    await prisma.city.upsert({ where: { code: city.code }, update: data, create: data })
  }

  const operational = {
    'bafen-shanlu': { status: RouteStatus.online, impressions: 120000, clicks: 29800, rankWeight: 92 },
    'sanlian-chuan': { status: RouteStatus.online, impressions: 108000, clicks: 25100, rankWeight: 78 },
    qinglongshan: { status: RouteStatus.pending, impressions: 0, clicks: 0, rankWeight: 55 },
    liangzihu: { status: RouteStatus.online, impressions: 96400, clicks: 23300, rankWeight: 88 },
    mulanhu: { status: RouteStatus.online, impressions: 84200, clicks: 19800, rankWeight: 65 },
    houguanhu: { status: RouteStatus.offline, impressions: 53800, clicks: 11200, rankWeight: 38 },
  }
  for (const item of routeRecords) {
    const data = { ...item, cityCode: '420100', ...operational[item.id as keyof typeof operational] }
    await prisma.discovery.upsert({ where: { id: item.id }, update: data, create: data })
  }

  const publishedAt = new Date('2026-08-22T14:30:00+08:00')
  for (const item of fuelPriceRecords) {
    const data = { ...item, id: `420100-${item.grade}`, cityCode: '420100', publishedAt }
    await prisma.fuelPrice.upsert({ where: { id: data.id }, update: data, create: data })
  }

  for (const item of fuelStationRecords) {
    const data = { ...item, cityCode: '420100', enabled: true }
    await prisma.fuelStation.upsert({ where: { id: item.id }, update: data, create: data })
  }

  await prisma.user.upsert({
    where: { id: 'local-dev-user' },
    update: { cityCode: '420100', phone: '13800000000', status: UserStatus.normal },
    create: { id: 'local-dev-user', avatarUrl: '/static/icons/avatar-mine.png', nickname: '溜车老登', phone: '13800000000', cityCode: '420100', status: UserStatus.normal, mileage: 1280, checkins: 23 },
  })

  const users = [
    { id: 'u1', nickname: '山系阿黎', phone: '13812345001', cityCode: '420100', status: UserStatus.normal, lastActiveAt: new Date('2026-08-28T08:00:00+08:00') },
    { id: 'u2', nickname: '湖边老张', phone: '13912348820', cityCode: '420100', status: UserStatus.normal, lastActiveAt: new Date('2026-08-27T21:14:00+08:00') },
    { id: 'u3', nickname: '晴天-_-', phone: '13612340019', cityCode: '310000', status: UserStatus.normal, lastActiveAt: new Date('2026-08-25T09:20:00+08:00') },
    { id: 'u4', nickname: '钓鱼老六', phone: '18812343320', cityCode: '420100', status: UserStatus.normal, lastActiveAt: new Date('2026-08-28T06:48:00+08:00') },
    { id: 'u5', nickname: '违规小号', phone: '15012340042', cityCode: '110000', status: UserStatus.banned, lastActiveAt: new Date('2026-08-28T11:02:00+08:00') },
    { id: 'u6', nickname: 'Jacker', phone: '13712349911', cityCode: '510100', status: UserStatus.normal, lastActiveAt: new Date('2026-08-23T12:00:00+08:00') },
  ]
  for (const user of users) {
    const data = { ...user, avatarUrl: '/static/icons/avatar-mine.png' }
    await prisma.user.upsert({ where: { id: user.id }, update: data, create: data })
  }

  for (const discoveryId of ['bafen-shanlu', 'qinglongshan', 'liangzihu']) {
    await prisma.favorite.upsert({
      where: { userId_discoveryId: { userId: 'local-dev-user', discoveryId } },
      update: {},
      create: { userId: 'local-dev-user', discoveryId },
    })
  }

  const rankings = [
    { id: 'weekend-drive-wuhan', name: '武汉 · 周末溜车热门榜', scene: 'drive' as const, cityCode: '420100', coverageCount: 8, weight: 92, status: RankingStatus.online },
    { id: 'mountain-drive-wuhan', name: '武汉 · 跑山穿越 Top10', scene: 'drive' as const, cityCode: '420100', coverageCount: 10, weight: 78, status: RankingStatus.online },
    { id: 'wild-fishing', name: '钓点 · 野钓热门榜', scene: 'fish' as const, cityCode: null, coverageCount: 8, weight: 88, status: RankingStatus.online },
    { id: 'lake-fishing', name: '湖库垂钓营地榜', scene: 'fish' as const, cityCode: null, coverageCount: 6, weight: 65, status: RankingStatus.online },
    { id: 'suburb-drive-beijing', name: '北京 · 城郊自驾 Top5', scene: 'drive' as const, cityCode: '110000', coverageCount: 5, weight: 40, status: RankingStatus.pending },
    { id: 'national-day', name: '国庆特别榜', scene: 'drive' as const, cityCode: null, coverageCount: 5, weight: 30, status: RankingStatus.offline },
  ]
  for (const ranking of rankings) {
    await prisma.ranking.upsert({ where: { id: ranking.id }, update: ranking, create: ranking })
  }

  const feeds = [
    { id: 'p1', authorId: 'u2', discoveryId: 'liangzihu', type: FeedType.text, content: '今天梁子湖爆护，3 条翘嘴鲌，爽！', reportCount: 0, status: FeedStatus.pending, createdAt: new Date('2026-08-28T10:24:00+08:00') },
    { id: 'p2', authorId: 'u1', discoveryId: 'bafen-shanlu', type: FeedType.video, content: '八分山日落航拍，附路线建议', reportCount: 1, status: FeedStatus.pending, createdAt: new Date('2026-08-28T09:02:00+08:00') },
    { id: 'p3', authorId: 'u4', discoveryId: 'mulanhu', type: FeedType.text, content: '木兰湖库钓分享，4.5 斤草鱼', reportCount: 0, status: FeedStatus.published, createdAt: new Date('2026-08-27T18:46:00+08:00') },
    { id: 'p4', authorId: 'u5', discoveryId: null, type: FeedType.text, content: '拉客广告内容（已处理）', reportCount: 12, status: FeedStatus.offline, createdAt: new Date('2026-08-27T12:10:00+08:00') },
    { id: 'p5', authorId: 'u6', discoveryId: null, type: FeedType.text, content: '成都绕城周边短线推荐，1 日来回', reportCount: 0, status: FeedStatus.published, createdAt: new Date('2026-08-26T12:00:00+08:00') },
  ]
  for (const feed of feeds) {
    await prisma.feed.upsert({ where: { id: feed.id }, update: feed, create: feed })
  }

  const reports = [
    { id: 'rp1', name: '武汉路线周报', type: ReportType.route, dateRange: '08-18 ~ 08-24', dimension: '城市', creator: '运营-小王', status: ReportStatus.done },
    { id: 'rp2', name: '用户增长月报', type: ReportType.user, dateRange: '2026-07', dimension: '城市', creator: '运营-小王', status: ReportStatus.done },
    { id: 'rp3', name: '油价历史归档', type: ReportType.fuel, dateRange: '2026-06 ~ 2026-08', dimension: '城市', creator: '数据-老李', status: ReportStatus.processing },
    { id: 'rp4', name: '钓鱼路线 Top20', type: ReportType.route, dateRange: '近 30 天', dimension: '路线', creator: '运营-小王', status: ReportStatus.done },
    { id: 'rp5', name: 'UGC 内容质量周报', type: ReportType.ugc, dateRange: '08-18 ~ 08-24', dimension: '类型', creator: '客服-小赵', status: ReportStatus.failed },
  ]
  for (const report of reports) {
    await prisma.reportTask.upsert({ where: { id: report.id }, update: report, create: report })
  }

  const dailyMetrics = [
    ['2026-08-01', 41000, 12000, 350, 28], ['2026-08-03', 56000, 18000, 440, 34],
    ['2026-08-05', 62000, 20000, 510, 39], ['2026-08-07', 48000, 16000, 390, 31],
    ['2026-08-09', 52000, 17000, 420, 35], ['2026-08-11', 71000, 23000, 580, 46],
    ['2026-08-13', 65000, 21000, 540, 42], ['2026-08-15', 80000, 26000, 650, 51],
    ['2026-08-17', 78000, 25000, 620, 49], ['2026-08-19', 96000, 30000, 790, 63],
    ['2026-08-21', 102000, 34000, 850, 68], ['2026-08-23', 115000, 39000, 940, 75],
  ] as const
  for (const [date, impressions, clicks, favorites, newUsers] of dailyMetrics) {
    const data = { date: new Date(`${date}T00:00:00+08:00`), impressions, clicks, favorites, newUsers }
    await prisma.dailyMetric.upsert({ where: { date: data.date }, update: data, create: data })
  }
}

main()
  .then(() => console.log('[Seed] MySQL development data is ready.'))
  .finally(() => prisma.$disconnect())
