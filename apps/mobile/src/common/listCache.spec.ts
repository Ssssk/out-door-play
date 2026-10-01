import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearListCache, readListCache, writeListCache } from './listCache'

describe('listCache', () => {
  beforeEach(() => {
    clearListCache()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    clearListCache()
  })

  it('returns the stored value before the TTL elapses', () => {
    writeListCache('routes:420100:drive', [{ id: 'a' }])

    vi.advanceTimersByTime(60 * 1000)
    expect(readListCache<Array<{ id: string }>>('routes:420100:drive')).toEqual([{ id: 'a' }])
  })

  it('expires the entry once the TTL elapses', () => {
    writeListCache('routes:420100:drive', [{ id: 'a' }])

    vi.advanceTimersByTime(5 * 60 * 1000 + 1)
    expect(readListCache('routes:420100:drive')).toBeNull()
  })

  it('keeps separate entries per key', () => {
    writeListCache('routes:420100:drive', ['wuhan'])
    writeListCache('routes:420100:fish', ['spots'])

    expect(readListCache('routes:420100:drive')).toEqual(['wuhan'])
    expect(readListCache('routes:420100:fish')).toEqual(['spots'])
    expect(readListCache('routes:110000:drive')).toBeNull()
  })
})
