import { config } from 'dotenv'
import { randomUUID } from 'node:crypto'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'
import { ADMIN_PERMISSIONS, ROLE_PERMISSIONS } from '../src/modules/admin-auth/admin-auth.constants'

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
 * 幂等同步权限码与角色-权限绑定。与 bootstrap-admin 的区别：
 * bootstrap 只允许首次初始化（已存在 super_admin 会拒绝）；本脚本可在存量库上重复执行，
 * 用于新增权限码（如 config:read / config:write）后同步到各角色。
 */
async function main() {
  const permissionIds = new Map<string, string>()
  for (const code of ADMIN_PERMISSIONS) {
    const permission = await prisma.adminPermission.upsert({
      where: { code },
      update: {},
      create: { id: randomUUID(), code },
    })
    permissionIds.set(code, permission.id)
  }

  const roles = await prisma.adminRole.findMany({ select: { id: true, code: true } })
  let linked = 0
  for (const role of roles) {
    const permissions = ROLE_PERMISSIONS[role.code]
    if (!permissions) continue
    for (const permissionCode of permissions) {
      const permissionId = permissionIds.get(permissionCode)
      if (!permissionId) continue
      const result = await prisma.adminRolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      })
      if (result) linked += 1
    }
  }
  console.log(`权限码 ${ADMIN_PERMISSIONS.length} 个已同步；角色 ${roles.length} 个，绑定关系 ${linked} 条。`)
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1 })
  .finally(() => { void prisma.$disconnect() })
