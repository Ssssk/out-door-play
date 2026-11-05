import { config } from 'dotenv'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'
import { buildSnapshotRows, load98Anchors, loadPriceHistory } from '../src/modules/fuel/price-history.provider'

/**
 * 一次性回填最近半年的历次调价（92/95/0 真实值 + 98# 按 95# 涨跌反推）。
 * 由 Deploy production 工作流在迁移与重启之后执行；唯一约束 + skipDuplicates 保证幂等，
 * 且不会覆盖线上 /fuel/prices 实时写入的快照。失败只告警、不阻断部署。
 */
config({ path: ['.env', '.env.development'], quiet: true })

const BACKFILL_MONTHS = 6
const BATCH_SIZE = 500

const rawDatabaseUrl = process.env.DATABASE_URL
if (!rawDatabaseUrl) throw new Error('DATABASE_URL is required')
const databaseUrl = new URL(rawDatabaseUrl)
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
  const since = new Date()
  since.setUTCMonth(since.getUTCMonth() - BACKFILL_MONTHS)

  const periods = await loadPriceHistory(since)
  if (periods.length === 0) {
    console.warn('[Fuel Backfill] 未取到任何调价明细，跳过回填')
    return
  }

  // 98# 反推依赖「当期锚点」与最新调价日对齐；源滞后时宁可跳过 98#，也不写错位的历史
  let anchors = await load98Anchors().catch(() => [])
  const anchorDate = anchors[0]?.date
  if (anchors.length && anchorDate !== periods[0].date) {
    console.warn(`[Fuel Backfill] 98# 锚点日期 ${anchorDate} 与最新调价日 ${periods[0].date} 不一致，本轮跳过 98#`)
    anchors = []
  }

  const rows = buildSnapshotRows(periods, anchors)
  let created = 0
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const result = await prisma.fuelPriceSnapshot.createMany({
      data: rows.slice(start, start + BATCH_SIZE),
      skipDuplicates: true,
    })
    created += result.count
  }
  console.log(`[Fuel Backfill] 半年 ${periods.length} 期、${periods[0].regions.length} 省；98# 锚点 ${anchors.length} 省；组装 ${rows.length} 行，新增 ${created} 行`)
}

main()
  .catch((error: unknown) => {
    // 回填属于增强数据，失败不能让部署变红；下次部署会重试
    console.warn('[Fuel Backfill] 回填失败（不影响服务），下次部署将重试：', error)
  })
  .finally(() => prisma.$disconnect())
