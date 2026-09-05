import { HttpException, HttpStatus, Injectable } from '@nestjs/common'

interface AttemptWindow { count: number; resetAt: number }

@Injectable()
export class LoginThrottleService {
  private readonly attempts = new Map<string, AttemptWindow>()

  assertAllowed(key: string, now = Date.now()) {
    const current = this.attempts.get(key)
    if (!current || current.resetAt <= now) {
      this.attempts.set(key, { count: 0, resetAt: now + 15 * 60 * 1_000 })
      return
    }
    if (current.count >= 10) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1_000))
      throw new HttpException({ message: '登录尝试过多，请稍后再试', code: 'ADMIN_LOGIN_THROTTLED', retryAfter }, HttpStatus.TOO_MANY_REQUESTS)
    }
  }

  recordFailure(key: string, now = Date.now()) {
    const current = this.attempts.get(key)
    if (!current || current.resetAt <= now) this.attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1_000 })
    else current.count += 1
  }

  clear(key: string) { this.attempts.delete(key) }
}
