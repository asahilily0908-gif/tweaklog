'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- Update project name, org name, platforms ---

export async function updateProject(
  projectId: string,
  input: { name: string; orgName: string; platforms: string[] }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Update project
  const { error: projError } = await supabase
    .from('projects')
    .update({ name: input.name, platform: input.platforms, updated_at: new Date().toISOString() })
    .eq('id', projectId)

  if (projError) return { error: projError.message }

  // Get org_id to update org name
  const { data: proj } = await supabase
    .from('projects')
    .select('org_id')
    .eq('id', projectId)
    .single()

  if (proj) {
    const { error: orgError } = await supabase
      .from('organizations')
      .update({ name: input.orgName, updated_at: new Date().toISOString() })
      .eq('id', proj.org_id)

    if (orgError) return { error: orgError.message }
  }

  revalidatePath(`/app/${projectId}/settings`)
  revalidatePath(`/app/${projectId}/dashboard`)
  return { success: true }
}

// --- Update North Star KPI and Sub KPIs ---

export async function updateKpiSettings(
  projectId: string,
  input: { northStarKpi: string; subKpis: string[] }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('projects')
    .update({
      north_star_kpi: input.northStarKpi,
      sub_kpis: input.subKpis,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  if (error) return { error: error.message }

  revalidatePath(`/app/${projectId}/settings`)
  revalidatePath(`/app/${projectId}/dashboard`)
  revalidatePath(`/app/${projectId}/experiments`)
  return { success: true }
}

// --- Save (create or update) a metric config ---

export async function saveMetricConfig(
  projectId: string,
  input: {
    id?: string
    name: string
    displayName: string
    formula: string
    improvementDirection: 'up' | 'down'
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (input.id) {
    // Update existing
    const { error } = await supabase
      .from('metric_configs')
      .update({
        name: input.name,
        display_name: input.displayName,
        formula: input.formula,
        improvement_direction: input.improvementDirection,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)

    if (error) return { error: error.message }
  } else {
    // Get next sort_order
    const { data: existing } = await supabase
      .from('metric_configs')
      .select('sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

    const { error } = await supabase.from('metric_configs').insert({
      project_id: projectId,
      name: input.name,
      display_name: input.displayName,
      formula: input.formula,
      improvement_direction: input.improvementDirection,
      sort_order: nextOrder,
    })

    if (error) return { error: error.message }
  }

  revalidatePath(`/app/${projectId}/settings`)
  revalidatePath(`/app/${projectId}/dashboard`)
  return { success: true }
}

// --- Delete a metric config ---

export async function deleteMetricConfig(configId: string, projectId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('metric_configs')
    .delete()
    .eq('id', configId)

  if (error) return { error: error.message }

  revalidatePath(`/app/${projectId}/settings`)
  revalidatePath(`/app/${projectId}/dashboard`)
  return { success: true }
}

// --- Create an experiment group ---

export async function createExperimentGroup(
  projectId: string,
  input: { name: string; status: 'testing' | 'steady' | 'completed'; campaignPatterns: string[]; note: string }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('experiment_groups').insert({
    project_id: projectId,
    name: input.name,
    status: input.status,
    campaign_patterns: input.campaignPatterns,
    note: input.note || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/app/${projectId}/settings`)
  revalidatePath(`/app/${projectId}/experiments`)
  revalidatePath(`/app/${projectId}/dashboard`)
  return { success: true }
}

// --- Update an experiment group ---

export async function updateExperimentGroup(
  groupId: string,
  projectId: string,
  input: { name: string; status: 'testing' | 'steady' | 'completed'; campaignPatterns: string[]; note: string }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('experiment_groups')
    .update({
      name: input.name,
      status: input.status,
      campaign_patterns: input.campaignPatterns,
      note: input.note || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupId)

  if (error) return { error: error.message }

  revalidatePath(`/app/${projectId}/settings`)
  revalidatePath(`/app/${projectId}/experiments`)
  revalidatePath(`/app/${projectId}/dashboard`)
  return { success: true }
}

// --- Delete an experiment group ---

export async function deleteExperimentGroup(groupId: string, projectId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('experiment_groups')
    .delete()
    .eq('id', groupId)

  if (error) return { error: error.message }

  revalidatePath(`/app/${projectId}/settings`)
  revalidatePath(`/app/${projectId}/experiments`)
  revalidatePath(`/app/${projectId}/dashboard`)
  return { success: true }
}

// --- Delete the entire project ---

export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) return { error: error.message }

  // Find another project to redirect to, or go to setup
  const { data: remaining } = await supabase
    .from('projects')
    .select('id')
    .limit(1)
    .single()

  if (remaining) {
    redirect(`/app/${remaining.id}/dashboard`)
  } else {
    redirect('/setup')
  }
}
