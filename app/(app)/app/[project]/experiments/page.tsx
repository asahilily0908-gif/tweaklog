import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ExperimentsContent from '@/components/experiments/ExperimentsContent'

export const metadata = {
  title: 'Experiments | Tweaklog',
}

export default async function ExperimentsPage({
  params,
}: {
  params: Promise<{ project: string }>
}) {
  const { project: projectId } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, platform, north_star_kpi, sub_kpis')
    .eq('id', projectId)
    .single()

  if (!project) {
    notFound()
  }

  const { data: experiments } = await supabase
    .from('experiments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: outcomes } = await supabase
    .from('outcomes')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: true })

  const { data: experimentGroups } = await supabase
    .from('experiment_groups')
    .select('id, name, status, campaign_patterns, note')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  return (
    <div className="animate-fade-in-up">
      <ExperimentsContent
        project={project}
        experiments={experiments ?? []}
        outcomes={outcomes ?? []}
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
