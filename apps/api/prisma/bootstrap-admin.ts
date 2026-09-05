import { config } from 'dotenv'
import { randomUUID } from 'node:crypto'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'
import { ADMIN_PERMISSIONS, ROLE_PERMISSIONS } from '../src/modules/admin-auth/admin-auth.constants'
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

async function main() {
  const username = required('ADMIN_BOOTSTRAP_USERNAME').toLowerCase()
  const password = required('ADMIN_BOOTSTRAP_PASSWORD')
  const displayName = process.env.ADMIN_BOOTSTRAP_DISPLAY_NAME?.trim() || username
  if (username.length < 3 || username.length > 64) throw new Error('ADMIN_BOOTSTRAP_USERNAME must be 3-64 characters')
  if (password.length < 12 || password.length > 128) throw new Error('ADMIN_BOOTSTRAP_PASSWORD must be 12-128 characters')

  const existingSuperAdmin = await prisma.adminUser.findFirst({ where: { roles: { some: { role: { code: 'super_admin' } } } } })
  if (existingSuperAdmin) throw new Error('A super_admin already exists; bootstrap refused')

  for (const code of ADMIN_PERMISSIONS) {
    await prisma.adminPermission.upsert({ where: { code }, update: {}, create: { id: randomUUID(), code } })
  }
  for (const [code, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.adminRole.upsert({ where: { code }, update: { name: code }, create: { id: randomUUID(), code, name: code } })
    for (const permissionCode of permissions) {
      const permission = await prisma.adminPermission.findUniqueOrThrow({ where: { code: permissionCode } })
      await prisma.adminRolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      })
    }
  }

  const passwordHash = await hashAdminPassword(password)
  const user = await prisma.adminUser.create({ data: { id: randomUUID(), username, displayName, passwordHash } })
  const superAdmin = await prisma.adminRole.findUniqueOrThrow({ where: { code: 'super_admin' } })
  await prisma.adminUserRole.create({ data: { adminUserId: user.id, roleId: superAdmin.id } })
  console.log(`[Admin Bootstrap] super_admin created for ${username}; password was not logged.`)
}

main().finally(() => prisma.$disconnect())
