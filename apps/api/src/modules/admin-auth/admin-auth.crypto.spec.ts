import { describe, expect, it } from 'vitest'
import { hashAdminPassword, safeHashEquals, sha256, verifyAdminPassword } from './admin-auth.crypto'

describe('admin auth crypto', () => {
  it('GIVEN 密码 WHEN scrypt 哈希与校验 THEN 只接受原密码且编码不含明文', async () => {
    const encoded = await hashAdminPassword('Correct-Horse-2026!')
    expect(encoded).toMatch(/^scrypt\$v1\$/)
    expect(encoded).not.toContain('Correct-Horse-2026!')
    await expect(verifyAdminPassword('Correct-Horse-2026!', encoded)).resolves.toBe(true)
    await expect(verifyAdminPassword('Wrong-Horse-2026!', encoded)).resolves.toBe(false)
  })

  it('GIVEN token 摘要 WHEN 常量时间比较 THEN 伪造 token 被拒绝', () => {
    const digest = sha256('csrf-token')
    expect(safeHashEquals('csrf-token', digest)).toBe(true)
    expect(safeHashEquals('forged-token', digest)).toBe(false)
  })

  it('GIVEN 非法密码编码 WHEN 校验 THEN 安全失败而不抛出解析细节', async () => {
    await expect(verifyAdminPassword('some-password', 'broken')).resolves.toBe(false)
  })
})
