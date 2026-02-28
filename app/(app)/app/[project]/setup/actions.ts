'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { WizardData } from '@/components/setup/SetupWizard'

export async function updateProjectSetup(
  projectId: string,
  data: WizardData
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Resolve north_star_kpi value
  const northStarKpi =
    data.northStarKpi === 'custom'
      ? data.northStarKpiCustomName.trim()
      : data.northStarKpi

  // 1. Update project
  const { error: projectError } = await supabase
    .from('projects')
    .update({
      north_star_kpi: northStarKpi,
      sub_kpis: data.subKpis,
      settings: {
        column_mappings: data.columnMappings,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  if (projectError) {
    return { error: `プロジェクトの更新に失敗しました: ${projectError.message}` }
  }

  // 2. Replace metric configs (delete + insert)
  if (data.metricConfigs.length > 0) {
    const { error: deleteError } = await supabase
      .from('metric_configs')
      .delete()
      .eq('project_id', projectId)

    if (deleteError) {
      return { error: `指標設定の削除に失敗しました: ${deleteError.message}` }
    }

    const metricRows = data.metricConfigs.map((m, i) => ({
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
      return { error: `指標設定の保存に失敗しました: ${insertError.message}` }
    }
  }

  revalidatePath(`/app/${projectId}/dashboard`)
  revalidatePath(`/app/${projectId}/settings`)

  return { success: true }
}
