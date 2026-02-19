import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DashboardContent from '@/components/dashboard/DashboardContent'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'

export const metadata = {
  title: 'Dashboard | Tweaklog',
}

async function DashboardData({ projectId }: { projectId: string }) {
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!project) {
    notFound()
  }

  const { data: dateRange } = await supabase
    .from('outcomes')
    .select('date')
    .eq('project_id', projectId)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  const latestDate = dateRange?.date ?? new Date().toISOString().split('T')[0]

  const { data: outcomes } = await supabase
    .from('outcomes')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: true })

  const { data: rawExperiments } = await supabase
    .from('experiments')
    .select('*, profiles!user_id(email)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(10)

  const experiments = (rawExperiments ?? []).map((e: any) => ({
    ...e,
    user_email: e.profiles?.email ?? null,
    profiles: undefined,
  }))

  const { data: metricConfigs } = await supabase
    .from('metric_configs')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  const { data: aiHighlights } = await supabase
    .from('ai_highlights')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false })
    .limit(5)

  const { data: experimentGroups } = await supabase
    .from('experiment_groups')
    .select('id, name, status, campaign_patterns')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  return (
    <div className="animate-fade-in-up">
      <DashboardContent
        project={project}
        outcomes={outcomes ?? []}
        experiments={experiments}
        metricConfigs={metricConfigs ?? []}
        latestDate={latestDate}
        aiHighlights={aiHighlights ?? []}
        experimentGroups={(experimentGroups ?? []).map((g) => ({
          id: g.id,
          name: g.name,
          status: g.status as 'testing' | 'steady' | 'completed',
          campaignPatterns: g.campaign_patterns ?? [],
        }))}
      />
    </div>
  )
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ project: string }>
}) {
  const { project: projectId } = await params

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData projectId={projectId} />
    </Suspense>
  )
}
