/**
 * CHG-SCENE-EXPANSION-001 · Migrate 阶段数据回填（**默认 dry-run，不写库**）
 *
 * 用法：
 *   pnpm --filter @chumen/api backfill:scene-play
 *   pnpm --filter @chumen/api backfill:scene-play:apply
 *
 * 约束：
 * - 必须先在目标库执行 Expand Migration 并确认备份点可恢复；
 * - `--apply` 是唯一写入开关，生产执行还需针对目标、环境、动作的明确授权；
 * - 幂等：discoveries 条件 `WHERE scene='fish' AND sub_type IS NULL`；其余目标只在含 fish 时改写，
 *   重复执行变更数为 0；
 * - 输出含反向清单与恢复 SQL，恢复 SQL 限定 id 清单，禁止无条件全表更新。
 */
import { createHash, randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { config } from 'dotenv'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client'
import { DEFAULT_SCENE_TABS } from '../common/scenes'

config({ path: ['.env', '.env.development'], quiet: true })

const SCENE_TABS_CONFIG_KEY = 'scene_tabs'
const BACKFILL_SQL = "UPDATE `discoveries` SET `scene`='play', `sub_type`='fishing' WHERE `scene`='fish' AND `sub_type` IS NULL"
const RANKING_SQL = "UPDATE `rankings` SET `scene`='play' WHERE `scene`='fish'"

interface Counts {
  discoveries: number
  rankings: number
  cities: number
  sceneTabsConfig: number
}

interface AuditRecord {
  changeId: string
  batchId: string
  mode: 'dry-run' | 'apply'
  generatedAt: string
  operator: string
  backfillSql: string
  sqlSha256: string
  preview: Counts
  applied: Counts | null
  discoveryIds: string[]
  cityCodes: string[]
  restoreSql: string
  note: string
}

function adapter() {
  const url = new URL(process.env.DATABASE_URL || '')
  if (!url.hostname) throw new Error('DATABASE_URL 未配置，拒绝连接')
  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    allowPublicKeyRetrieval: process.env.DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL === 'true',
    connectionLimit: 2,
  })
}

/** City.scenes 是资料标记 JSON：fish → play、去重、保留既有顺序，不新增无关场景 */
function normalizeCityScenes(raw: unknown[]): string[] {
  const next: string[] = []
  for (const value of raw) {
    const scene = value === 'fish' ? 'play' : value
    if (typeof scene === 'string' && !next.includes(scene)) next.push(scene)
  }
  return next
}

function hasLegacyConfigTab(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const items = (value as Record<string, unknown>).items
  return Array.isArray(items) && items.some((item) => item && typeof item === 'object' && (item as Record<string, unknown>).scene === 'fish')
}

async function main() {
  const apply = process.argv.includes('--apply')
  const outputIndex = process.argv.indexOf('--output')
  const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : undefined
  const prisma = new PrismaClient({ adapter: adapter() })
  const startedAt = new Date()

  try {
    const discoveryRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT \`id\` FROM \`discoveries\` WHERE \`scene\` = 'fish' AND \`sub_type\` IS NULL ORDER BY \`id\``
    const rankingRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT \`id\` FROM \`rankings\` WHERE \`scene\` = 'fish' ORDER BY \`id\``
    const ids = discoveryRows.map((row) => row.id)

    const cities = await prisma.city.findMany({ select: { code: true, scenes: true } })
    const cityTargets = cities
      .filter((city) => Array.isArray(city.scenes) && (city.scenes as unknown[]).includes('fish'))
      .map((city) => ({ code: city.code, scenes: normalizeCityScenes(city.scenes as unknown[]) }))

    const configRecord = await prisma.systemConfig.findUnique({ where: { key: SCENE_TABS_CONFIG_KEY } })
    const configNeedsRepair = hasLegacyConfigTab(configRecord?.value)

    const preview: Counts = {
      discoveries: ids.length,
      rankings: rankingRows.length,
      cities: cityTargets.length,
      sceneTabsConfig: configNeedsRepair ? 1 : 0,
    }

    let applied: Counts | null = null
    if (apply) {
      // 事务内不等待任何外部 HTTP / Redis / MQ 确认（AGENTS.md §6 红线 8）
      const [discoveries, rankings] = await prisma.$transaction([
        prisma.$executeRaw`UPDATE \`discoveries\` SET \`scene\` = 'play', \`sub_type\` = 'fishing' WHERE \`scene\` = 'fish' AND \`sub_type\` IS NULL`,
        prisma.$executeRaw`UPDATE \`rankings\` SET \`scene\` = 'play' WHERE \`scene\` = 'fish'`,
      ])
      if (discoveries !== ids.length) {
        throw new Error(`回填行数与预览不一致（预览 ${ids.length}，实执行 ${discoveries}），请人工核查`)
      }

      let cityCount = 0
      for (const city of cityTargets) {
        await prisma.city.update({ where: { code: city.code }, data: { scenes: city.scenes } })
        cityCount += 1
      }

      let configCount = 0
      if (configNeedsRepair) {
        const stored = configRecord?.value as { revision?: unknown } | null
        const revision = typeof stored?.revision === 'number' && Number.isInteger(stored.revision) ? stored.revision + 1 : 1
        // 残留 fish 的旧配置按裁决「服务端 3 项默认」整份替换，不保留隐藏项与旧命名
        await prisma.systemConfig.update({
          where: { key: SCENE_TABS_CONFIG_KEY },
          data: { value: { revision, items: DEFAULT_SCENE_TABS.map((item) => ({ ...item })) } as object },
        })
        configCount = 1
      }

      applied = { discoveries, rankings, cities: cityCount, sceneTabsConfig: configCount }
    }

    const quoted = ids.map((id) => `'${id.replace(/'/gu, "''")}'`).join(', ')
    const audit: AuditRecord = {
      changeId: 'CHG-SCENE-EXPANSION-001',
      batchId: randomUUID(),
      mode: apply ? 'apply' : 'dry-run',
      generatedAt: startedAt.toISOString(),
      operator: process.env.BACKFILL_OPERATOR || 'unknown',
      backfillSql: BACKFILL_SQL,
      sqlSha256: createHash('sha256').update(`${BACKFILL_SQL}\n${RANKING_SQL}`).digest('hex'),
      preview,
      applied,
      discoveryIds: ids,
      cityCodes: cityTargets.map((city) => city.code),
      restoreSql: ids.length
        ? `UPDATE \`discoveries\` SET \`scene\`='fish', \`sub_type\`=NULL WHERE \`id\` IN (${quoted}) AND \`scene\`='play' AND \`sub_type\`='fishing';`
        : '-- 无需恢复：没有受影响行',
      note: 'rankings / cities / system_configs 的恢复需使用发布前备份点按 id 清单还原；本脚本不自动反向更新这些表',
    }

    const json = JSON.stringify(audit, null, 2)
    if (outputPath) writeFileSync(outputPath, json, 'utf8')
    console.log(json)
    console.log(`[backfill] mode=${audit.mode} preview=${preview.discoveries} discoveries / ${preview.rankings} rankings / ${preview.cities} cities / ${preview.sceneTabsConfig} config finishedAt=${new Date().toISOString()}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error('[backfill] failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
