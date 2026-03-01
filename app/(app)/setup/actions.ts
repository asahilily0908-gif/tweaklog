'use server'

import { createClient } from '@/lib/supabase/server'

interface SetupInput {
  orgName: string
  projectName: string
  platform: string[]
  northStarKpi: string
  subKpis: string[]
  columnMappings: Record<string, string>
  sheetsUrl?: string
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

  // 4. Save spreadsheet config if URL was provided
  if (input.sheetsUrl) {
    const sheetIdMatch = input.sheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    const gidMatch = input.sheetsUrl.match(/[?&]gid=(\d+)/)
    await supabase.from('spreadsheet_configs').upsert({
      project_id: project.id,
      spreadsheet_url: input.sheetsUrl,
      sheet_id: sheetIdMatch?.[1] || '',
      gid: gidMatch?.[1] || '0',
      column_mappings: input.columnMappings,
    }, { onConflict: 'project_id' })
  }

  return { projectId: project.id }
}
