// Pure score calculation functions — no external imports

// ─── Types ──────────────────────────────────────────────

export interface OutcomeRow {
  date: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  revenue: number
}

export type ImprovementDirection = 'up' | 'down'

export interface MetricResult {
  metricName: string
  displayName: string
  beforeAvg: number | null
  afterAvg: number | null
  changePct: number | null
  improved: boolean | null
  improvementDirection: ImprovementDirection
}

export interface ImpactResult {
  score: number // -4 to +4
  northStarChangePct: number | null
  metrics: MetricResult[]
}

// ─── New public API ─────────────────────────────────────

/**
 * 北極星KPIの変化率から9段階スコア(-4〜+4)を算出する
 *
 * Thresholds (after direction normalization):
 *  +30% 以上 → +4,  +20%〜+30% → +3,  +10%〜+20% → +2,
 *  +5%〜+10% → +1,  -5%〜+5% → 0,     -10%〜-5% → -1,
 *  -20%〜-10% → -2,  -30%〜-20% → -3,  -30% 以下 → -4
 */
export function calculateScore(
  changePercent: number,
  improvementDirection: ImprovementDirection
): number {
  // For 'down' direction (e.g. CPA), a decrease is good → invert
  const effective =
    improvementDirection === 'down' ? -changePercent : changePercent

  if (effective >= 30) return 4
  if (effective >= 20) return 3
  if (effective >= 10) return 2
  if (effective >= 5) return 1
  if (effective > -5) return 0
  if (effective > -10) return -1
  if (effective > -20) return -2
  if (effective > -30) return -3
  return -4
}

/**
 * 変化率を算出する。beforeValue が 0 の場合は null を返す。
 */
export function calculateChangePercent(
  beforeValue: number,
  afterValue: number
): number | null {
  if (beforeValue === 0) return null
  return ((afterValue - beforeValue) / beforeValue) * 100
}

/**
 * スコアに対応する色情報を返す
 */
export function getScoreColor(score: number): {
  bg: string
  text: string
  border: string
  label: string
} {
  if (score >= 3)
    return {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-300',
      label: '大幅改善',
    }
  if (score === 2)
    return {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      label: '改善',
    }
  if (score === 1)
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      label: 'やや改善',
    }
  if (score === 0)
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-500',
      border: 'border-slate-200',
      label: '変化なし',
    }
  if (score === -1)
    return {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
      label: 'やや悪化',
    }
  if (score === -2)
    return {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      label: '悪化',
    }
  // -3 or -4
  return {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    label: '大幅悪化',
  }
}

// ─── Direction & display name lookups ───────────────────

const KPI_DIRECTION: Record<string, ImprovementDirection> = {
  revenue: 'up',
  conversions: 'up',
  impressions: 'up',
  clicks: 'up',
  cpa: 'down',
  cpc: 'down',
  cost: 'down',
  roas: 'up',
  cvr: 'up',
  ctr: 'up',
}

const KPI_DISPLAY_NAMES: Record<string, string> = {
  revenue: 'Revenue',
  conversions: 'Conversions',
  impressions: 'Impressions',
  clicks: 'Clicks',
  cost: 'Cost',
  cpa: 'CPA',
  cpc: 'CPC',
  roas: 'ROAS',
  cvr: 'CVR',
  ctr: 'CTR',
}

// ─── Date helpers ───────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

export function getDateRange(
  createdAt: string,
  days = 7
): {
  beforeStart: string
  beforeEnd: string
  afterStart: string
  afterEnd: string
} {
  const changeDate = createdAt.split('T')[0]
  return {
    beforeStart: addDays(changeDate, -days),
    beforeEnd: addDays(changeDate, -1),
    afterStart: changeDate,
    afterEnd: addDays(changeDate, days - 1),
  }
}

// ─── Aggregation helpers ────────────────────────────────

function filterByPeriod(
  outcomes: OutcomeRow[],
  start: string,
  end: string
): OutcomeRow[] {
  return outcomes.filter((o) => o.date >= start && o.date <= end)
}

interface DailyTotals {
  impressions: number
  clicks: number
  cost: number
  conversions: number
  revenue: number
}

