import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

function adapter() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required')
  const url = new URL(databaseUrl)

  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    allowPublicKeyRetrieval: process.env.DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL === 'true',
    connectionLimit: 10,
    connectTimeout: 5_000,
  })
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() { super({ adapter: adapter() }) }
  async onModuleInit() { await this.$connect() }
  async onModuleDestroy() { await this.$disconnect() }
}
