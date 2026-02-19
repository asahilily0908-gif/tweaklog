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

  // 1. Create organization
  const slug = input.orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .concat('-', Date.now().toString(36))

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: input.orgName,
      slug,
      plan: 'free',
      trial_ends_at: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    .select('id')
    .single()

  if (orgError) {
    return { error: `Failed to create organization: ${orgError.message}` }
  }

  // 2. Add user as owner
  const { error: memberError } = await supabase.from('org_members').insert({
    org_id: org.id,
    user_id: user.id,
    role: 'owner',
  })

  if (memberError) {
    return { error: `Failed to add member: ${memberError.message}` }
  }

  // 3. Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      org_id: org.id,
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

  // 4. Save metric configs
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

  redirect(`/app/${project.id}/dashboard`)
}