function aggregateByDate(outcomes: OutcomeRow[]): DailyTotals[] {
  const map = new Map<string, DailyTotals>()
  for (const o of outcomes) {
    const existing = map.get(o.date) ?? {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      revenue: 0,
    }
    existing.impressions += Number(o.impressions)
    existing.clicks += Number(o.clicks)
    existing.cost += Number(o.cost)
    existing.conversions += Number(o.conversions)
    existing.revenue += Number(o.revenue)
    map.set(o.date, existing)
  }
  return Array.from(map.values())
}

function avgOfDays(
  days: DailyTotals[],
  extractor: (d: DailyTotals) => number
): number | null {
  if (days.length === 0) return null
  const sum = days.reduce((acc, d) => acc + extractor(d), 0)
  return sum / days.length
}

// ─── KPI value extraction ───────────────────────────────

function extractKpiValue(kpi: string, totals: DailyTotals): number {
  switch (kpi) {
    case 'revenue':
      return totals.revenue
    case 'conversions':
      return totals.conversions
    case 'impressions':
      return totals.impressions
    case 'clicks':
      return totals.clicks
    case 'cost':
      return totals.cost
    case 'cpa':
      return totals.conversions > 0 ? totals.cost / totals.conversions : 0
    case 'cpc':
      return totals.clicks > 0 ? totals.cost / totals.clicks : 0
    case 'roas':
      return totals.cost > 0 ? totals.revenue / totals.cost : 0
    case 'cvr':
      return totals.clicks > 0
        ? (totals.conversions / totals.clicks) * 100
        : 0
    case 'ctr':
      return totals.impressions > 0
        ? (totals.clicks / totals.impressions) * 100
        : 0
    default:
      return totals.conversions
  }
}

// ─── Internal score mapping (used by computeImpactForExperiment) ──

function computeChangePct(
  before: number | null,
  after: number | null
): number | null {
  if (before === null || after === null || before === 0) return null
  return ((after - before) / Math.abs(before)) * 100
}

// ─── Metric computation ─────────────────────────────────

function computeMetric(
  kpi: string,
  beforeDays: DailyTotals[],
  afterDays: DailyTotals[]
): MetricResult {
  const direction = KPI_DIRECTION[kpi] ?? 'up'
  const beforeAvg = avgOfDays(beforeDays, (d) => extractKpiValue(kpi, d))
  const afterAvg = avgOfDays(afterDays, (d) => extractKpiValue(kpi, d))
  const changePct = computeChangePct(beforeAvg, afterAvg)

  let improved: boolean | null = null
  if (changePct !== null) {
    improved = direction === 'up' ? changePct > 0 : changePct < 0
  }

  return {
    metricName: kpi,
    displayName: KPI_DISPLAY_NAMES[kpi] ?? kpi,
    beforeAvg,
    afterAvg,
    changePct,
    improved,
    improvementDirection: direction,
  }
}

// ─── Main orchestrator (backward compatible) ────────────

export function computeImpactForExperiment(
  experiment: { created_at: string },
  outcomes: OutcomeRow[],
  northStarKpi: string,
  subKpis: string[]
): ImpactResult {
  const range = getDateRange(experiment.created_at)

  const beforeOutcomes = filterByPeriod(
    outcomes,
    range.beforeStart,
    range.beforeEnd
  )
  const afterOutcomes = filterByPeriod(
    outcomes,
    range.afterStart,
    range.afterEnd
  )

  const beforeDays = aggregateByDate(beforeOutcomes)
  const afterDays = aggregateByDate(afterOutcomes)

  const metrics: MetricResult[] = []

  const northStarMetric = computeMetric(northStarKpi, beforeDays, afterDays)
  metrics.push(northStarMetric)

  if (northStarKpi !== 'cost') {
    metrics.push(computeMetric('cost', beforeDays, afterDays))
  }

  const included = new Set(metrics.map((m) => m.metricName))
  for (const kpi of subKpis) {
    if (!included.has(kpi)) {
      metrics.push(computeMetric(kpi, beforeDays, afterDays))
      included.add(kpi)
    }
  }

  const northStarDirection = KPI_DIRECTION[northStarKpi] ?? 'up'
  const score = calculateScore(
    northStarMetric.changePct ?? 0,
    northStarDirection
  )

  return {
    score,
    northStarChangePct: northStarMetric.changePct,
    metrics,
  }
}
