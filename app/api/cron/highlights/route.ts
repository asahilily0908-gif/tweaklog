import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  detectAllHighlights,
  type KpiDataPoint,
  type HighlightResult,
} from '@/lib/ai/highlight-detector'

// ─── Helpers ─────────────────────────────────────────────

function computeDerivedKpi(
  kpiName: string,
  totals: { impressions: number; clicks: number; cost: number; conversions: number; revenue: number }
): number | null {
  switch (kpiName) {
    case 'cpa': return totals.conversions > 0 ? totals.cost / totals.conversions : null
    case 'cpc': return totals.clicks > 0 ? totals.cost / totals.clicks : null
    case 'ctr': return totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : null
    case 'cvr': return totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : null
    case 'roas': return totals.cost > 0 ? totals.revenue / totals.cost : null
    case 'impressions': return totals.impressions
    case 'clicks': return totals.clicks
    case 'cost': return totals.cost
    case 'conversions': return totals.conversions
    case 'revenue': return totals.revenue
    default: return null
  }
}

const STANDARD_AND_DERIVED_KPIS = new Set([
  'impressions', 'clicks', 'cost', 'conversions', 'revenue',
  'cpa', 'cpc', 'ctr', 'cvr', 'roas',
])

// ─── Route Handler ───────────────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Create service role client (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 3. Fetch all projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, north_star_kpi, sub_kpis')

    if (projectsError) {
      return NextResponse.json({ error: `Failed to fetch projects: ${projectsError.message}` }, { status: 500 })
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ success: true, projectsProcessed: 0, highlightsUpserted: 0 })
    }

    let totalHighlights = 0
    const cutoffDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // 4. Process each project
    for (const project of projects) {
      // 4a. Fetch metric_configs names
      const { data: metricConfigs } = await supabase
        .from('metric_configs')
        .select('name')
        .eq('project_id', project.id)

      // 4b. Build unique KPI name list
      const kpiNames = new Set<string>()
      if (project.north_star_kpi) kpiNames.add(project.north_star_kpi)
      if (project.sub_kpis && Array.isArray(project.sub_kpis)) {
        for (const kpi of project.sub_kpis) kpiNames.add(kpi)
      }
      if (metricConfigs) {
        for (const mc of metricConfigs) {
          // Only include if it's a standard/derived KPI (skip custom formulas)
          if (STANDARD_AND_DERIVED_KPIS.has(mc.name)) {
            kpiNames.add(mc.name)
          }
        }
      }

      if (kpiNames.size === 0) continue

      // 4c. Fetch outcomes for last 35 days
      const { data: outcomes } = await supabase
        .from('outcomes')
        .select('date, impressions, clicks, cost, conversions, revenue, custom_columns')
        .eq('project_id', project.id)
        .gte('date', cutoffDate)
        .order('date', { ascending: true })

      if (!outcomes || outcomes.length === 0) continue

      // 4d. Aggregate outcomes by date
      const dailyTotals = new Map<string, {
        impressions: number
        clicks: number
        cost: number
        conversions: number
        revenue: number
        customColumns: Record<string, number>
      }>()

      for (const row of outcomes) {
        const existing = dailyTotals.get(row.date) ?? {
          impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0, customColumns: {},
        }
        existing.impressions += Number(row.impressions) || 0
        existing.clicks += Number(row.clicks) || 0
        existing.cost += Number(row.cost) || 0
        existing.conversions += Number(row.conversions) || 0
        existing.revenue += Number(row.revenue) || 0

        // Aggregate custom columns
        if (row.custom_columns && typeof row.custom_columns === 'object') {
          for (const [key, val] of Object.entries(row.custom_columns as Record<string, unknown>)) {
            const numVal = Number(val)
            if (!isNaN(numVal)) {
              existing.customColumns[key] = (existing.customColumns[key] ?? 0) + numVal
            }
          }
        }

        dailyTotals.set(row.date, existing)
      }

      // 4e. Build KpiDataPoint[] for each KPI
      const sortedDates = [...dailyTotals.keys()].sort()
      const metricsData: Array<{ metricName: string; data: KpiDataPoint[] }> = []

      for (const kpiName of kpiNames) {
        const dataPoints: KpiDataPoint[] = []

        for (const date of sortedDates) {
          const totals = dailyTotals.get(date)!

          // Try standard/derived KPI first
          let value = computeDerivedKpi(kpiName, totals)

          // Try custom_columns if not a standard KPI
          if (value === null && !STANDARD_AND_DERIVED_KPIS.has(kpiName)) {
            const customVal = totals.customColumns[kpiName]
            if (customVal !== undefined) value = customVal
          }

          dataPoints.push({ date, value })
        }

        metricsData.push({ metricName: kpiName, data: dataPoints })
      }

      // 4f. Run anomaly detection
      const highlights = detectAllHighlights(metricsData, 30)

      if (highlights.length === 0) continue

      // 4g. UPSERT into ai_highlights
      const rows = highlights.map((r: HighlightResult) => ({
        project_id: project.id,
        date: r.date,
        metric_name: r.metricName,
        change_pct: Math.round(r.changePercent * 10000) / 10000,
        related_experiment_ids: [],
        summary: `${r.severity === 'critical' ? '🔴' : '🟡'} ${r.metricName}: ${r.value.toFixed(2)} (mean: ${r.mean.toFixed(2)}, ${r.changePercent > 0 ? '+' : ''}${r.changePercent.toFixed(1)}%)`,
      }))

      const { error: upsertError } = await supabase
        .from('ai_highlights')
        .upsert(rows, {
          onConflict: 'project_id,date,metric_name',
          ignoreDuplicates: false,
        })

      if (upsertError) {
        console.error(`Failed to upsert highlights for project ${project.id}:`, upsertError.message)
        continue
      }

      totalHighlights += rows.length
    }

    return NextResponse.json({
      success: true,
      projectsProcessed: projects.length,
      highlightsUpserted: totalHighlights,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
