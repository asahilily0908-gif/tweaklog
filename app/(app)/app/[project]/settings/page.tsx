import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SettingsContent from '@/components/settings/SettingsContent'

export const metadata = {
  title: 'Settings | Tweaklog',
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ project: string }>
}) {
  const { project: projectId } = await params
  const supabase = await createClient()

  // Fetch project details
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, platform, north_star_kpi, sub_kpis, org_id')
    .eq('id', projectId)
    .single()

  if (!project) {
    notFound()
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch org name, metric configs, outcomes sample, experiment groups, and distinct campaigns in parallel
  const [orgResult, metricsResult, outcomesResult, groupsResult, campaignsResult] = await Promise.all([
    supabase
      .from('organizations')
      .select('name')
      .eq('id', project.org_id)
      .single(),
    supabase
      .from('metric_configs')
      .select('id, name, display_name, formula, improvement_direction, sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('outcomes')
      .select('custom_columns')
      .eq('project_id', projectId)
      .limit(10),
    supabase
      .from('experiment_groups')
      .select('id, name, status, campaign_patterns, note')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true }),
    supabase
      .from('outcomes')
      .select('campaign')
      .eq('project_id', projectId)
      .not('campaign', 'is', null),
  ])

  // Extract unique custom column names from outcomes
  const customColumnNames = new Set<string>()
  for (const row of outcomesResult.data ?? []) {
    if (row.custom_columns && typeof row.custom_columns === 'object') {
      for (const key of Object.keys(row.custom_columns as Record<string, unknown>)) {
        customColumnNames.add(key)
      }
    }
  }

  return (
    <div className="animate-fade-in-up">
    <SettingsContent
      project={{
        id: project.id,
        name: project.name,
        platform: project.platform ?? [],
        north_star_kpi: project.north_star_kpi,
        sub_kpis: project.sub_kpis ?? [],
        org_id: project.org_id,
      }}
      orgName={orgResult.data?.name ?? ''}
      metricConfigs={(metricsResult.data ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        displayName: m.display_name,
        formula: m.formula,
        improvementDirection: m.improvement_direction as 'up' | 'down',
        sortOrder: m.sort_order,
      }))}
      customColumnNames={Array.from(customColumnNames)}
      experimentGroups={(groupsResult.data ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        status: g.status as 'testing' | 'steady' | 'completed',
        campaignPatterns: g.campaign_patterns ?? [],
        note: g.note ?? '',
      }))}
      knownCampaigns={Array.from(new Set((campaignsResult.data ?? []).map((r) => r.campaign).filter((c): c is string => !!c)))}
      userId={user?.id}
    />
    </div>
  )
}
