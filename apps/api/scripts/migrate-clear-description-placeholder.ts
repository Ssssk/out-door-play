import { config } from 'dotenv'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'

/**
 * 一次性数据清理：历史上 `createRoute` 在简介留空时会把字面量「暂无描述」写进
 * description 列。它是数据不是标记——编辑弹窗会把它当真实内容回填、小程序会把它
 * 当正文渲染，导致「简介保存了但依然为空」的假象。统一清回空串（2026-10 起
 * createRoute 已改为留空存 ''，本脚本只兜底清理存量数据）。
 */

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

const PLACEHOLDER = '暂无描述'

async function main() {
  const result = await prisma.discovery.updateMany({
    where: { description: { in: [PLACEHOLDER, '暂无简介', '暂无'] } },
    data: { description: '' },
  })
  console.log(`[Description Placeholder] cleared=${result.count}`)
}

main()
  .catch((error: unknown) => {
    console.error('[Description Placeholder] migration failed', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
