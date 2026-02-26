// KPI anomaly detection — pure functions, no external imports

// ─── Types ──────────────────────────────────────────────

export interface KpiDataPoint {
  date: string // YYYY-MM-DD
  value: number | null
}

export interface HighlightResult {
  date: string
  metricName: string
  value: number
  mean: number
  stdDev: number
  changePercent: number // deviation from mean (%)
  severity: 'warning' | 'critical' // warning: >2σ, critical: >3σ
}

// ─── Statistics ─────────────────────────────────────────

/**
 * 平均と標準偏差を算出する
 */
export function calculateStdDev(values: number[]): {
  mean: number
  stdDev: number
} {
  if (values.length === 0) return { mean: 0, stdDev: 0 }

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length

  const squaredDiffs = values.map((v) => (v - mean) ** 2)
  const variance =
    squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length
  const stdDev = Math.sqrt(variance)

  return { mean, stdDev }
}

// ─── Detection ──────────────────────────────────────────

/**
 * KPIデータの急変動を検知する
 *
 * 直近 lookbackDays 日の平均・標準偏差を算出し、
 * 閾値を超えるデータポイントを返す。
 *
 * - |value - mean| > 3σ → critical
 * - |value - mean| > 2σ → warning
 * - stdDev が 0（全値同一）→ ハイライトなし
 * - データが 5日未満 → ハイライトなし
 */
export function detectHighlights(
  data: KpiDataPoint[],
  metricName: string,
  lookbackDays = 30
): HighlightResult[] {
  // Filter out null values
  const valid = data
    .filter((d): d is { date: string; value: number } => d.value !== null)
    .slice(-lookbackDays)

  // Need at least 5 data points for statistical significance
  if (valid.length < 5) return []

  const values = valid.map((d) => d.value)
  const { mean, stdDev } = calculateStdDev(values)

  // All values identical — no anomalies possible
  if (stdDev === 0) return []

  const results: HighlightResult[] = []

  for (const point of valid) {
    const deviation = Math.abs(point.value - mean)
    const changePercent =
      mean === 0 ? 0 : ((point.value - mean) / mean) * 100

    if (deviation > 3 * stdDev) {
      results.push({
        date: point.date,
        metricName,
        value: point.value,
        mean,
        stdDev,
        changePercent,
        severity: 'critical',
      })
    } else if (deviation > 2 * stdDev) {
      results.push({
        date: point.date,
        metricName,
        value: point.value,
        mean,
        stdDev,
        changePercent,
        severity: 'warning',
      })
    }
  }

  return results
}

/**
 * 複数指標のハイライトをまとめて検知
 */
export function detectAllHighlights(
  metricsData: Array<{ metricName: string; data: KpiDataPoint[] }>,
  lookbackDays = 30
): HighlightResult[] {
  const all: HighlightResult[] = []

  for (const { metricName, data } of metricsData) {
    all.push(...detectHighlights(data, metricName, lookbackDays))
  }

  // Sort by date descending, then severity (critical first)
  return all.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date)
    if (dateCompare !== 0) return dateCompare
    if (a.severity === 'critical' && b.severity === 'warning') return -1
    if (a.severity === 'warning' && b.severity === 'critical') return 1
    return 0
  })
}
