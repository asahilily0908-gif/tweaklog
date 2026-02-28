'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UpdateProjectSetupInput {
  northStarKpi: string
  northStarKpiCustomName: string
  subKpis: string[]
  columnMappings: Record<string, string>
  metricConfigs: Array<{
    name: string
    displayName: string
    formula: string
    improvementDirection: 'up' | 'down'
  }>
}

/**
 * Update KPI settings and metric configs for an EXISTING project.
 *
 * This is for the project-level setup wizard (app/[project]/setup),
 * NOT for initial onboarding (app/(app)/setup/actions.ts → completeSetup).
 */
export async function updateProjectSetup(
  projectId: string,
  input: UpdateProjectSetupInput
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Resolve the actual KPI value (custom name if "custom" was selected)
  const resolvedKpi =
    input.northStarKpi === 'custom' && input.northStarKpiCustomName.trim()
      ? input.northStarKpiCustomName.trim()
      : input.northStarKpi

  // 1. Update project: north_star_kpi, sub_kpis, settings.column_mappings
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('settings')
    .eq('id', projectId)
    .single()

  if (fetchError) {
    return { error: `Failed to fetch project: ${fetchError.message}` }
  }

  const existingSettings =
    (existingProject?.settings as Record<string, unknown>) ?? {}

  const { error: updateError } = await supabase
    .from('projects')
    .update({
      north_star_kpi: resolvedKpi,
      sub_kpis: input.subKpis,
      settings: {
        ...existingSettings,
        column_mappings: input.columnMappings,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  if (updateError) {
    return { error: `Failed to update project: ${updateError.message}` }
  }

  // 2. UPSERT metric_configs
  //    Delete existing configs for this project, then insert new ones.
  //    This ensures removed metrics are cleaned up and sort_order is reset.
  if (input.metricConfigs.length > 0) {
    // Remove existing metric configs for this project
    const { error: deleteError } = await supabase
      .from('metric_configs')
      .delete()
      .eq('project_id', projectId)

    if (deleteError) {
      return { error: `Failed to clear existing metrics: ${deleteError.message}` }
    }

    // Insert new metric configs
    const metricRows = input.metricConfigs.map((m, i) => ({
      project_id: projectId,
      name: m.name,
      display_name: m.displayName,
      formula: m.formula,
      improvement_direction: m.improvementDirection,
      sort_order: i,
    }))

    const { error: insertError } = await supabase
      .from('metric_configs')
      .insert(metricRows)

    if (insertError) {
      return { error: `Failed to save metrics: ${insertError.message}` }
    }
  }

  // Revalidate affected pages
  revalidatePath(`/app/${projectId}/setup`)
  revalidatePath(`/app/${projectId}/settings`)
  revalidatePath(`/app/${projectId}/dashboard`)
  revalidatePath(`/app/${projectId}/experiments`)

  return { success: true }
}
