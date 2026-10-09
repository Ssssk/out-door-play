import { Injectable, Logger } from '@nestjs/common'
import type { GeoPoint } from '../../common/geo'
import type { StationPage, StationProvider } from './station-provider'

/**
 * 数据源自动故障转移（熔断）：主源（高德）优先，连续失败达到阈值后自动切备源（天地图），
 * 主源恢复后自动切回。用于「先用完高德额度，天地图兜底」的运营策略。
 *
 * 行为：
 * - `primaryFailures` 跨同步轮次累计（进程内存）：高德日配额耗尽的当天，每一轮都会失败，
 *   累计到阈值即熔断，之后所有请求走备源；次日额度重置、主源成功一次即清零切回；
 * - 单城失败（返回 null）也会累计并在当轮立即用备源补位，避免某城市缺数据；
 * - 阈值取 2：一次失败可能是偶发，连续两轮失败才认定主源不可用。
 */

const BREAK_THRESHOLD = 2

@Injectable()
export class FailoverStationProvider implements StationProvider {
  private readonly logger = new Logger(FailoverStationProvider.name)
  private primaryFailures = 0

  constructor(
    private readonly primary: StationProvider,
    private readonly fallback: StationProvider,
    private readonly primaryName = '高德',
    private readonly fallbackName = '天地图',
  ) {}

  get primaryHealthy(): boolean {
    return this.primaryFailures < BREAK_THRESHOLD
  }

  sampleCenters(center: GeoPoint): GeoPoint[] {
    return this.primary.sampleCenters(center)
  }

  async fetchPage(center: GeoPoint, opts?: { cityCode?: string }): Promise<StationPage | null> {
    const useFallbackFirst = this.primaryFailures >= BREAK_THRESHOLD

    if (useFallbackFirst) {
      const result = await this.fallback.fetchPage(center, opts)
      if (result) return result
      // 备源也失败：回头再试一次主源（可能是备源抖动）；主源仍失败则保持熔断状态
      const primaryResult = await this.primary.fetchPage(center, opts)
      if (primaryResult) {
        this.primaryFailures = 0
        this.logger.log(`${this.primaryName} 恢复正常，切回主数据源`)
        return primaryResult
      }
      this.primaryFailures = Math.max(this.primaryFailures, BREAK_THRESHOLD)
      return null
    }

    const result = await this.primary.fetchPage(center, opts)
    if (result) {
      if (this.primaryFailures > 0) this.logger.log(`${this.primaryName} 恢复正常，故障计数清零`)
      this.primaryFailures = 0
      return result
    }

    this.primaryFailures += 1
    if (this.primaryFailures >= BREAK_THRESHOLD) {
      this.logger.warn(
        `${this.primaryName} 连续 ${this.primaryFailures} 轮失败，触发熔断：后续同步改用 ${this.fallbackName}，主源恢复后自动切回`,
      )
    } else {
      this.logger.warn(`${this.primaryName} 本轮失败（第 ${this.primaryFailures} 次），下次尝试 ${this.fallbackName} 兜底`)
    }
    const fallbackResult = await this.fallback.fetchPage(center, opts)
    if (fallbackResult) {
      this.logger.log(`${this.fallbackName} 兜底成功：取到 ${fallbackResult.items.length} 条`)
      return fallbackResult
    }
    this.logger.warn(`${this.fallbackName} 兜底也失败：本轮该城市无数据`)
    return null
  }
}
