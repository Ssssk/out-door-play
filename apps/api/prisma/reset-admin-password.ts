import { config } from 'dotenv'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'
import { hashAdminPassword } from '../src/modules/admin-auth/admin-auth.crypto'

config({ path: ['.env', '.env.development'], quiet: true })

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

const databaseUrl = new URL(required('DATABASE_URL'))
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: decodeURIComponent(databaseUrl.pathname.slice(1)),
    allowPublicKeyRetrieval: process.env.DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL === 'true',
    connectionLimit: 2,
  }),
})

/**
 * 管理员密码重置（运维通道，由部署流程按需执行，不对外暴露接口）。
 * 环境变量：
 * - `ADMIN_BOOTSTRAP_USERNAME`：要重置的账号（必填）
 * - `ADMIN_RESET_PASSWORD`：新密码（≥12 位；未设置时回落 `ADMIN_BOOTSTRAP_PASSWORD`）
 * 同时清除失败计数与账号锁定，保证重置后立即可登录。
 */
async function main() {
  const username = required('ADMIN_BOOTSTRAP_USERNAME').toLowerCase()
  const password = (process.env.ADMIN_RESET_PASSWORD ?? process.env.ADMIN_BOOTSTRAP_PASSWORD ?? '').trim()
  if (password.length < 12 || password.length > 128) {
    throw new Error('新密码必须为 12-128 位（设置 ADMIN_RESET_PASSWORD 或 ADMIN_BOOTSTRAP_PASSWORD）')
  }

  const admin = await prisma.adminUser.findUnique({ where: { username } })
  if (!admin) throw new Error(`管理员账号不存在: ${username}`)

  const passwordHash = await hashAdminPassword(password)
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash, failedLoginCount: 0, lockedUntil: null, status: 'active' },
  })
  console.log(`[Admin Reset] ${username} 密码已重置，锁定与失败计数已清除；新密码未打印到任何日志。`)
}

main()
  .catch((error: unknown) => {
    console.error('[Admin Reset] 失败:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
