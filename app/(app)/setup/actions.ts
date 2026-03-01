'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { normalizePlatform } from '@/lib/import/column-mappings'

function normalizeDateStr(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const slashYmd = trimmed.match(/^(\d{4})[\/.](\d{1,2})[\/.](\d{1,2})$/)
  if (slashYmd) return `${slashYmd[1]}-${slashYmd[2].padStart(2, '0')}-${slashYmd[3].padStart(2, '0')}`
  const slashMdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMdy) return `${slashMdy[3]}-${slashMdy[1].padStart(2, '0')}-${slashMdy[2].padStart(2, '0')}`
  const jpDate = trimmed.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/)
  if (jpDate) return `${jpDate[1]}-${jpDate[2].padStart(2, '0')}-${jpDate[3].padStart(2, '0')}`
  const parsed = Date.parse(trimmed)
  if (!isNaN(parsed)) {
    const d = new Date(parsed)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return null
}

interface SetupInput {
  orgName: string
  projectName: string
  platform: string[]
  northStarKpi: string
  subKpis: string[]
  columnMappings: Record<string, string>
  csvData?: Record<string, string>[]
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

  // 4. Import data to outcomes table using proper normalization
  console.log(`[Setup] csvData: ${input.csvData?.length ?? 0} rows, mappings: ${JSON.stringify(Object.keys(input.columnMappings))}`)
  if (input.csvData && input.csvData.length > 0 && Object.keys(input.columnMappings).length > 0) {
    // Invert mapping: standard_field → CSV header name
    const fieldToHeader: Record<string, string> = {}
    for (const [csvHeader, field] of Object.entries(input.columnMappings)) {
      fieldToHeader[field] = csvHeader
    }

    const outcomeRows = input.csvData
      .map((row) => {
        const dateHeader = fieldToHeader.date
        const dateVal = dateHeader ? row[dateHeader] : null
        if (!dateVal) return null

        const normalizedDate = normalizeDateStr(dateVal)
        if (!normalizedDate) return null

        const campaignHeader = fieldToHeader.campaign
        const platformHeader = fieldToHeader.platform

        return {
          project_id: project.id,
          date: normalizedDate,
          platform: platformHeader && row[platformHeader]
            ? normalizePlatform(row[platformHeader])
            : 'google_ads',
          campaign: campaignHeader && row[campaignHeader] ? row[campaignHeader] : null,
          impressions: Math.round(parseFloat((row[fieldToHeader.impressions] || '0').replace(/,/g, '')) || 0),
          clicks: Math.round(parseFloat((row[fieldToHeader.clicks] || '0').replace(/,/g, '')) || 0),
          cost: parseFloat((row[fieldToHeader.cost] || '0').replace(/[¥$,]/g, '')) || 0,
          conversions: parseFloat((row[fieldToHeader.conversions] || '0').replace(/,/g, '')) || 0,
          revenue: parseFloat((row[fieldToHeader.revenue] || '0').replace(/[¥$,]/g, '')) || 0,
          custom_columns: {},
        }
      })
      .filter(Boolean) as Array<Record<string, unknown>>

    if (outcomeRows.length > 0) {
      for (let i = 0; i < outcomeRows.length; i += 500) {
        const batch = outcomeRows.slice(i, i + 500)
        const { error: importError } = await supabase
          .from('outcomes')
          .upsert(batch, {
            onConflict: 'project_id,date,platform,campaign',
            ignoreDuplicates: false,
          })
        if (importError) {
          console.error('Setup outcomes import error:', importError)
        }
      }
    }
  }

  redirect(`/app/${project.id}/dashboard`)
}
