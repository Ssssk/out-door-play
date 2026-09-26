import { config } from 'dotenv'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'
import { migrateRouteCoverAssets } from '../src/data/route-cover-assets'

config({ path: ['.env', '.env.development'], quiet: true })

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
  const result = await migrateRouteCoverAssets(prisma)
  console.log(`[Route Covers] migrated=${result.migrated}, matchedLegacyRoutes=${result.matchedLegacyRoutes}, uploadDir=${result.uploadDir}`)
}

main()
  .catch((error: unknown) => {
    console.error('[Route Covers] migration failed', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
