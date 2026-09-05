import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'
const KEY_LENGTH = 64
const PARAMS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const

async function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(password, salt, KEY_LENGTH, PARAMS, (error, key) => error ? reject(error) : resolve(key))
  })
}

export async function hashAdminPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await derive(password, salt)
  return `scrypt$v1$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64url')}$${key.toString('base64url')}`
}

export async function verifyAdminPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split('$')
  if (parts.length !== 7 || parts[0] !== 'scrypt' || parts[1] !== 'v1') {
    await consumePasswordCost(password)
    return false
  }
  const [, , n, r, p, saltValue, keyValue] = parts
  if (Number(n) !== PARAMS.N || Number(r) !== PARAMS.r || Number(p) !== PARAMS.p || !saltValue || !keyValue) {
    await consumePasswordCost(password)
    return false
  }
  try {
    const actual = await derive(password, Buffer.from(saltValue, 'base64url'))
    const expected = Buffer.from(keyValue, 'base64url')
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

export async function consumePasswordCost(password: string): Promise<void> {
  const actual = await derive(password, Buffer.from('admin-auth-dummy-salt-v1'))
  timingSafeEqual(actual, Buffer.alloc(KEY_LENGTH, 0x5a))
}

export function randomToken(): string {
  return randomBytes(32).toString('base64url')
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function safeHashEquals(value: string, expectedHash: string): boolean {
  const actual = Buffer.from(sha256(value), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
