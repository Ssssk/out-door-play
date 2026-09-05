import { config } from 'dotenv'
import { randomUUID } from 'node:crypto'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'
import { hashAdminPassword } from '../src/modules/admin-auth/admin-auth.crypto'

config({ path: ['.env', '.env.development'], quiet: true })
const prefix = 'qa_rbac_'
const databaseUrl = new URL(process.env.DATABASE_URL || '')
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

async function cleanup() {
  const users = await prisma.adminUser.findMany({ where: { username: { startsWith: prefix } }, select: { id: true } })
  const ids = users.map(({ id }) => id)
  if (ids.length) {
    await prisma.auditLog.deleteMany({ where: { adminUserId: { in: ids } } })
    await prisma.adminUser.deleteMany({ where: { id: { in: ids } } })
  }
}

async function create() {
  await cleanup()
  const passwordHash = await hashAdminPassword('Qa-Rbac-Only-2026!')
  for (const roleCode of ['analyst', 'content_reviewer', 'operator', 'super_admin']) {
    const role = await prisma.adminRole.findUniqueOrThrow({ where: { code: roleCode } })
    await prisma.adminUser.create({ data: {
      id: randomUUID(),
      username: `${prefix}${roleCode}`,
      displayName: `RBAC ${roleCode}`,
      passwordHash,
      roles: { create: { roleId: role.id } },
    } })
  }
}

const action = process.env.RBAC_FIXTURE_ACTION
if (action !== 'create' && action !== 'cleanup') throw new Error('RBAC_FIXTURE_ACTION must be create or cleanup')

void (action === 'create' ? create() : cleanup())
  .then(() => console.log(`[RBAC fixture] ${action} complete`))
  .finally(() => prisma.$disconnect())
