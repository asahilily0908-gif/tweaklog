// Pure score calculation functions — no external imports

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

// Improvement direction for known KPIs
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

// --- Date helpers ---

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
): { beforeStart: string; beforeEnd: string; afterStart: string; afterEnd: string } {
  const changeDate = createdAt.split('T')[0]
  return {
    beforeStart: addDays(changeDate, -days),
    beforeEnd: addDays(changeDate, -1),
    afterStart: changeDate,
    afterEnd: addDays(changeDate, days - 1),
  }
}

// --- Aggregation helpers ---

function filterByPeriod(outcomes: OutcomeRow[], start: string, end: string): OutcomeRow[] {
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
    const existing = map.get(o.date) ?? { impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0 }
    existing.impressions += Number(o.impressions)
    existing.clicks += Number(o.clicks)
    existing.cost += Number(o.cost)
    existing.conversions += Number(o.conversions)
    existing.revenue += Number(o.revenue)
    map.set(o.date, existing)
  }
  return Array.from(map.values())
}

function avgOfDays(days: DailyTotals[], extractor: (d: DailyTotals) => number): number | null {
  if (days.length === 0) return null
  const sum = days.reduce((acc, d) => acc + extractor(d), 0)
  return sum / days.length
}

// --- KPI value extraction ---

function extractKpiValue(kpi: string, totals: DailyTotals): number {
  switch (kpi) {
    case 'revenue': return totals.revenue
    case 'conversions': return totals.conversions
    case 'impressions': return totals.impressions
    case 'clicks': return totals.clicks
    case 'cost': return totals.cost
    case 'cpa': return totals.conversions > 0 ? totals.cost / totals.conversions : 0
    case 'cpc': return totals.clicks > 0 ? totals.cost / totals.clicks : 0
    case 'roas': return totals.cost > 0 ? totals.revenue / totals.cost : 0
    case 'cvr': return totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
    case 'ctr': return totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
    default: return totals.conversions
  }
}

// --- Score mapping ---

function changePctToScore(changePct: number | null, direction: ImprovementDirection): number {
  if (changePct === null) return 0

  // For 'down' direction, a decrease is good → invert sign
  const effective = direction === 'down' ? -changePct : changePct

  const abs = Math.abs(effective)
  let magnitude: number
  if (abs < 2) magnitude = 0
  else if (abs < 5) magnitude = 1
  else if (abs < 10) magnitude = 2
  else if (abs < 20) magnitude = 3
  else magnitude = 4

  const score = effective >= 0 ? magnitude : -magnitude
  return Math.max(-4, Math.min(4, score))
}

function computeChangePct(before: number | null, after: number | null): number | null {
  if (before === null || after === null || before === 0) return null
  return ((after - before) / Math.abs(before)) * 100
}

// --- Main orchestrator ---

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

export function computeImpactForExperiment(
  experiment: { created_at: string },
  outcomes: OutcomeRow[],
  northStarKpi: string,
  subKpis: string[]
): ImpactResult {
  const range = getDateRange(experiment.created_at)

  const beforeOutcomes = filterByPeriod(outcomes, range.beforeStart, range.beforeEnd)
  const afterOutcomes = filterByPeriod(outcomes, range.afterStart, range.afterEnd)

  const beforeDays = aggregateByDate(beforeOutcomes)
  const afterDays = aggregateByDate(afterOutcomes)

  // Compute metrics: North Star, Cost, then sub KPIs
  const metrics: MetricResult[] = []

  const northStarMetric = computeMetric(northStarKpi, beforeDays, afterDays)
  metrics.push(northStarMetric)

  // Always include Cost unless it's already the north star
  if (northStarKpi !== 'cost') {
    metrics.push(computeMetric('cost', beforeDays, afterDays))
  }

  // Sub KPIs (skip if already included)
  const included = new Set(metrics.map((m) => m.metricName))
  for (const kpi of subKpis) {
    if (!included.has(kpi)) {
      metrics.push(computeMetric(kpi, beforeDays, afterDays))
      included.add(kpi)
    }
  }

  const northStarDirection = KPI_DIRECTION[northStarKpi] ?? 'up'
  const score = changePctToScore(northStarMetric.changePct, northStarDirection)

  return {
    score,
    northStarChangePct: northStarMetric.changePct,
    metrics,
  }
}
