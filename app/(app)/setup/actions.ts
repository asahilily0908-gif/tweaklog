'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface SetupInput {
  orgName: string
  projectName: string
  platform: string[]
  northStarKpi: string
  subKpis: string[]
  columnMappings: Record<string, string>
  csvHeaders?: string[]
  csvRows?: string[][]
  metricConfigs: {
    name: string
    displayName: string
    formula: string
    improvementDirection: 'up' | 'down'
  }[]
}

export async function completeSetup(input: SetupInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // 1. Create organization + add user as owner (atomic, bypasses RLS)
  const slug = input.orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .concat('-', Date.now().toString(36))

  const { data: orgId, error: orgError } = await supabase.rpc(
    'create_org_with_owner',
    {
      org_name: input.orgName,
      org_slug: slug,
      org_plan: 'free',
      org_trial_ends_at: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString(),
    }
  )

  if (orgError) {
    return { error: `Failed to create organization: ${orgError.message}` }
  }

  // 2. Create project (user is now an org member, so RLS passes)
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      org_id: orgId,
      name: input.projectName,
      platform: input.platform,
      north_star_kpi: input.northStarKpi,
      sub_kpis: input.subKpis,
      settings: {
        column_mappings: input.columnMappings,
      },
    })
    .select('id')
    .single()

  if (projectError) {
    return { error: `Failed to create project: ${projectError.message}` }
  }

  // 3. Save metric configs
  if (input.metricConfigs.length > 0) {
    const metricRows = input.metricConfigs.map((m, i) => ({
      project_id: project.id,
      name: m.name,
      display_name: m.displayName,
      formula: m.formula,
      improvement_direction: m.improvementDirection,
      sort_order: i,
    }))

    const { error: metricsError } = await supabase
      .from('metric_configs')
      .insert(metricRows)

    if (metricsError) {
      return { error: `Failed to save metrics: ${metricsError.message}` }
    }
  }

  // 4. Import CSV/Spreadsheet data to outcomes if provided
  if (input.csvHeaders && input.csvRows && input.csvRows.length > 0) {
    const headerIndexMap = new Map<string, number>()
    input.csvHeaders.forEach((h, i) => headerIndexMap.set(h, i))

    const outcomeRows = input.csvRows
      .map((row) => {
        const record: Record<string, unknown> = {
          project_id: project.id,
        }
        for (const [csvHeader, field] of Object.entries(input.columnMappings)) {
          const idx = headerIndexMap.get(csvHeader)
          if (idx === undefined || idx >= row.length) continue
          const val = row[idx]
          if (!val || val.trim() === '') continue

          switch (field) {
            case 'date':
              record.date = val
              break
            case 'campaign':
              record.campaign = val
              break
            case 'impressions':
              record.impressions = parseFloat(val.replace(/,/g, '')) || 0
              break
            case 'clicks':
              record.clicks = parseFloat(val.replace(/,/g, '')) || 0
              break
            case 'cost':
              record.cost = parseFloat(val.replace(/[¥$,]/g, '')) || 0
              break
            case 'conversions':
              record.conversions = parseFloat(val.replace(/,/g, '')) || 0
              break
            case 'revenue':
              record.revenue = parseFloat(val.replace(/[¥$,]/g, '')) || 0
              break
            case 'platform':
              record.platform = val
              break
          }
        }
        // Must have at least a date
        if (!record.date) return null
        return record
      })
      .filter(Boolean)

    if (outcomeRows.length > 0) {
      // Insert in batches of 500
      for (let i = 0; i < outcomeRows.length; i += 500) {
        const batch = outcomeRows.slice(i, i + 500)
        await supabase.from('outcomes').insert(batch)
      }
    }
  }

  redirect(`/app/${project.id}/dashboard`)
}
