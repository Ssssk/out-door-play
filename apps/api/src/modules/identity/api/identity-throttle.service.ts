import { HttpException, HttpStatus, Injectable } from '@nestjs/common'

interface AttemptWindow { count: number; resetAt: number }

@Injectable()
export class IdentityThrottleService {
  private readonly attempts = new Map<string, AttemptWindow>()

  consume(key: string, now = Date.now()): void {
    this.prune(now)
    const current = this.attempts.get(key)
    if (!current || current.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1_000 })
      return
    }
    if (current.count >= 20) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1_000))
      throw new HttpException({ code: 'AUTH_RATE_LIMITED', message: '登录请求过于频繁，请稍后再试', retryAfter }, HttpStatus.TOO_MANY_REQUESTS)
    }
    current.count += 1
  }

  private prune(now: number): void {
    if (this.attempts.size < 10_000) return
    for (const [key, value] of this.attempts) if (value.resetAt <= now) this.attempts.delete(key)
  }
}
