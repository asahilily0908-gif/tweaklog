import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluateFormula } from '@/lib/metrics/formula-evaluator'

export async function POST(request: NextRequest) {
  const { projectId, formula } = (await request.json()) as {
    projectId: string
    formula: string
  }

  if (!projectId || !formula) {
    return NextResponse.json({ error: 'Missing projectId or formula' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the last 7 days of outcomes (aggregated by date)
  const { data: outcomes, error } = await supabase
    .from('outcomes')
    .select('date, impressions, clicks, cost, conversions, revenue, custom_columns')
    .eq('project_id', projectId)
    .order('date', { ascending: false })
    .limit(100) // fetch extra rows to aggregate by date

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate by date (sum across platforms/campaigns)
  const byDate = new Map<
    string,
    { impressions: number; clicks: number; cost: number; conversions: number; revenue: number; custom: Record<string, number> }
  >()

  for (const row of outcomes ?? []) {
    const existing = byDate.get(row.date) ?? {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      revenue: 0,
      custom: {},
    }
    existing.impressions += Number(row.impressions) || 0
    existing.clicks += Number(row.clicks) || 0
    existing.cost += Number(row.cost) || 0
    existing.conversions += Number(row.conversions) || 0
    existing.revenue += Number(row.revenue) || 0

    // Merge custom columns
    if (row.custom_columns && typeof row.custom_columns === 'object') {
      for (const [key, val] of Object.entries(row.custom_columns as Record<string, number>)) {
        existing.custom[key] = (existing.custom[key] ?? 0) + (Number(val) || 0)
      }
    }

    byDate.set(row.date, existing)
  }

  // Take the 7 most recent dates
  const dates = Array.from(byDate.keys()).sort().slice(-7)

  const preview = dates.map((date) => {
    const d = byDate.get(date)!
    const variables: Record<string, number | null> = {
      Impressions: d.impressions,
      impressions: d.impressions,
      Clicks: d.clicks,
      clicks: d.clicks,
      Cost: d.cost,
      cost: d.cost,
      Conversions: d.conversions,
      conversions: d.conversions,
      Revenue: d.revenue,
      revenue: d.revenue,
      ...d.custom,
    }

    const result = evaluateFormula(formula, variables)
    return {
      date,
      value: result.value !== null ? Math.round(result.value * 10000) / 10000 : null,
      error: result.error,
    }
  })

  return NextResponse.json({ preview })
}
